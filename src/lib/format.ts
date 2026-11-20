export function formatUsd(amount: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function progressPercent(raised: number, goal: number): number {
  if (goal <= 0) return 0
  return clamp(Math.round((raised / goal) * 1000) / 10, 0, 100)
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length < 10) return address
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`
}

export function truncateHash(hash: string): string {
  if (hash.length < 14) return hash
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`
}

/** Local calendar day key (YYYY-MM-DD) — not UTC. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayKey(date = new Date()): string {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}
