import { useState, useMemo, useCallback } from 'react'
import {
  Rocket, Leaf, Scale, Mountain, GitBranch, Cloud, Terminal,
  Network, ShieldCheck, Layers, Blocks, Atom, Server,
  Users, Database, Zap, ChevronDown, ExternalLink,
  Check, X, Trophy, AlertTriangle, Github,
  type LucideIcon,
} from 'lucide-react'
import type { EvalData, PricingInputs, PricingResult, PricingTier } from './types'

const ICON_MAP: Record<string, LucideIcon> = {
  Rocket, Leaf, Scale, Mountain, GitBranch, Cloud, Terminal,
  Network, ShieldCheck, Layers, Blocks, Atom, Server,
}

const SLIDER_ICONS: Record<string, LucideIcon> = {
  users: Users,
  resources: Database,
  runs: Zap,
  stacks: Layers,
}

function formatCost(cost: number): string {
  if (cost === 0) return '$0'
  if (cost >= 1000) return `$${(cost / 1000).toFixed(1)}k`
  return `$${cost.toLocaleString()}`
}

function PricingSliders({
  data,
  inputs,
  onChange,
}: {
  data: EvalData
  inputs: PricingInputs
  onChange: (key: keyof PricingInputs, value: number) => void
}) {
  return (
    <div className="bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark p-6">
      <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white tracking-wide uppercase mb-4">
        Configure Your Usage
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(data.pricing.sliders) as Array<keyof PricingInputs>).map((key) => {
          const config = data.pricing.sliders[key]
          const Icon = SLIDER_ICONS[key]
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-accent dark:text-accent-light" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {config.label}
                  </span>
                </div>
                <span className="text-lg font-display font-black text-slate-900 dark:text-white">
                  {inputs[key].toLocaleString()}
                  {config.unit && (
                    <span className="text-xs font-mono text-slate-400 ml-1">{config.unit}</span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={inputs[key]}
                onChange={(e) => onChange(key, parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>{config.min}</span>
                <span>{config.max.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeaturePill({ label, available }: { label: string; available: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
        ${available
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
        }
      `}
    >
      {available ? <Check size={10} /> : <X size={10} />}
      {label}
    </span>
  )
}

function TierMiniCard({
  tier,
  cost,
  selected,
  canHandle,
  inputs,
  onSelect,
}: {
  tier: PricingTier
  cost: number
  selected: boolean
  canHandle: boolean
  inputs: PricingInputs
  onSelect: (tierName: string) => void
}) {
  const breakdown: string[] = []
  if (tier.basePrice > 0) breakdown.push(`Base: $${tier.basePrice}`)
  if (tier.perUser > 0) {
    const effectiveUsers = tier.minUsers ? Math.max(inputs.users, tier.minUsers) : inputs.users
    const userCost = tier.includedUsers !== null
      ? Math.max(0, effectiveUsers - tier.includedUsers) * tier.perUser
      : effectiveUsers * tier.perUser
    if (userCost > 0) breakdown.push(`Users: $${Math.round(userCost)}`)
  }
  if (tier.perResource > 0) {
    const resCost = tier.includedResources !== null
      ? Math.max(0, inputs.resources - tier.includedResources) * tier.perResource
      : inputs.resources * tier.perResource
    if (resCost > 0) breakdown.push(`Resources: $${Math.round(resCost)}`)
  }
  if (tier.perRun > 0) {
    const runCost = tier.includedRuns !== null
      ? Math.max(0, inputs.runs - tier.includedRuns) * tier.perRun
      : inputs.runs * tier.perRun
    if (runCost > 0) breakdown.push(`Runs: $${Math.round(runCost)}`)
  }
  if (tier.perStack > 0) {
    const stackCost = tier.includedStacks !== null
      ? Math.max(0, inputs.stacks - tier.includedStacks) * tier.perStack
      : inputs.stacks * tier.perStack
    if (stackCost > 0) breakdown.push(`Stacks: $${Math.round(stackCost)}`)
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(tier.name) }}
      className={`
        p-2 rounded-lg border text-xs cursor-pointer transition-all duration-150
        ${selected
          ? 'border-accent dark:border-accent-light bg-accent/5 dark:bg-accent-light/5 ring-1 ring-accent/30 dark:ring-accent-light/30'
          : canHandle
            ? 'border-border dark:border-border-dark hover:border-accent/40 dark:hover:border-accent-light/40 hover:bg-accent/5 dark:hover:bg-accent-light/5'
            : 'border-border dark:border-border-dark opacity-50 hover:opacity-70'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold ${selected ? 'text-accent dark:text-accent-light' : 'text-slate-700 dark:text-slate-300'}`}>
          {tier.name}
        </span>
        {tier.estimated && (
          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded">
            EST
          </span>
        )}
      </div>
      {tier.quoteOnly ? (
        <div className="font-display font-black text-slate-500 dark:text-slate-400 text-sm">
          Contact sales
        </div>
      ) : (
        <div className="font-display font-black text-slate-900 dark:text-white">
          ${Math.round(cost).toLocaleString()}<span className="text-[10px] font-normal text-slate-400">/mo</span>
        </div>
      )}
      {!canHandle && (
        <div className="text-[10px] text-score-0 mt-0.5">Exceeds limits</div>
      )}
      {tier.autoSelect === false && (
        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Not usable at team scale</div>
      )}
      {breakdown.length > 0 && canHandle && !tier.quoteOnly && (
        <div className="text-[10px] text-slate-400 mt-0.5">{breakdown.join(' + ')}</div>
      )}
      {tier.source && (
        <a
          href={tier.source}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 hover:text-accent dark:hover:text-accent-light mt-1"
        >
          <ExternalLink size={8} />
          source
        </a>
      )}
    </div>
  )
}

function PricingCard({
  result,
  rank,
  featureLabels,
  inputs,
  overrideTier,
  onOverrideTier,
}: {
  result: PricingResult
  rank: number
  featureLabels: Record<string, string>
  inputs: PricingInputs
  overrideTier: string | null
  onOverrideTier: (platformId: string, tierName: string | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICON_MAP[result.platformIcon] || Cloud

  // If user overrode tier, use that instead
  const activeTierData = overrideTier
    ? result.allTiers.find((t) => t.tier.name === overrideTier)
    : null
  const activeTier = activeTierData ? activeTierData.tier : result.selectedTier
  const activeCost = activeTierData ? Math.round(activeTierData.cost) : result.monthlyCost
  const isOverridden = overrideTier !== null && overrideTier !== result.selectedTier.name
  const activeCanHandle = activeTierData ? activeTierData.canHandle : !result.exceeds
  const activeIsQuoteOnly = activeTier.quoteOnly

  return (
    <div
      className="pricing-card rounded-xl border border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark hover:shadow-md hover:border-accent/20 dark:hover:border-accent-light/20 transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${rank * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3 md:p-4 flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4">
        {/* Rank */}
        <div className="w-8 text-center shrink-0">
          {rank === 1 ? (
            <Trophy size={20} className="text-amber-400 mx-auto" />
          ) : (
            <span className="text-lg font-display font-black text-slate-400 dark:text-slate-500">
              {rank}
            </span>
          )}
        </div>

        {/* Platform */}
        <div className="flex items-center gap-3 flex-1 md:w-40 md:shrink-0 md:flex-none min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: result.platformColor + '18' }}
          >
            <Icon size={18} style={{ color: result.platformColor }} />
          </div>
          <div className="min-w-0">
            <a
              href={result.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-display font-bold text-sm text-slate-900 dark:text-white truncate hover:text-accent dark:hover:text-accent-light transition-colors inline-flex items-center gap-1 group/link"
            >
              {result.platformName}
              <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
            </a>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {result.model}
            </div>
          </div>
        </div>

        {/* Cost + Chevron on mobile (inline with name row) */}
        <div className="flex items-center gap-2 md:hidden shrink-0">
          <span className={`font-display font-black ${activeIsQuoteOnly ? 'text-sm text-slate-500 dark:text-slate-400' : 'text-lg text-slate-900 dark:text-white'}`}>
            {activeIsQuoteOnly ? 'Contact sales' : activeCost === 0 ? 'Free' : `$${activeCost.toLocaleString()}`}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Cost — desktop */}
        <div className="hidden md:block flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`font-display font-black ${activeIsQuoteOnly ? 'text-lg text-slate-500 dark:text-slate-400' : 'text-2xl text-slate-900 dark:text-white'}`}>
              {activeIsQuoteOnly ? 'Contact sales' : activeCost === 0 ? 'Free' : `$${activeCost.toLocaleString()}`}
            </span>
            {!activeIsQuoteOnly && activeCost > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">/mo</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTier.notes}
          </div>
        </div>

        {/* Badges */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-1 md:gap-2 md:shrink-0">
          {isOverridden && (
            <button
              onClick={(e) => { e.stopPropagation(); onOverrideTier(result.platformId, null) }}
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-accent/10 dark:bg-accent-light/10 text-accent dark:text-accent-light hover:bg-accent/20 dark:hover:bg-accent-light/20 transition-colors"
            >
              Auto
            </button>
          )}
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
            isOverridden
              ? 'bg-accent/10 dark:bg-accent-light/10 text-accent dark:text-accent-light'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            {activeTier.name}
          </span>
          {activeTier.estimated && (
            <span className="estimated-badge text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} />
              Estimated
            </span>
          )}
          {activeTier.autoSelect === false && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              Not usable at team scale
            </span>
          )}
          {!activeCanHandle && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              Exceeds limits
            </span>
          )}
          {/* Notes visible on mobile below cost */}
          <span className="w-full text-[10px] text-slate-500 dark:text-slate-400 md:hidden">
            {activeTier.notes}
          </span>
        </div>

        {/* Chevron — desktop only */}
        <ChevronDown
          size={16}
          className={`hidden md:block shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border dark:border-border-dark pt-3 space-y-3">
          {/* Features */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Features on {activeTier.name}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(activeTier.features).map(([key, available]) => (
                <FeaturePill
                  key={key}
                  label={featureLabels[key] || key}
                  available={available}
                />
              ))}
            </div>
          </div>

          {/* All tiers */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              All Tiers — click to compare
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {result.allTiers.map(({ tier, cost, canHandle }) => (
                <TierMiniCard
                  key={tier.name}
                  tier={tier}
                  cost={cost}
                  selected={tier.name === activeTier.name}
                  canHandle={canHandle}
                  inputs={inputs}
                  onSelect={(name) => onOverrideTier(result.platformId, name)}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            {result.description}
          </p>
        </div>
      )}
    </div>
  )
}

export default function PricingCalculator({
  data,
  inputs,
  onInputsChange,
  results: baseResults,
}: {
  data: EvalData
  inputs: PricingInputs
  onInputsChange: (key: keyof PricingInputs, value: number) => void
  results: PricingResult[]
}) {
  const [tierOverrides, setTierOverrides] = useState<Record<string, string | null>>({})

  const handleOverrideTier = useCallback((platformId: string, tierName: string | null) => {
    setTierOverrides((prev) => ({ ...prev, [platformId]: tierName }))
  }, [])

  // Effective (override-aware) cost/quoteOnly/canHandle for a result, used for
  // both re-sorting and the cheapest/most-expensive summary below.
  const effectiveFor = useCallback((r: PricingResult) => {
    const overrideName = tierOverrides[r.platformId]
    const overrideData = overrideName ? r.allTiers.find((t) => t.tier.name === overrideName) : null
    return {
      cost: overrideData ? Math.round(overrideData.cost) : r.monthlyCost,
      quoteOnly: overrideData ? overrideData.tier.quoteOnly : r.quoteOnly,
      canHandle: overrideData ? overrideData.canHandle : !r.exceeds,
    }
  }, [tierOverrides])

  // Re-sort applying tier overrides: priced ascending, then quote-only, then exceeds.
  const results = useMemo(() => {
    return [...baseResults].sort((a, b) => {
      const ea = effectiveFor(a)
      const eb = effectiveFor(b)
      const rank = (e: ReturnType<typeof effectiveFor>) => (!e.canHandle ? 2 : e.quoteOnly ? 1 : 0)
      const rankDiff = rank(ea) - rank(eb)
      if (rankDiff !== 0) return rankDiff
      return ea.cost - eb.cost
    })
  }, [baseResults, effectiveFor])

  const cheapest = results[0]
  // Quote-only and over-limit tiers have no comparable price, so they're left out of "most expensive".
  const pricedResults = results.filter((r) => {
    const e = effectiveFor(r)
    return e.canHandle && !e.quoteOnly
  })
  const mostExpensive = pricedResults[pricedResults.length - 1]
  const unpricedCount = results.length - pricedResults.length
  const cheapestInfo = cheapest ? effectiveFor(cheapest) : null
  const mostExpensiveInfo = mostExpensive ? effectiveFor(mostExpensive) : null

  return (
    <main className="flex-1 overflow-y-auto dot-grid">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <PricingSliders data={data} inputs={inputs} onChange={onInputsChange} />

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Trophy size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cheapest</div>
              <div className="font-display font-black text-slate-900 dark:text-white">
                {cheapest
                  ? `${cheapestInfo?.quoteOnly ? 'Contact sales' : formatCost(cheapestInfo?.cost ?? 0)} — ${cheapest.platformName}`
                  : '—'}
              </div>
            </div>
          </div>
          <div className="bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Most Expensive
                {unpricedCount > 0 && (
                  <span
                    className="ml-0.5 cursor-help"
                    title={`Excludes ${unpricedCount} platform${unpricedCount > 1 ? 's' : ''} that only quote through sales (or exceed every published tier) at these inputs`}
                  >
                    *
                  </span>
                )}
              </div>
              <div className="font-display font-black text-slate-900 dark:text-white">
                {mostExpensive
                  ? `${formatCost(mostExpensiveInfo?.cost ?? 0)} — ${mostExpensive.platformName}`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="space-y-3">
          {results.map((result, i) => (
            <PricingCard
              key={result.platformId}
              result={result}
              rank={i + 1}
              featureLabels={data.pricing.featureLabels}
              inputs={inputs}
              overrideTier={tierOverrides[result.platformId] ?? null}
              onOverrideTier={handleOverrideTier}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 pt-4 pb-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            Prices marked "Estimated" are approximations for contact-sales tiers. Always verify with vendor.
          </p>
          <a
            href="https://github.com/so0k/tacos-guru/edit/main/public/evaluation.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md border border-border dark:border-border-dark text-slate-500 dark:text-slate-400 hover:text-accent dark:hover:text-accent-light hover:border-accent/40 dark:hover:border-accent-light/40 transition-colors shrink-0"
          >
            <Github size={10} />
            Submit correction
          </a>
        </div>
      </div>
    </main>
  )
}
