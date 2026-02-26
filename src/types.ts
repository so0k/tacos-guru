export interface Criterion {
  id: number
  name: string
  short: string
  category: string
  defaultWeight: number
  maxWeight: number
  description: string
}

export interface Platform {
  id: string
  name: string
  url: string
  icon: string
  color: string
  scores: number[]
  rationales: string[]
  tagline: string
}

export interface RankedPlatform extends Platform {
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
  perUser: number
  perResource: number
  perRun: number
  maxUsers: number | null
  maxResources: number | null
  maxRuns: number | null
  minUsers?: number
  estimated: boolean
  features: Record<string, boolean>
  notes: string
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

export interface PricingData {
  platforms: Record<string, PlatformPricing>
  featureLabels: Record<string, string>
  sliders: Record<string, PricingSliderConfig>
}

export interface EvalData {
  criteria: Criterion[]
  platforms: Platform[]
  scoreLabels: string[]
  categories: Record<string, { label: string; color: string }>
  pricing: PricingData
}

export interface PricingInputs {
  users: number
  resources: number
  runs: number
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
  allTiers: Array<{ tier: PricingTier; cost: number; canHandle: boolean }>
}
