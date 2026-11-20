export interface DemoAccount {
  id: string
  displayName: string
  email: string
  /** Demo-only flag — no real credentials stored. */
  isDemo: true
  createdAt: string
}

export interface ChallengeDef {
  id: string
  title: string
  amountUsd: number
  repeatDaily: boolean
  isDefault: boolean
}

export interface DayRecord {
  date: string
  completedIds: string[]
}

export interface BloomsState {
  challenges: ChallengeDef[]
  /** Completed challenge ids for the current local calendar day. */
  todayCompletedIds: string[]
  todayDate: string
  history: DayRecord[]
  /** Consecutive local days with ≥1 completed challenge. */
  streak: number
  /** Last local day that counted toward the streak. */
  lastStreakDate: string | null
  badges: string[]
}

export type GardenStage = 'seed' | 'sprout' | 'growing' | 'bloom'
