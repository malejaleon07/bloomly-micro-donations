import { getAddress, keccak256, toBytes, type Address } from 'viem'

/**
 * Deterministic demo recipient EOAs per campaign.
 * These are unlabeled EOAs used only as on-chain destination addresses for
 * hackathon demo attribution — Bloomly does not hold their keys.
 */
export function demoRecipientFor(campaignId: string): Address {
  const hash = keccak256(toBytes(`bloomly:demo-recipient:v1:${campaignId}`))
  return getAddress(`0x${hash.slice(-40)}`)
}
