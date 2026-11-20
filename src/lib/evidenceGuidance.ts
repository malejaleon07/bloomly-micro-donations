import {
  EVIDENCE_TYPE_LABELS,
  type Category,
  type EvidenceType,
} from '../types/campaign'

export type EvidenceExample = {
  type: EvidenceType
  text: string
  fileName?: string
}

export type EvidenceGuidance = {
  summary: string
  examples: EvidenceExample[]
}

export type DemoProofPacket = {
  title: string
  amount: string
  story: string
  howMoneyUsed: string
  expenses: { label: string; amountUsd: number }[]
  evidence: EvidenceExample[]
}

/**
 * Ready-to-submit fictional packets for the hackathon demo.
 * Each one is sample text a reviewer can read as proof. No real documents.
 */
export const DEMO_PROOF: Record<Category, DemoProofPacket> = {
  'Food & Groceries': {
    title: 'Groceries until the next paycheck',
    amount: '80',
    story:
      'Fictional demo: a neighbor’s pantry ran low between paychecks. This sample request covers two weeks of simple groceries so meals can stay consistent. No real household or store account is described.',
    howMoneyUsed: 'Sample funds would buy rice, eggs, beans, oats, and produce.',
    expenses: [
      { label: 'Rice, beans, and oats', amountUsd: 37 },
      { label: 'Eggs and produce', amountUsd: 43 },
    ],
    evidence: [
      {
        type: 'groceries_budget',
        fileName: 'sample-grocery-budget.pdf',
        text: 'Sample grocery budget · $80',
      },
    ],
  },
  'Housing & Rent': {
    title: 'Bridge a rent shortfall this month',
    amount: '450',
    story:
      'Fictional demo: hours were cut at a night-shift job, leaving a sample rent gap for a shared apartment. Friends in the story already covered part of it. This request is the remaining sample amount so the person can stay housed.',
    howMoneyUsed: 'Sample funds would cover the remaining rent shortfall for this month.',
    expenses: [{ label: 'Sample rent shortfall', amountUsd: 450 }],
    evidence: [
      {
        type: 'rent_bill',
        fileName: 'sample-rent-note.pdf',
        text: 'Sample rent note · $450',
      },
    ],
  },
  'Baby Essentials': {
    title: 'Baby essentials starter kit',
    amount: '85',
    story:
      'Fictional demo: a new parent needs diapers, wipes, and two bottles for the first month. Clothing in the story came from a local shelf. This sample request covers only the consumables that run out quickly.',
    howMoneyUsed: 'Sample funds would buy diapers, wipes, and two bottles.',
    expenses: [
      { label: 'Diapers', amountUsd: 45 },
      { label: 'Wipes and bottles', amountUsd: 40 },
    ],
    evidence: [
      {
        type: 'baby_estimate',
        fileName: 'sample-baby-estimate.pdf',
        text: 'Sample baby estimate · $85',
      },
    ],
  },
  Utilities: {
    title: 'Keep the heat on through midterms',
    amount: '160',
    story:
      'Fictional demo: a sample utility bill arrived during midterm week. This request covers the past-due portion in the story so the heat in the example can stay on until the next paycheck.',
    howMoneyUsed: 'Sample funds would pay the past-due heat and electricity amount.',
    expenses: [{ label: 'Sample past-due utility bill', amountUsd: 160 }],
    evidence: [
      {
        type: 'utilities',
        fileName: 'sample-utility-bill.pdf',
        text: 'Sample utility bill · $160',
      },
    ],
  },
  Transportation: {
    title: 'Two-week transit pass for interviews',
    amount: '55',
    story:
      'Fictional demo: three in-town interviews are on the calendar, and a short transit pass in the story would cover those trips without taking money from groceries. The fare below is a sample.',
    howMoneyUsed: 'Sample funds would buy a two-week transit pass for the interviews.',
    expenses: [{ label: 'Sample two-week transit pass', amountUsd: 55 }],
    evidence: [
      {
        type: 'transport_estimate',
        fileName: 'sample-transit-pass.pdf',
        text: 'Sample transit pass · $55',
      },
    ],
  },
  Other: {
    title: 'Laptop repair for remote classes',
    amount: '200',
    story:
      'Fictional demo: a cracked hinge and a weak battery make sample remote classes unreliable. This request matches a made-up repair quote so the coursework in the story can continue without buying a new computer.',
    howMoneyUsed: 'Sample funds would pay the Demo Repair Co. quote for the hinge and battery.',
    expenses: [{ label: 'Sample laptop repair quote', amountUsd: 200 }],
    evidence: [
      {
        type: 'other',
        fileName: 'sample-repair-quote.pdf',
        text: 'Sample repair quote · $200',
      },
    ],
  },
}

/** Fictional prompts only — never ask for real documents or account numbers. */
export const EVIDENCE_GUIDANCE: Record<Category, EvidenceGuidance> = {
  'Food & Groceries': {
    summary:
      'Describe the groceries this request would cover. A short made-up budget with item names and a sample total that matches your expense lines gives reviewers enough context.',
    examples: [
      {
        type: 'groceries_budget',
        text: 'Fictional two-week grocery budget: rice, eggs, beans, oats, and produce. Sample total matches this request. No receipt or store account is attached.',
      },
    ],
  },
  'Housing & Rent': {
    summary:
      'Describe the housing cost, such as a rent gap or a shared-apartment payment. A fictional rent note with a sample month and amount is the right level of detail.',
    examples: [
      {
        type: 'rent_bill',
        text: 'Fictional March rent note for a shared apartment near campus. Sample shortfall matches the rent line on this request. No lease or bank statement is attached.',
      },
    ],
  },
  'Baby Essentials': {
    summary:
      'List the baby items the funds would buy. Sample quantities and prices that add up to your expense lines are enough for this demo.',
    examples: [
      {
        type: 'baby_estimate',
        text: 'Fictional starter-kit estimate: one box of diapers, two packs of wipes, and two bottles. Sample prices only. No medical or identity documents.',
      },
    ],
  },
  Utilities: {
    summary:
      'Describe the utility cost, such as heat or electricity for one month. Use a made-up account reference and a sample amount that matches your expense line.',
    examples: [
      {
        type: 'utilities',
        text: 'Fictional midwinter utility estimate for heat and electricity. Sample account 0000. The amount matches the utility line. No real bill is attached.',
      },
    ],
  },
  Transportation: {
    summary:
      'Explain the trip or pass the funds would cover. A sample fare that matches your expense lines is enough.',
    examples: [
      {
        type: 'transport_estimate',
        text: 'Fictional two-week transit pass for three in-town interviews. Sample fare only. No transit card number.',
      },
    ],
  },
  Other: {
    summary:
      'Describe the cost in plain language. A fictional quote is enough. If the need is childcare, a made-up care estimate works too.',
    examples: [
      {
        type: 'other',
        text: 'Fictional repair quote from Demo Repair Co. for a laptop hinge and battery. Sample price matches this request. No invoice file is attached.',
      },
      {
        type: 'childcare_invoice',
        fileName: 'sample-care-invoice.pdf',
        text: 'Sample care invoice · $200',
      },
    ],
  },
}

export function evidenceExampleLabel(type: EvidenceType): string {
  return EVIDENCE_TYPE_LABELS[type]
}
