import {
  createPublicClient,
  decodeEventLog,
  encodeFunctionData,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseAbiItem,
  parseUnits,
  type Address,
  toHex,
  type Hash,
  type Hex,
  type TransactionReceipt,
} from 'viem'
import { arcTestnet } from 'viem/chains'
import {
  MIN_MAX_FEE_PER_GAS_GWEI,
  USDC_DECIMALS,
  USDC_ERC20_ADDRESS,
} from '../config/arc'
import type { Eip1193Provider } from '../wallet/ethereum'

export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
)

export const arcChain = arcTestnet

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(arcTestnet.rpcUrls.default.http[0]),
})

export function usdToUsdcUnits(amountUsd: number): bigint {
  const normalized = (Math.round(amountUsd * 100) / 100).toFixed(2)
  return parseUnits(normalized, USDC_DECIMALS)
}

export function usdcUnitsToUsd(units: bigint): number {
  return Number(formatUnits(units, USDC_DECIMALS))
}

export function isConfiguredRecipient(
  address: string | undefined | null,
): address is Address {
  if (!address || !isAddress(address)) return false
  try {
    const checksummed = getAddress(address)
    return checksummed !== '0x0000000000000000000000000000000000000000'
  } catch {
    return false
  }
}

export async function getUsdcBalance(address: Address): Promise<number> {
  const raw = await publicClient.readContract({
    address: USDC_ERC20_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  })
  return usdcUnitsToUsd(raw)
}

export function buildUsdcTransferData(to: Address, amountUsd: number): Hex {
  const value = usdToUsdcUnits(amountUsd)
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, value],
  })
}

/** Floor enforced by Arc mempool (docs: evm-differences). */
export function minFeeParams() {
  const floor = MIN_MAX_FEE_PER_GAS_GWEI * 1_000_000_000n
  return {
    maxFeePerGas: floor * 2n,
    maxPriorityFeePerGas: 1_000_000_000n,
  }
}

export async function waitForTx(hash: Hash) {
  return publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
    timeout: 90_000,
  })
}

export type VerifiedTransfer = {
  ok: true
  blockNumber: bigint
  from: Address
  to: Address
  amountUsd: number
  amountUnits: bigint
  receipt: TransactionReceipt
}

export type FailedTransfer = {
  ok: false
  reason: string
  status?: 'success' | 'reverted'
  blockNumber?: bigint
}

/**
 * Independently verify a donation from the on-chain receipt + USDC Transfer log.
 * Does not trust client-supplied amount/recipient beyond what we match against logs.
 */
export async function verifyUsdcTransferReceipt(input: {
  hash: Hash
  expectedFrom: Address
  expectedTo: Address
  expectedAmountUsd: number
}): Promise<VerifiedTransfer | FailedTransfer> {
  const receipt = await waitForTx(input.hash)

  if (receipt.status !== 'success') {
    return {
      ok: false,
      reason: 'Transaction reverted on-chain.',
      status: receipt.status,
      blockNumber: receipt.blockNumber,
    }
  }

  const contract = USDC_ERC20_ADDRESS.toLowerCase()
  if (receipt.to?.toLowerCase() !== contract) {
    return {
      ok: false,
      reason: 'Transaction was not sent to the Arc USDC contract.',
      status: receipt.status,
      blockNumber: receipt.blockNumber,
    }
  }

  const expectedUnits = usdToUsdcUnits(input.expectedAmountUsd)
  const expectedTo = getAddress(input.expectedTo)
  const expectedFrom = getAddress(input.expectedFrom)

  let matched: { from: Address; to: Address; value: bigint } | null = null

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract) continue
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName !== 'Transfer') continue
      const from = getAddress(decoded.args.from as Address)
      const to = getAddress(decoded.args.to as Address)
      const value = decoded.args.value as bigint
      if (
        from.toLowerCase() === expectedFrom.toLowerCase() &&
        to.toLowerCase() === expectedTo.toLowerCase() &&
        value === expectedUnits
      ) {
        matched = { from, to, value }
        break
      }
    } catch {
      // skip non-Transfer logs
    }
  }

  if (!matched) {
    return {
      ok: false,
      reason:
        'Could not verify a USDC Transfer log matching donor, recipient, and amount.',
      status: receipt.status,
      blockNumber: receipt.blockNumber,
    }
  }

  return {
    ok: true,
    blockNumber: receipt.blockNumber,
    from: matched.from,
    to: matched.to,
    amountUsd: usdcUnitsToUsd(matched.value),
    amountUnits: matched.value,
    receipt,
  }
}

export async function sendUsdcTransfer(input: {
  provider: Eip1193Provider
  from: Address
  to: Address
  amountUsd: number
}): Promise<Hash> {
  if (!isConfiguredRecipient(input.to)) {
    throw new Error('Recipient wallet is not configured.')
  }
  const amount = usdToUsdcUnits(input.amountUsd)
  const to = getAddress(input.to)
  const fees = minFeeParams()
  let gas = 150_000n
  try {
    const estimated = await publicClient.estimateContractGas({
      address: USDC_ERC20_ADDRESS,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
      account: input.from,
    })
    gas = (estimated * 12n) / 10n + 10_000n
  } catch {
    // A fixed limit still lets MetaMask send the transfer.
  }

  const tx = {
    from: input.from,
    to: USDC_ERC20_ADDRESS,
    data: buildUsdcTransferData(to, input.amountUsd),
    gas: toHex(gas),
    maxFeePerGas: toHex(fees.maxFeePerGas),
    maxPriorityFeePerGas: toHex(fees.maxPriorityFeePerGas),
  }

  const send = () =>
    input.provider.request({
      method: 'eth_sendTransaction',
      params: [tx],
    }) as Promise<Hash>

  try {
    return await send()
  } catch (err) {
    const code =
      typeof err === 'object' && err && 'code' in err
        ? (err as { code?: unknown }).code
        : undefined
    if (code !== 4100) throw err
    await input.provider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    })
    return await send()
  }
}

export function humanizeWalletError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err && 'shortMessage' in err
        ? String((err as { shortMessage: string }).shortMessage)
        : String(err)
  const lower = raw.toLowerCase()
  if (
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('rejected the request')
  ) {
    return 'You rejected the transaction in your wallet.'
  }
  if (lower.includes('insufficient') || lower.includes('exceeds balance')) {
    return 'Insufficient Arc Testnet USDC balance (or gas) for this transfer.'
  }
  if (lower.includes('not been authorized')) {
    return 'MetaMask has not approved Bloomly yet. Click Connect Wallet and approve the popup, then try again.'
  }
  if (
    lower.includes('does not match the target chain') ||
    lower.includes('unrecognized chain') ||
    lower.includes('chain id')
  ) {
    const current = raw.match(/id: (\d+)/)?.[1]
    return current
      ? `MetaMask is on chain ${current}, not Arc Testnet (5042002). Approve the network switch and try again.`
      : 'Wrong network. Switch to Arc Testnet and try again.'
  }
  return raw.slice(0, 240) || 'Transaction failed.'
}
