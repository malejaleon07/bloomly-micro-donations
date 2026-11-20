/**
 * Arc Testnet configuration — verified from official Circle / Arc docs.
 *
 * Sources:
 * - https://docs.arc.io/arc/references/connect-to-arc
 * - https://docs.arc.io/arc/references/rpc-endpoints
 * - https://docs.arc.io/arc/references/contract-addresses
 * - https://developers.circle.com/stablecoins/usdc-contract-addresses
 * - https://faucet.circle.com/
 *
 * Important: On Arc, USDC is the native gas token (18 decimals) AND exposes an
 * optional ERC-20 interface at the same address (6 decimals). Circle recommends
 * the ERC-20 interface for application-level transfers. Mempool requires
 * maxFeePerGas >= 20 Gwei.
 */

export const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    /** Native gas accounting uses 18 decimals. */
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.io'],
      webSocket: ['wss://rpc.testnet.arc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Testnet Explorer',
      url: 'https://explorer.testnet.arc.io',
    },
  },
  testnet: true,
} as const

/** ERC-20 USDC interface (6 decimals). Same address on mainnet and testnet. */
export const USDC_ERC20_ADDRESS =
  '0x3600000000000000000000000000000000000000' as const

/** ERC-20 USDC decimals for transfer amounts and balanceOf. */
export const USDC_DECIMALS = 6

/** Arc mempool silently drops txs below this floor. */
export const MIN_MAX_FEE_PER_GAS_GWEI = 20n

export const FAUCET_URL = 'https://faucet.circle.com/'

export const MAX_CAMPAIGN_GOAL_USD = 1500

export const DOC_SOURCES = {
  connect: 'https://docs.arc.io/arc/references/connect-to-arc',
  rpc: 'https://docs.arc.io/arc/references/rpc-endpoints',
  contracts: 'https://docs.arc.io/arc/references/contract-addresses',
  circleUsdc: 'https://developers.circle.com/stablecoins/usdc-contract-addresses',
  faucet: 'https://faucet.circle.com/',
  evmDifferences: 'https://docs.arc.io/arc/references/evm-differences',
} as const

export function explorerTxUrl(txHash: string): string {
  return `${ARC_TESTNET.blockExplorers.default.url}/tx/${txHash}`
}

export function explorerAddressUrl(address: string): string {
  return `${ARC_TESTNET.blockExplorers.default.url}/address/${address}`
}
