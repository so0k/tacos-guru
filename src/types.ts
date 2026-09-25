export interface CriterionVariant {
  id: string
  label: string
}

export interface Criterion {
  id: number
  name: string
  short: string
  category: string
  defaultWeight: number
  maxWeight: number
  description: string
  variants?: CriterionVariant[]
  defaultVariant?: string
}

export interface Gate {
  id: string
  label: string
}

export interface GateResult {
  pass: boolean
  evidence: string
  url: string
}

export interface ExcludedEntry {
  name: string
  url: string
  reason: string
}

export interface Platform {
  id: string
  name: string
  url: string
  icon: string
  color: string
  scores: number[]
  rationales: string[]
  // criterion id (as string) -> variant id -> score
  variants?: Record<string, Record<string, number>>
  gates?: Record<string, GateResult>
  disqualified?: boolean
  tagline: string
}

export interface RankedPlatform extends Platform {
  effectiveScores: number[]
  weightedScore: number
  maxPossible: number
  percentage: number
  rank: number
  defaultRank: number
  rankDelta: number
}

export interface PricingTier {
  name: string
  basePrice: number
  includedUsers: number | null
  includedResources: number | null
  includedRuns: number | null
  includedStacks: number | null
  perUser: number
  perResource: number
  perRun: number
  perStack: number
  maxUsers: number | null
  maxResources: number | null
  maxRuns: number | null
  maxStacks: number | null
  minUsers?: number
  estimated: boolean
  quoteOnly: boolean
  autoSelect: boolean
  features: Record<string, boolean>
  notes: string
  source: string
}

export interface PlatformPricing {
  model: string
  description: string
  tiers: PricingTier[]
}

export interface PricingSliderConfig {
  min: number
  max: number
  default: number
  step: number
  label: string
  unit: string
}

export interface PricingScoreBand {
  max: number
  score: number
}

export interface PricingScoreConfig {
  bands: PricingScoreBand[]
  above: number
  quoteOnly: number
}

export interface PricingData {
  platforms: Record<string, PlatformPricing>
  featureLabels: Record<string, string>
  pricingScore: PricingScoreConfig
  sliders: Record<string, PricingSliderConfig>
}

export interface EvalData {
  researched: string
  criteria: Criterion[]
  gates: Gate[]
  excluded: ExcludedEntry[]
  platforms: Platform[]
  scoreLabels: string[]
  categories: Record<string, { label: string; color: string }>
  pricing: PricingData
}

export interface PricingInputs {
  users: number
  resources: number
  runs: number
  stacks: number
}

export interface PricingResult {
  platformId: string
  platformName: string
  platformColor: string
  platformIcon: string
  platformUrl: string
  model: string
  description: string
  selectedTier: PricingTier
  monthlyCost: number
  exceeds: boolean
  quoteOnly: boolean
  allTiers: Array<{ tier: PricingTier; cost: number; canHandle: boolean }>
}
