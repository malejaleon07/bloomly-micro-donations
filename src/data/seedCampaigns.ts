import { demoRecipientFor } from '../lib/recipients'
import type { Campaign } from '../types/campaign'

const now = new Date().toISOString()

function demoExtras(
  id: string,
  goal: number,
  expenseLabel: string,
  evidenceType: Campaign['evidence'][0]['type'],
): Pick<
  Campaign,
  | 'howMoneyUsed'
  | 'expenses'
  | 'evidence'
  | 'simulatedId'
  | 'autoCheckFlags'
  | 'recipientAddress'
> {
  return {
    howMoneyUsed: `Funds cover ${expenseLabel.toLowerCase()} as listed in the expense breakdown.`,
    expenses: [
      { id: `${id}-e1`, label: expenseLabel, amountUsd: goal },
    ],
    evidence: [
      {
        id: `${id}-ev1`,
        type: evidenceType,
        fictionalDescription: `Demo fictional note describing a ${evidenceType.replace(/_/g, ' ')} for this sample request. No real document attached.`,
      },
    ],
    simulatedId: { persona: 'passed', stripeIdentity: 'passed' },
    autoCheckFlags: [],
    recipientAddress: demoRecipientFor(id),
  }
}

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'demo-groceries-maya',
    title: 'Groceries until the next paycheck',
    category: 'Food & Groceries',
    story:
      'Maya is a student balancing classes and a part-time job. A delayed paycheck left her pantry empty for the next two weeks. This request covers staples—rice, produce, eggs, and transit snacks—so she can stay focused on finals without skipping meals.\n\nAny amount helps. Leftover funds will go to a campus food pantry.',
    goalUsd: 120,
    demoRaisedUsd: 38.5,
    status: 'approved',
    isDemo: true,
    createdAt: now,
    submittedAt: now,
    approvedAt: now,
    ...demoExtras('demo-groceries-maya', 120, 'Two weeks of groceries', 'groceries_budget'),
  },
  {
    id: 'demo-rent-jordan',
    title: 'Bridge a rent shortfall this month',
    category: 'Housing & Rent',
    story:
      'Jordan works nights and shares a small apartment near campus. Hours were cut unexpectedly, leaving a $450 gap before rent is due. Friends covered part of it; this campaign is for the rest so Jordan can stay housed while looking for extra shifts.\n\nDemo request for the Bloomly hackathon — labeled clearly as sample data.',
    goalUsd: 450,
    demoRaisedUsd: 175,
    status: 'approved',
    isDemo: true,
    createdAt: now,
    submittedAt: now,
    approvedAt: now,
    ...demoExtras('demo-rent-jordan', 450, 'Rent shortfall', 'rent_bill'),
  },
  {
    id: 'demo-baby-kit',
    title: 'Baby essentials starter kit',
    category: 'Baby Essentials',
    story:
      'A new parent needs diapers, wipes, and a few bottles for the first month. Local resources helped with clothing; this request covers consumables that run out quickly.\n\nThis is a demo campaign for UBC Blockchain Hackathon 2026.',
    goalUsd: 85,
    demoRaisedUsd: 42,
    status: 'approved',
    isDemo: true,
    createdAt: now,
    submittedAt: now,
    approvedAt: now,
    ...demoExtras('demo-baby-kit', 85, 'Diapers, wipes, bottles', 'baby_estimate'),
  },
  {
    id: 'demo-utilities-winter',
    title: 'Keep the heat on through midterms',
    category: 'Utilities',
    story:
      'An unexpected utility bill arrived during midterm week. This request covers the past-due portion so the heat stays on while the household catches up on the next paycheck cycle.',
    goalUsd: 160,
    demoRaisedUsd: 64,
    status: 'approved',
    isDemo: true,
    createdAt: now,
    submittedAt: now,
    approvedAt: now,
    ...demoExtras('demo-utilities-winter', 160, 'Past-due utility bill', 'utilities'),
  },
  {
    id: 'demo-transit-pass',
    title: 'Two-week transit pass for interviews',
    category: 'Transportation',
    story:
      'A recent grad has three in-person interviews scheduled across town. A short-term transit pass makes those trips possible without borrowing from grocery money.',
    goalUsd: 55,
    demoRaisedUsd: 18.25,
    status: 'approved',
    isDemo: true,
    createdAt: now,
    submittedAt: now,
    approvedAt: now,
    ...demoExtras('demo-transit-pass', 55, 'Two-week transit pass', 'transport_estimate'),
  },
  {
    id: 'demo-other-laptop-repair',
    title: 'Laptop repair for remote classes',
    category: 'Other',
    story:
      'A cracked hinge and failing battery make attending remote lectures unreliable. This campaign covers a shop repair quote so coursework can continue without buying a new machine.',
    goalUsd: 200,
    demoRaisedUsd: 91,
    status: 'approved',
    isDemo: true,
    createdAt: now,
    submittedAt: now,
    approvedAt: now,
    ...demoExtras('demo-other-laptop-repair', 200, 'Laptop repair quote', 'other'),
  },
]
