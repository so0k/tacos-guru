import type { PricingTier, PricingInputs, PricingResult, PricingData, Platform } from './types'

export function canTierHandle(tier: PricingTier, inputs: PricingInputs): boolean {
  if (tier.maxUsers !== null && inputs.users > tier.maxUsers) return false
  if (tier.maxResources !== null && inputs.resources > tier.maxResources) return false
  if (tier.maxRuns !== null && inputs.runs > tier.maxRuns) return false
  return true
}

export function computeTierCost(tier: PricingTier, inputs: PricingInputs): number {
  const effectiveUsers = tier.minUsers
    ? Math.max(inputs.users, tier.minUsers)
    : inputs.users

  const userOverage = tier.includedUsers !== null
    ? Math.max(0, effectiveUsers - tier.includedUsers)
    : tier.perUser > 0 ? effectiveUsers : 0

  const resourceOverage = tier.includedResources !== null
    ? Math.max(0, inputs.resources - tier.includedResources)
    : tier.perResource > 0 ? inputs.resources : 0

  const runOverage = tier.includedRuns !== null
    ? Math.max(0, inputs.runs - tier.includedRuns)
    : tier.perRun > 0 ? inputs.runs : 0

  return tier.basePrice
    + userOverage * tier.perUser
    + resourceOverage * tier.perResource
    + runOverage * tier.perRun
}

export function selectBestTier(
  tiers: PricingTier[],
  inputs: PricingInputs,
): { tier: PricingTier; cost: number; exceeds: boolean } {
  let bestTier: PricingTier | null = null
  let bestCost = Infinity

  for (const tier of tiers) {
    if (!canTierHandle(tier, inputs)) continue
    const cost = computeTierCost(tier, inputs)
    if (cost < bestCost) {
      bestCost = cost
      bestTier = tier
    }
  }

  if (!bestTier) {
    const lastTier = tiers[tiers.length - 1]
    return {
      tier: lastTier,
      cost: computeTierCost(lastTier, inputs),
      exceeds: true,
    }
  }

  return { tier: bestTier, cost: bestCost, exceeds: false }
}

export function computeAllPricingResults(
  pricingData: PricingData,
  platforms: Platform[],
  inputs: PricingInputs,
): PricingResult[] {
  const results: PricingResult[] = []

  for (const platform of platforms) {
    const pricing = pricingData.platforms[platform.id]
    if (!pricing) continue

    const { tier, cost, exceeds } = selectBestTier(pricing.tiers, inputs)

    const allTiers = pricing.tiers.map((t) => ({
      tier: t,
      cost: computeTierCost(t, inputs),
      canHandle: canTierHandle(t, inputs),
    }))

    results.push({
      platformId: platform.id,
      platformName: platform.name,
      platformColor: platform.color,
      platformIcon: platform.icon,
      platformUrl: platform.url,
      model: pricing.model,
      description: pricing.description,
      selectedTier: tier,
      monthlyCost: Math.round(cost),
      exceeds,
      allTiers,
    })
  }

  results.sort((a, b) => a.monthlyCost - b.monthlyCost)
  return results
}
