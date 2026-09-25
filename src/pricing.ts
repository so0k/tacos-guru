import type { PricingTier, PricingInputs, PricingResult, PricingData, Platform, PricingScoreConfig } from './types'

export function canTierHandle(tier: PricingTier, inputs: PricingInputs): boolean {
  if (tier.maxUsers !== null && inputs.users > tier.maxUsers) return false
  if (tier.maxResources !== null && inputs.resources > tier.maxResources) return false
  if (tier.maxRuns !== null && inputs.runs > tier.maxRuns) return false
  if (tier.maxStacks !== null && inputs.stacks > tier.maxStacks) return false
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

  const stackOverage = tier.includedStacks !== null
    ? Math.max(0, inputs.stacks - tier.includedStacks)
    : tier.perStack > 0 ? inputs.stacks : 0

  return tier.basePrice
    + userOverage * tier.perUser
    + resourceOverage * tier.perResource
    + runOverage * tier.perRun
    + stackOverage * tier.perStack
}

/**
 * Auto-selection order: cheapest priced, autoSelect-able tier that fits the
 * inputs; else the first quote-only, autoSelect-able tier that fits; else
 * the last tier, flagged as exceeding limits.
 */
export function selectBestTier(
  tiers: PricingTier[],
  inputs: PricingInputs,
): { tier: PricingTier; cost: number; exceeds: boolean; quoteOnly: boolean } {
  let bestTier: PricingTier | null = null
  let bestCost = Infinity

  for (const tier of tiers) {
    if (tier.autoSelect === false || tier.quoteOnly) continue
    if (!canTierHandle(tier, inputs)) continue
    const cost = computeTierCost(tier, inputs)
    if (cost < bestCost) {
      bestCost = cost
      bestTier = tier
    }
  }

  if (bestTier) {
    return { tier: bestTier, cost: bestCost, exceeds: false, quoteOnly: false }
  }

  const quoteOnlyTier = tiers.find(
    (tier) => tier.autoSelect !== false && tier.quoteOnly && canTierHandle(tier, inputs),
  )
  if (quoteOnlyTier) {
    return { tier: quoteOnlyTier, cost: computeTierCost(quoteOnlyTier, inputs), exceeds: false, quoteOnly: true }
  }

  const lastTier = tiers[tiers.length - 1]
  return {
    tier: lastTier,
    cost: computeTierCost(lastTier, inputs),
    exceeds: true,
    quoteOnly: lastTier.quoteOnly,
  }
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

    const { tier, cost, exceeds, quoteOnly } = selectBestTier(pricing.tiers, inputs)

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
      quoteOnly,
      allTiers,
    })
  }

  // Priced tiers ascending, then quote-only selections, then those that exceed every tier's limits.
  results.sort((a, b) => {
    const rank = (r: PricingResult) => (r.exceeds ? 2 : r.quoteOnly ? 1 : 0)
    const rankDiff = rank(a) - rank(b)
    if (rankDiff !== 0) return rankDiff
    return a.monthlyCost - b.monthlyCost
  })
  return results
}

/**
 * Criterion 8 (pricing suitability) score derived from the pricing calculator
 * at the given inputs: the cost of the auto-selected tier maps to the first
 * band whose max it falls under (or `above` if it exceeds all bands); a
 * quote-only selection uses the fixed `quoteOnly` score regardless of cost.
 */
export function computePricingScore(
  scoreConfig: PricingScoreConfig,
  result: Pick<PricingResult, 'monthlyCost' | 'quoteOnly' | 'exceeds'>,
): number {
  if (result.quoteOnly) return scoreConfig.quoteOnly
  if (result.exceeds) return scoreConfig.above
  const band = scoreConfig.bands.find((b) => result.monthlyCost <= b.max)
  return band ? band.score : scoreConfig.above
}
