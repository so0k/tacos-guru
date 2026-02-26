import { useState, useMemo, useCallback } from 'react'
import {
  Rocket, Leaf, Scale, Mountain, GitBranch, Cloud, Terminal,
  Users, Database, Zap, ChevronDown, ExternalLink,
  Check, X, Trophy, AlertTriangle, Github,
  type LucideIcon,
} from 'lucide-react'
import type { EvalData, PricingInputs, PricingResult, PricingTier } from './types'
import { computeAllPricingResults } from './pricing'

const ICON_MAP: Record<string, LucideIcon> = {
  Rocket, Leaf, Scale, Mountain, GitBranch, Cloud, Terminal,
}

const SLIDER_ICONS: Record<string, LucideIcon> = {
  users: Users,
  resources: Database,
  runs: Zap,
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
      <div className="font-display font-black text-slate-900 dark:text-white">
        ${Math.round(cost).toLocaleString()}<span className="text-[10px] font-normal text-slate-400">/mo</span>
      </div>
      {!canHandle && (
        <div className="text-[10px] text-score-0 mt-0.5">Exceeds limits</div>
      )}
      {breakdown.length > 0 && canHandle && (
        <div className="text-[10px] text-slate-400 mt-0.5">{breakdown.join(' + ')}</div>
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

  return (
    <div
      className="pricing-card rounded-xl border border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark hover:shadow-md hover:border-accent/20 dark:hover:border-accent-light/20 transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${rank * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4 flex items-center gap-4">
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
        <div className="flex items-center gap-3 w-40 shrink-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
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

        {/* Cost */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-black text-slate-900 dark:text-white">
              {activeCost === 0 ? 'Free' : `$${activeCost.toLocaleString()}`}
            </span>
            {activeCost > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">/mo</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTier.notes}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
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
          {result.exceeds && !isOverridden && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              Contact Sales
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
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

export default function PricingCalculator({ data }: { data: EvalData }) {
  const [inputs, setInputs] = useState<PricingInputs>({
    users: data.pricing.sliders.users.default,
    resources: data.pricing.sliders.resources.default,
    runs: data.pricing.sliders.runs.default,
  })
  const [tierOverrides, setTierOverrides] = useState<Record<string, string | null>>({})

  const handleChange = (key: keyof PricingInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const handleOverrideTier = useCallback((platformId: string, tierName: string | null) => {
    setTierOverrides((prev) => ({ ...prev, [platformId]: tierName }))
  }, [])

  const baseResults = useMemo(
    () => computeAllPricingResults(data.pricing, data.platforms, inputs),
    [data, inputs],
  )

  // Re-sort applying tier overrides so the list stays ordered by effective cost
  const results = useMemo(() => {
    return [...baseResults].sort((a, b) => {
      const aOverride = tierOverrides[a.platformId]
      const bOverride = tierOverrides[b.platformId]
      const aCost = aOverride
        ? Math.round(a.allTiers.find((t) => t.tier.name === aOverride)?.cost ?? a.monthlyCost)
        : a.monthlyCost
      const bCost = bOverride
        ? Math.round(b.allTiers.find((t) => t.tier.name === bOverride)?.cost ?? b.monthlyCost)
        : b.monthlyCost
      return aCost - bCost
    })
  }, [baseResults, tierOverrides])

  const cheapest = results[0]
  const mostExpensive = results[results.length - 1]
  const cheapestCost = tierOverrides[cheapest?.platformId]
    ? Math.round(cheapest.allTiers.find((t) => t.tier.name === tierOverrides[cheapest.platformId])?.cost ?? cheapest.monthlyCost)
    : cheapest?.monthlyCost
  const mostExpensiveCost = tierOverrides[mostExpensive?.platformId]
    ? Math.round(mostExpensive.allTiers.find((t) => t.tier.name === tierOverrides[mostExpensive.platformId])?.cost ?? mostExpensive.monthlyCost)
    : mostExpensive?.monthlyCost

  return (
    <main className="flex-1 overflow-y-auto dot-grid">
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <PricingSliders data={data} inputs={inputs} onChange={handleChange} />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Trophy size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cheapest</div>
              <div className="font-display font-black text-slate-900 dark:text-white">
                {cheapest ? `${formatCost(cheapestCost ?? 0)} — ${cheapest.platformName}` : '—'}
              </div>
            </div>
          </div>
          <div className="bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Most Expensive</div>
              <div className="font-display font-black text-slate-900 dark:text-white">
                {mostExpensive ? `${formatCost(mostExpensiveCost ?? 0)} — ${mostExpensive.platformName}` : '—'}
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
