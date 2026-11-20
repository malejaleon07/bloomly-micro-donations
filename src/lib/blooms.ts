import { todayKey, yesterdayKey } from './format'
import type {
  BloomsState,
  ChallengeDef,
  DayRecord,
  GardenStage,
} from '../types/account'

const BLOOMS_KEY = 'bloomly:blooms:v1'

export const DEFAULT_CHALLENGES: ChallengeDef[] = [
  {
    id: 'default-study',
    title: 'Study 30 min',
    amountUsd: 0.05,
    repeatDaily: true,
    isDefault: true,
  },
  {
    id: 'default-workout',
    title: 'Workout',
    amountUsd: 0.1,
    repeatDaily: true,
    isDefault: true,
  },
  {
    id: 'default-read',
    title: 'Read 15 min',
    amountUsd: 0.05,
    repeatDaily: true,
    isDefault: true,
  },
  {
    id: 'default-kindness',
    title: 'Act of kindness',
    amountUsd: 0.25,
    repeatDaily: true,
    isDefault: true,
  },
]

const AFFIRMATIONS = [
  'You showed up for yourself today — that matters.',
  'Small care, tended daily, becomes a garden.',
  'Kindness to yourself makes room for kindness to others.',
  'One gentle step. You’re growing.',
  'Your effort is enough for today.',
  'Bloom at your own pace.',
]

function readRaw(): BloomsState | null {
  try {
    const raw = localStorage.getItem(BLOOMS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BloomsState
  } catch {
    return null
  }
}

function write(state: BloomsState): void {
  localStorage.setItem(BLOOMS_KEY, JSON.stringify(state))
}

export function createDefaultBlooms(): BloomsState {
  const today = todayKey()
  return {
    challenges: DEFAULT_CHALLENGES.map((c) => ({ ...c })),
    todayCompletedIds: [],
    todayDate: today,
    history: [],
    streak: 0,
    lastStreakDate: null,
    badges: [],
  }
}

function rollDayIfNeeded(state: BloomsState): BloomsState {
  const today = todayKey()
  if (state.todayDate === today) return state

  const history = [...state.history]
  if (state.todayCompletedIds.length > 0) {
    const existing = history.findIndex((h) => h.date === state.todayDate)
    const record: DayRecord = {
      date: state.todayDate,
      completedIds: [...state.todayCompletedIds],
    }
    if (existing >= 0) history[existing] = record
    else history.unshift(record)
  }

  const trimmed = history
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 60)

  let streak = state.streak
  let lastStreakDate = state.lastStreakDate
  const yest = yesterdayKey()
  if (lastStreakDate && lastStreakDate !== yest && lastStreakDate !== today) {
    streak = 0
    lastStreakDate = null
  }

  return {
    ...state,
    history: trimmed,
    todayDate: today,
    todayCompletedIds: [],
    streak,
    lastStreakDate,
  }
}

export function getBloomsState(): BloomsState {
  let state = readRaw() ?? createDefaultBlooms()
  if (!state.challenges?.length) {
    state = {
      ...state,
      challenges: DEFAULT_CHALLENGES.map((c) => ({ ...c })),
    }
  }
  const rolled = rollDayIfNeeded(state)
  write(rolled)
  return rolled
}

export function saveBloomsState(state: BloomsState): void {
  write(rollDayIfNeeded(state))
}

export function gardenStage(completedCount: number): GardenStage {
  if (completedCount >= 4) return 'bloom'
  if (completedCount >= 2) return 'growing'
  if (completedCount >= 1) return 'sprout'
  return 'seed'
}

export function suggestedDonateTotal(state: BloomsState): number {
  const map = new Map(state.challenges.map((c) => [c.id, c.amountUsd]))
  let total = 0
  for (const id of state.todayCompletedIds) {
    total += map.get(id) ?? 0
  }
  return Math.round(total * 100) / 100
}

export function toggleChallengeComplete(
  state: BloomsState,
  challengeId: string,
): { state: BloomsState; justCompleted: boolean; affirmation?: string } {
  const s = rollDayIfNeeded(state)
  const set = new Set(s.todayCompletedIds)
  let justCompleted = false
  if (set.has(challengeId)) {
    set.delete(challengeId)
  } else {
    set.add(challengeId)
    justCompleted = true
  }

  let streak = s.streak
  let lastStreakDate = s.lastStreakDate
  const today = todayKey()

  if (justCompleted && set.size === 1) {
    const yest = yesterdayKey()
    if (lastStreakDate === yest) streak += 1
    else if (lastStreakDate !== today) streak = 1
    lastStreakDate = today
  } else if (!justCompleted && set.size === 0 && lastStreakDate === today) {
    const yest = yesterdayKey()
    const hadYesterday = s.history.some(
      (h) => h.date === yest && h.completedIds.length > 0,
    )
    if (hadYesterday) {
      streak = Math.max(1, streak - 1)
      lastStreakDate = yest
    } else {
      streak = 0
      lastStreakDate = null
    }
  }

  const badges = [...s.badges]
  if (streak >= 3 && !badges.includes('streak-3')) badges.push('streak-3')
  if (streak >= 7 && !badges.includes('streak-7')) badges.push('streak-7')
  if (set.size >= 4 && !badges.includes('full-bloom-day')) {
    badges.push('full-bloom-day')
  }

  const next: BloomsState = {
    ...s,
    todayCompletedIds: [...set],
    streak,
    lastStreakDate,
    badges,
  }
  write(next)

  return {
    state: next,
    justCompleted,
    affirmation: justCompleted
      ? AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
      : undefined,
  }
}

export function upsertChallenge(
  state: BloomsState,
  challenge: ChallengeDef,
): BloomsState {
  const s = rollDayIfNeeded(state)
  const idx = s.challenges.findIndex((c) => c.id === challenge.id)
  const challenges = [...s.challenges]
  if (idx >= 0) challenges[idx] = challenge
  else challenges.push(challenge)
  const next = { ...s, challenges }
  write(next)
  return next
}

export function deleteChallenge(
  state: BloomsState,
  challengeId: string,
): BloomsState {
  const s = rollDayIfNeeded(state)
  const challenge = s.challenges.find((c) => c.id === challengeId)
  if (challenge?.isDefault) return s
  const next: BloomsState = {
    ...s,
    challenges: s.challenges.filter((c) => c.id !== challengeId),
    todayCompletedIds: s.todayCompletedIds.filter((id) => id !== challengeId),
  }
  write(next)
  return next
}

export function gardenLabel(stage: GardenStage): string {
  switch (stage) {
    case 'seed':
      return 'Seed'
    case 'sprout':
      return 'Sprout'
    case 'growing':
      return 'Growing'
    case 'bloom':
      return 'Bloom'
  }
}
