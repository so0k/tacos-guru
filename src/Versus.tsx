import { useMemo, type ReactNode } from 'react'
import { Cloud, Trophy, Star, Ban, CheckCircle, XCircle } from 'lucide-react'
import type {
  EvalData, RankedPlatform, Criterion, Gate, GateResult, PricingResult, PricingTier, BillingMode,
} from './types'
import { ICON_MAP, SCORE_ICONS, SCORE_COLORS, CATEGORY_ORDER, PRICING_CRITERION_ID, pricingRationale } from './App'

function billingNoteFor(tier: PricingTier, billingMode: BillingMode): string | null {
  if (tier.quoteOnly || !tier.billing) return null
  if (tier.billing === 'usage') return 'Usage-based'
  if (tier.billing === 'monthly') return 'Billed monthly'
  return billingMode === 'monthly'
    ? (tier.monthlyBasePrice != null ? 'Month-to-month rate' : 'Annual contract only')
    : 'Billed annually'
}

// Quote-only never wins; cheaper priced+fitting side wins; otherwise no winner.
function pricingWinner(left: PricingResult | undefined, right: PricingResult | undefined): 'left' | 'right' | null {
  if (!left || !right) return null
  const leftOk = !left.quoteOnly && !left.exceeds
  const rightOk = !right.quoteOnly && !right.exceeds
  if (leftOk && rightOk) return left.monthlyCost === right.monthlyCost ? null : left.monthlyCost < right.monthlyCost ? 'left' : 'right'
  if (leftOk && !rightOk) return 'left'
  if (!leftOk && rightOk) return 'right'
  return null
}

// Mirrored row: centre on top with a two-column card grid below on mobile; left | centre | right on desktop.
function VersusRow({ centre, left, right }: { centre: ReactNode; left: ReactNode; right: ReactNode }) {
  return (
    <>
      <div className="md:hidden space-y-1.5">
        <div className="flex items-center justify-center text-center">{centre}</div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="min-w-0">{left}</div>
          <div className="min-w-0">{right}</div>
        </div>
      </div>
      <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-3 md:items-center">
        <div className="min-w-0">{left}</div>
        <div className="flex items-center justify-center text-center px-2">{centre}</div>
        <div className="min-w-0">{right}</div>
      </div>
    </>
  )
}

function VersusCard({ children, state }: { children: ReactNode; state: 'win' | 'lose' | 'tie' }) {
  return (
    <div
      className={`
        relative rounded-lg border p-2 md:p-3 text-xs min-w-0
        ${state === 'win'
          ? 'border-accent dark:border-accent-light bg-accent/5 dark:bg-accent-light/5'
          : 'border-border dark:border-border-dark bg-slate-50 dark:bg-slate-800/50'}
        ${state === 'lose' ? 'opacity-70' : ''}
      `}
    >
      {state === 'win' && (
        <Star size={12} className="absolute top-1.5 right-1.5 text-accent dark:text-accent-light fill-accent dark:fill-accent-light" />
      )}
      {children}
    </div>
  )
}

function PlatformSelect({
  platforms, value, onChange, label,
}: {
  platforms: RankedPlatform[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <label className="flex flex-col gap-1 text-xs flex-1 min-w-0">
      <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm font-semibold rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-slate-900 dark:text-white px-2 py-1.5"
      >
        {platforms.map((p) => (
          <option key={p.id} value={p.id}>{p.name}{p.disqualified ? ' (disqualified)' : ''}</option>
        ))}
      </select>
    </label>
  )
}

function SummaryCard({ platform, isWinner }: { platform: RankedPlatform; isWinner: boolean }) {
  const Icon = ICON_MAP[platform.icon] || Cloud
  return (
    <div
      className={`
        rounded-xl border p-3 md:p-4 flex items-center gap-3
        ${isWinner
          ? 'border-accent dark:border-accent-light bg-accent/5 dark:bg-accent-light/5'
          : 'border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark'}
      `}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: platform.color + '18' }}>
        <Icon size={18} style={{ color: platform.color }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isWinner && <Trophy size={14} className="text-amber-400 shrink-0" />}
          <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">{platform.name}</span>
        </div>
        <div className="text-xs font-mono font-bold" style={{ color: platform.color }}>
          {platform.weightedScore}/{platform.maxPossible} · {platform.percentage.toFixed(0)}%
        </div>
        {platform.disqualified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 mt-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Ban size={10} />
            Disqualified
          </span>
        )}
      </div>
    </div>
  )
}

function HeadToHeadSummary({
  left, right, counts,
}: {
  left: RankedPlatform
  right: RankedPlatform
  counts: { leftWins: number; rightWins: number; ties: number }
}) {
  const leftWins = left.weightedScore > right.weightedScore
  const rightWins = right.weightedScore > left.weightedScore
  return (
    <VersusRow
      centre={
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 text-center leading-relaxed">
          <div>{left.name} wins {counts.leftWins}</div>
          <div>{right.name} wins {counts.rightWins}</div>
          <div>Ties {counts.ties}</div>
        </div>
      }
      left={<SummaryCard platform={left} isWinner={leftWins} />}
      right={<SummaryCard platform={right} isWinner={rightWins} />}
    />
  )
}

function CriterionRow({
  criterion, index, weight, left, right, variantSelections, pricingResultByPlatform, scoreLabels,
}: {
  criterion: Criterion
  index: number
  weight: number
  left: RankedPlatform
  right: RankedPlatform
  variantSelections: Record<number, string>
  pricingResultByPlatform: Record<string, PricingResult>
  scoreLabels: string[]
}) {
  const leftScore = left.effectiveScores[index]
  const rightScore = right.effectiveScores[index]
  const winner = leftScore === rightScore ? null : leftScore > rightScore ? 'left' : 'right'
  const LeftIcon = SCORE_ICONS[leftScore]
  const RightIcon = SCORE_ICONS[rightScore]
  const variantLabel = criterion.variants
    ? criterion.variants.find((v) => v.id === (variantSelections[criterion.id] ?? criterion.defaultVariant))?.label
    : null
  const isPricing = criterion.id === PRICING_CRITERION_ID
  const leftRationale = isPricing
    ? (pricingRationale(pricingResultByPlatform[left.id]) ?? left.rationales[index])
    : left.rationales[index]
  const rightRationale = isPricing
    ? (pricingRationale(pricingResultByPlatform[right.id]) ?? right.rationales[index])
    : right.rationales[index]

  return (
    <VersusRow
      centre={
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-slate-400">{winner === 'left' ? '◀' : winner === 'right' ? '▶' : '='}</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{criterion.short}</span>
          <span className="text-[10px] text-slate-400 font-mono">×{weight}</span>
        </div>
      }
      left={
        <VersusCard state={winner === 'left' ? 'win' : winner === 'right' ? 'lose' : 'tie'}>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <LeftIcon size={13} className={`shrink-0 ${SCORE_COLORS[leftScore]}`} />
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{scoreLabels[leftScore]}</span>
            {variantLabel && <span className="text-[10px] text-slate-400">({variantLabel})</span>}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{leftRationale}</p>
        </VersusCard>
      }
      right={
        <VersusCard state={winner === 'right' ? 'win' : winner === 'left' ? 'lose' : 'tie'}>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <RightIcon size={13} className={`shrink-0 ${SCORE_COLORS[rightScore]}`} />
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{scoreLabels[rightScore]}</span>
            {variantLabel && <span className="text-[10px] text-slate-400">({variantLabel})</span>}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{rightRationale}</p>
        </VersusCard>
      }
    />
  )
}

function GateCard({ result }: { result: GateResult | undefined }) {
  if (!result) {
    return <VersusCard state="tie"><span className="text-[11px] text-slate-400">—</span></VersusCard>
  }
  return (
    <VersusCard state="tie">
      <div className="flex items-start gap-1.5">
        {result.pass
          ? <CheckCircle size={13} className="shrink-0 mt-0.5 text-score-3" />
          : <XCircle size={13} className="shrink-0 mt-0.5 text-score-0" />}
        <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{result.evidence}</span>
      </div>
    </VersusCard>
  )
}

function GateRow({ gate, left, right }: { gate: Gate; left: RankedPlatform; right: RankedPlatform }) {
  return (
    <VersusRow
      centre={<span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{gate.label}</span>}
      left={<GateCard result={left.gates?.[gate.id]} />}
      right={<GateCard result={right.gates?.[gate.id]} />}
    />
  )
}

function PricingMiniCard({
  result, billingMode, state,
}: {
  result: PricingResult | undefined
  billingMode: BillingMode
  state: 'win' | 'lose' | 'tie'
}) {
  if (!result) {
    return <VersusCard state="tie"><span className="text-[11px] text-slate-400">No pricing data</span></VersusCard>
  }
  const tier = result.selectedTier
  const billingNote = billingNoteFor(tier, billingMode)
  return (
    <VersusCard state={state}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{tier.name}</span>
        {tier.estimated && (
          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded">EST</span>
        )}
      </div>
      <div className="font-display font-black text-sm text-slate-900 dark:text-white">
        {result.quoteOnly ? 'Contact sales' : `$${result.monthlyCost.toLocaleString()}/mo`}
      </div>
      {billingNote && <div className="text-[10px] text-slate-400 mt-0.5">{billingNote}</div>}
    </VersusCard>
  )
}

function PricingRow({
  leftResult, rightResult, billingMode,
}: {
  leftResult: PricingResult | undefined
  rightResult: PricingResult | undefined
  billingMode: BillingMode
}) {
  const winner = pricingWinner(leftResult, rightResult)
  return (
    <VersusRow
      centre={<span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Pricing</span>}
      left={<PricingMiniCard result={leftResult} billingMode={billingMode} state={winner === 'left' ? 'win' : winner === 'right' ? 'lose' : 'tie'} />}
      right={<PricingMiniCard result={rightResult} billingMode={billingMode} state={winner === 'right' ? 'win' : winner === 'left' ? 'lose' : 'tie'} />}
    />
  )
}

export default function Versus({
  data,
  ranked,
  weights,
  variantSelections,
  pricingResultByPlatform,
  billingMode,
  selection,
  onSelectionChange,
}: {
  data: EvalData
  ranked: RankedPlatform[]
  weights: Record<number, number>
  variantSelections: Record<number, string>
  pricingResultByPlatform: Record<string, PricingResult>
  billingMode: BillingMode
  selection: [string, string]
  onSelectionChange: (selection: [string, string]) => void
}) {
  const left = ranked.find((p) => p.id === selection[0])
  const right = ranked.find((p) => p.id === selection[1])

  const criterionIndexById = useMemo(() => {
    const m: Record<number, number> = {}
    data.criteria.forEach((c, i) => { m[c.id] = i })
    return m
  }, [data.criteria])

  const counts = useMemo(() => {
    if (!left || !right) return { leftWins: 0, rightWins: 0, ties: 0 }
    let leftWins = 0
    let rightWins = 0
    let ties = 0
    data.criteria.forEach((_, i) => {
      const l = left.effectiveScores[i]
      const r = right.effectiveScores[i]
      if (l > r) leftWins++
      else if (r > l) rightWins++
      else ties++
    })
    return { leftWins, rightWins, ties }
  }, [data.criteria, left, right])

  const leaderId = ranked[0]?.id
  const runnerUpId = ranked[1]?.id
  const vsLeaderLabel = selection[0] === leaderId ? 'vs runner-up' : 'vs leader'

  const handleLeftChange = (id: string) => {
    onSelectionChange(id === selection[1] ? [id, selection[0]] : [id, selection[1]])
  }
  const handleRightChange = (id: string) => {
    onSelectionChange(id === selection[0] ? [selection[1], id] : [selection[0], id])
  }
  const handleVsLeader = () => {
    if (!leaderId || !runnerUpId) return
    const target = selection[0] === leaderId ? runnerUpId : leaderId
    onSelectionChange([selection[0], target])
  }

  if (!left || !right) {
    return (
      <main className="flex-1 overflow-y-auto dot-grid p-6 text-sm text-slate-400 dark:text-slate-500">
        Not enough platforms to compare.
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto dot-grid">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        {/* Pickers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
          <PlatformSelect label="Left" platforms={ranked} value={selection[0]} onChange={handleLeftChange} />
          <div className="hidden sm:flex items-center justify-center px-1 pb-1.5 text-xs font-bold text-slate-400 shrink-0">vs</div>
          <PlatformSelect label="Right" platforms={ranked} value={selection[1]} onChange={handleRightChange} />
          <button
            type="button"
            onClick={handleVsLeader}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border dark:border-border-dark text-accent dark:text-accent-light hover:bg-accent/10 dark:hover:bg-accent-light/10 transition-colors"
          >
            {vsLeaderLabel}
          </button>
        </div>

        <HeadToHeadSummary left={left} right={right} counts={counts} />

        <div className="space-y-4">
          {CATEGORY_ORDER.map((cat) => {
            const criteria = data.criteria.filter((c) => c.category === cat)
            if (criteria.length === 0) return null
            const catInfo = data.categories[cat]
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catInfo.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {catInfo.label}
                  </span>
                </div>
                {criteria.map((c) => (
                  <CriterionRow
                    key={c.id}
                    criterion={c}
                    index={criterionIndexById[c.id]}
                    weight={weights[c.id] ?? c.defaultWeight}
                    left={left}
                    right={right}
                    variantSelections={variantSelections}
                    pricingResultByPlatform={pricingResultByPlatform}
                    scoreLabels={data.scoreLabels}
                  />
                ))}
              </div>
            )
          })}
        </div>

        {data.gates.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">Gates</div>
            {data.gates.map((g) => (
              <GateRow key={g.id} gate={g} left={left} right={right} />
            ))}
          </div>
        )}

        <div className="space-y-1.5 pb-20 md:pb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">Pricing</div>
          <PricingRow
            leftResult={pricingResultByPlatform[left.id]}
            rightResult={pricingResultByPlatform[right.id]}
            billingMode={billingMode}
          />
        </div>
      </div>
    </main>
  )
}
