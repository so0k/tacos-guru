import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Rocket, Leaf, Scale, Mountain, GitBranch, Cloud, Terminal,
  Sun, Moon, RotateCcw, Trophy, ChevronDown, ChevronRight,
  XCircle, AlertCircle, CheckCircle, CircleCheckBig,
  Info, TrendingUp, TrendingDown, Minus, ExternalLink, DollarSign, Github,
  Menu, X, SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

const REPO_URL = 'https://github.com/so0k/tacos-guru'
import type { Criterion, Platform, EvalData, RankedPlatform } from './types'
import PricingCalculator from './PricingCalculator'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Rocket, Leaf, Scale, Mountain, GitBranch, Cloud, Terminal,
}

const SCORE_ICONS: LucideIcon[] = [XCircle, AlertCircle, CheckCircle, CircleCheckBig]

const SCORE_COLORS = [
  'text-score-0', 'text-score-1', 'text-score-2', 'text-score-3',
]

const SCORE_BG = [
  'bg-score-0', 'bg-score-1', 'bg-score-2', 'bg-score-3',
]

const CATEGORY_ORDER = ['critical', 'high', 'medium', 'low', 'nice']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeRankings(
  platforms: Platform[],
  criteria: Criterion[],
  weights: Record<number, number>,
): RankedPlatform[] {
  const scored = platforms.map((p) => {
    let weightedScore = 0
    let maxPossible = 0
    criteria.forEach((c, i) => {
      const w = weights[c.id] ?? c.defaultWeight
      weightedScore += p.scores[i] * w
      maxPossible += 3 * w
    })
    const percentage = maxPossible > 0 ? (weightedScore / maxPossible) * 100 : 0
    return { ...p, weightedScore, maxPossible, percentage, rank: 0, defaultRank: 0, rankDelta: 0 }
  })

  scored.sort((a, b) => b.weightedScore - a.weightedScore)
  scored.forEach((p, i) => { p.rank = i + 1 })

  // Compute default rankings for delta
  const defaultScored = platforms.map((p) => {
    let ws = 0
    criteria.forEach((c, i) => { ws += p.scores[i] * c.defaultWeight })
    return { id: p.id, ws }
  })
  defaultScored.sort((a, b) => b.ws - a.ws)
  const defaultRankMap: Record<string, number> = {}
  defaultScored.forEach((p, i) => { defaultRankMap[p.id] = i + 1 })

  scored.forEach((p) => {
    p.defaultRank = defaultRankMap[p.id]
    p.rankDelta = p.defaultRank - p.rank // positive = moved up
  })

  return scored
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ScoreIndicator({ score, label }: { score: number; label: string }) {
  const Icon = SCORE_ICONS[score]
  return (
    <span className={`inline-flex items-center gap-1 ${SCORE_COLORS[score]}`}>
      <Icon size={14} />
      <span className="text-xs">{label}</span>
    </span>
  )
}

function ScoreCell({
  score,
  criterionName,
  rationale,
  scoreLabel,
  isHighlighted,
}: {
  score: number
  criterionName: string
  rationale: string
  scoreLabel: string
  isHighlighted: boolean
}) {
  return (
    <div className="tooltip-trigger">
      <div
        className={`
          w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold
          transition-all duration-200
          ${SCORE_BG[score]} text-white
          ${isHighlighted ? 'ring-2 ring-accent-light scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'}
        `}
      >
        {score}
      </div>
      <div className="tooltip-content">
        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs whitespace-normal">
          <div className="font-semibold mb-1">{criterionName}</div>
          <ScoreIndicator score={score} label={scoreLabel} />
          <div className="mt-1.5 text-slate-300 leading-relaxed">{rationale}</div>
        </div>
      </div>
    </div>
  )
}

function WeightSlider({
  criterion,
  weight,
  onChange,
  isHovered,
  onHover,
  onLeave,
}: {
  criterion: Criterion
  weight: number
  onChange: (id: number, w: number) => void
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const isChanged = weight !== criterion.defaultWeight

  return (
    <div
      className={`
        px-3 py-2 rounded-lg transition-colors duration-150
        ${isHovered ? 'bg-accent/10 dark:bg-accent-light/10' : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark'}
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mr-2">
          {criterion.short}
        </span>
        <div className="flex items-center gap-1.5">
          {isChanged && (
            <span className="text-[10px] text-accent dark:text-accent-light font-mono">
              was {criterion.defaultWeight}
            </span>
          )}
          <span className={`
            text-sm font-bold font-mono min-w-[1.25rem] text-center
            ${weight === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-white'}
          `}>
            {weight}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={criterion.maxWeight}
        step={1}
        value={weight}
        onChange={(e) => onChange(criterion.id, parseInt(e.target.value))}
        className="w-full"
      />
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
          {criterion.description}
        </span>
      </div>
    </div>
  )
}

function Sidebar({
  data,
  weights,
  onChange,
  onReset,
  hoveredCriterion,
  onHoverCriterion,
  collapsed,
  onToggleCollapse,
  isSheet = false,
}: {
  data: EvalData
  weights: Record<number, number>
  onChange: (id: number, w: number) => void
  onReset: () => void
  hoveredCriterion: number | null
  onHoverCriterion: (id: number | null) => void
  collapsed: boolean
  onToggleCollapse: () => void
  isSheet?: boolean
}) {
  const grouped = useMemo(() => {
    const g: Record<string, Criterion[]> = {}
    data.criteria.forEach((c) => {
      if (!g[c.category]) g[c.category] = []
      g[c.category].push(c)
    })
    return g
  }, [data.criteria])

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    CATEGORY_ORDER.forEach((cat) => { initial[cat] = true })
    return initial
  })

  const toggleGroup = useCallback((cat: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }, [])

  const hasChanges = data.criteria.some((c) => (weights[c.id] ?? c.defaultWeight) !== c.defaultWeight)

  if (!isSheet && collapsed) {
    return (
      <div className="w-12 shrink-0 border-r border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark flex flex-col items-center pt-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-500"
          title="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const sidebarContent = (
    <>
      {!isSheet && (
        <div className="p-4 border-b border-border dark:border-border-dark">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white tracking-wide uppercase">
              Criteria Weights
            </h2>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-400"
            >
              <ChevronDown size={14} className="rotate-90" />
            </button>
          </div>
          {hasChanges && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-accent dark:text-accent-light hover:underline"
            >
              <RotateCcw size={12} />
              Reset to defaults
            </button>
          )}
        </div>
      )}

      {isSheet && hasChanges && (
        <div className="px-4 pt-3">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-accent dark:text-accent-light hover:underline"
          >
            <RotateCcw size={12} />
            Reset to defaults
          </button>
        </div>
      )}

      <div className={`${isSheet ? '' : 'flex-1 overflow-y-auto'} p-2 space-y-4`}>
        {CATEGORY_ORDER.map((cat) => {
          const criteria = grouped[cat]
          if (!criteria) return null
          const catInfo = data.categories[cat]
          return (
            <div key={cat}>
              <button
                onClick={() => toggleGroup(cat)}
                className="flex items-center gap-2 px-3 mb-2 w-full group cursor-pointer"
              >
                <ChevronRight
                  size={12}
                  className={`text-slate-400 transition-transform duration-200 ${collapsedGroups[cat] ? '' : 'rotate-90'}`}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: catInfo.color }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {catInfo.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
                  {criteria.length}
                </span>
              </button>
              {!collapsedGroups[cat] && (
                <div className="space-y-0.5">
                  {criteria.map((c) => (
                    <WeightSlider
                      key={c.id}
                      criterion={c}
                      weight={weights[c.id] ?? c.defaultWeight}
                      onChange={onChange}
                      isHovered={hoveredCriterion === c.id}
                      onHover={() => onHoverCriterion(c.id)}
                      onLeave={() => onHoverCriterion(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  if (isSheet) return sidebarContent

  return (
    <aside className="w-72 shrink-0 border-r border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark flex flex-col overflow-hidden">
      {sidebarContent}
    </aside>
  )
}

function PlatformRow({
  platform,
  criteria,
  weights,
  scoreLabels,
  hoveredCriterion,
  onHoverCriterion,
  animDelay,
  expanded,
  onToggle,
}: {
  platform: RankedPlatform
  criteria: Criterion[]
  weights: Record<number, number>
  scoreLabels: string[]
  hoveredCriterion: number | null
  onHoverCriterion: (id: number | null) => void
  animDelay: number
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = ICON_MAP[platform.icon] || Cloud
  const pctWidth = Math.max(2, platform.percentage)

  return (
    <div
      className="platform-row"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div
        className={`
          rounded-xl border transition-all duration-200 cursor-pointer
          ${expanded
            ? 'border-accent/30 dark:border-accent-light/30 bg-surface-raised dark:bg-surface-raised-dark shadow-lg'
            : 'border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark hover:shadow-md hover:border-accent/20 dark:hover:border-accent-light/20'
          }
        `}
        onClick={onToggle}
      >
        {/* Main row */}
        <div className="p-3 space-y-2 md:p-4 md:space-y-3">
          {/* Top line: rank, name, score bar */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4">
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {platform.rank === 1 ? (
                <Trophy size={20} className="text-amber-400 mx-auto" />
              ) : (
                <span className="text-lg font-display font-black text-slate-400 dark:text-slate-500">
                  {platform.rank}
                </span>
              )}
            </div>

            {/* Platform info */}
            <div className="flex items-center gap-3 flex-1 md:w-44 md:shrink-0 md:flex-none min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: platform.color + '18' }}
              >
                <Icon size={18} style={{ color: platform.color }} />
              </div>
              <div className="min-w-0">
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-display font-bold text-sm text-slate-900 dark:text-white truncate hover:text-accent dark:hover:text-accent-light transition-colors inline-flex items-center gap-1 group/link"
                >
                  {platform.name}
                  <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                </a>
                <div className="flex items-center gap-1">
                  {platform.rankDelta !== 0 && (
                    <span className={`flex items-center text-[10px] ${platform.rankDelta > 0 ? 'text-score-3' : 'text-score-0'}`}>
                      {platform.rankDelta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(platform.rankDelta)}
                    </span>
                  )}
                  {platform.rankDelta === 0 && (
                    <span className="flex items-center text-[10px] text-slate-400">
                      <Minus size={10} />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Percentage + chevron on mobile (shown inline with name row) */}
            <div className="flex items-center gap-2 md:hidden shrink-0">
              <span className="text-sm font-bold font-mono" style={{ color: platform.color }}>
                {platform.percentage.toFixed(0)}%
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Score bar */}
            <div className="w-full md:w-auto md:flex-1 min-w-0">
              <div className="hidden md:flex items-baseline gap-2 mb-1.5">
                <span className="text-xl font-display font-black text-slate-900 dark:text-white">
                  {platform.weightedScore}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  / {platform.maxPossible}
                </span>
                <span className="text-sm font-bold font-mono ml-auto" style={{ color: platform.color }}>
                  {platform.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pctWidth}%`,
                    background: `linear-gradient(90deg, ${platform.color}88, ${platform.color})`,
                  }}
                />
              </div>
            </div>

            {/* Expand chevron — desktop only (mobile chevron is next to name) */}
            <ChevronDown
              size={16}
              className={`hidden md:block shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Bottom line: score heatmap */}
          <div className="hidden lg:flex items-center gap-1 pl-12">
            {criteria.map((c, i) => (
              <div
                key={c.id}
                onMouseEnter={() => onHoverCriterion(c.id)}
                onMouseLeave={() => onHoverCriterion(null)}
              >
                <ScoreCell
                  score={platform.scores[i]}
                  criterionName={c.name}
                  rationale={platform.rationales[i]}
                  scoreLabel={scoreLabels[platform.scores[i]]}
                  isHighlighted={hoveredCriterion === c.id}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border dark:border-border-dark pt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
              {platform.tagline}
            </p>

            {/* Full score breakdown — visible on all screens when expanded */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {criteria.map((c, i) => {
                const w = weights[c.id] ?? c.defaultWeight
                const Icon = SCORE_ICONS[platform.scores[i]]
                return (
                  <div
                    key={c.id}
                    className={`
                      flex items-start gap-2 p-2 rounded-lg text-xs
                      ${hoveredCriterion === c.id ? 'bg-accent/10 dark:bg-accent-light/10' : 'bg-slate-50 dark:bg-slate-800/50'}
                    `}
                    onMouseEnter={() => onHoverCriterion(c.id)}
                    onMouseLeave={() => onHoverCriterion(null)}
                  >
                    <Icon size={14} className={`shrink-0 mt-0.5 ${SCORE_COLORS[platform.scores[i]]}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{c.short}</span>
                        <span className="text-slate-400 font-mono">
                          {platform.scores[i]}x{w}={platform.scores[i] * w}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                        {platform.rationales[i]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [data, setData] = useState<EvalData | null>(null)
  const [weights, setWeights] = useState<Record<number, number>>({})
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [hoveredCriterion, setHoveredCriterion] = useState<number | null>(null)
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'eval' | 'pricing'>('eval')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [weightsSheetOpen, setWeightsSheetOpen] = useState(false)

  // Load data
  useEffect(() => {
    fetch('/evaluation.json')
      .then((r) => r.json())
      .then((d: EvalData) => {
        setData(d)
        const w: Record<number, number> = {}
        d.criteria.forEach((c) => { w[c.id] = c.defaultWeight })
        setWeights(w)
      })
  }, [])

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleWeightChange = useCallback((id: number, w: number) => {
    setWeights((prev) => ({ ...prev, [id]: w }))
  }, [])

  const handleReset = useCallback(() => {
    if (!data) return
    const w: Record<number, number> = {}
    data.criteria.forEach((c) => { w[c.id] = c.defaultWeight })
    setWeights(w)
  }, [data])

  const ranked = useMemo(() => {
    if (!data) return []
    return computeRankings(data.platforms, data.criteria, weights)
  }, [data, weights])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
        <div className="text-slate-500 font-mono text-sm animate-pulse">Loading evaluation data...</div>
      </div>
    )
  }

  const totalWeight = data.criteria.reduce((sum, c) => sum + (weights[c.id] ?? c.defaultWeight), 0)
  const defaultTotalWeight = data.criteria.reduce((sum, c) => sum + c.defaultWeight, 0)
  const hasChanges = totalWeight !== defaultTotalWeight ||
    data.criteria.some((c) => (weights[c.id] ?? c.defaultWeight) !== c.defaultWeight)

  return (
    <div className={`min-h-screen flex flex-col bg-surface dark:bg-surface-dark text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
      {/* Header */}
      <header className="shrink-0 border-b border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="font-display font-black text-xl tracking-tight">
              <span className="text-accent dark:text-accent-light">tacos</span>
              <span className="text-slate-400 font-semibold">.guru</span>
            </h1>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-1 md:ml-2">
              <button
                onClick={() => setActiveTab('eval')}
                className={`px-2 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'eval'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Info size={12} />
                <span className="hidden sm:inline">Evaluation</span>
                <span className="sm:hidden">Eval</span>
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-2 md:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'pricing'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <DollarSign size={12} />
                Pricing
              </button>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs font-mono px-2 py-1 rounded-md bg-accent/10 dark:bg-accent-light/10 text-accent dark:text-accent-light">
                {totalWeight}w (default: {defaultTotalWeight})
              </span>
            )}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-500 dark:text-slate-400 transition-colors"
              title="View on GitHub"
            >
              <Github size={16} />
            </a>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-500 dark:text-slate-400 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-500 dark:text-slate-400 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Dropdown menu */}
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface-raised dark:bg-surface-raised-dark rounded-xl border border-border dark:border-border-dark shadow-xl z-50 py-1 overflow-hidden">
                <button
                  onClick={() => { setDarkMode(!darkMode); setMobileMenuOpen(false) }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
                {activeTab === 'eval' && (
                  <button
                    onClick={() => { setWeightsSheetOpen(true); setMobileMenuOpen(false) }}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <SlidersHorizontal size={16} />
                    Adjust Weights
                  </button>
                )}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Github size={16} />
                  GitHub
                  <ExternalLink size={10} className="ml-auto text-slate-400" />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile weights bottom sheet */}
      {weightsSheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 bottom-sheet-backdrop"
            onClick={() => setWeightsSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bottom-sheet max-h-[70vh] bg-surface-raised dark:bg-surface-raised-dark rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark shrink-0">
              <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white tracking-wide uppercase">
                Criteria Weights
              </h2>
              <button
                onClick={() => setWeightsSheetOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                data={data}
                weights={weights}
                onChange={handleWeightChange}
                onReset={handleReset}
                hoveredCriterion={hoveredCriterion}
                onHoverCriterion={setHoveredCriterion}
                collapsed={false}
                onToggleCollapse={() => setWeightsSheetOpen(false)}
                isSheet
              />
            </div>
          </div>
        </div>
      )}

      {/* Close mobile menu on backdrop click */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'eval' ? (
          <>
            <div className="hidden md:flex">
              <Sidebar
                data={data}
                weights={weights}
                onChange={handleWeightChange}
                onReset={handleReset}
                hoveredCriterion={hoveredCriterion}
                onHoverCriterion={setHoveredCriterion}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>

            <main className="flex-1 overflow-y-auto dot-grid">
              <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-3">
                {/* Column legend for heatmap */}
                <div className="hidden lg:flex items-center gap-1 justify-end pr-10 mb-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-2 font-mono">Score key:</span>
                  {data.scoreLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-1 mr-3">
                      <div className={`w-4 h-4 rounded text-white text-[10px] flex items-center justify-center font-bold ${SCORE_BG[i]}`}>
                        {i}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>

                {ranked.map((platform, i) => (
                  <PlatformRow
                    key={platform.id}
                    platform={platform}
                    criteria={data.criteria}
                    weights={weights}
                    scoreLabels={data.scoreLabels}
                    hoveredCriterion={hoveredCriterion}
                    onHoverCriterion={setHoveredCriterion}
                    animDelay={i * 50}
                    expanded={expandedPlatform === platform.id}
                    onToggle={() =>
                      setExpandedPlatform(expandedPlatform === platform.id ? null : platform.id)
                    }
                  />
                ))}

                {/* Footer */}
                <div className="flex items-center justify-center gap-4 pt-6 pb-4">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Data sourced from public vendor documentation — February 2026
                  </p>
                  <a
                    href={`${REPO_URL}/edit/main/public/evaluation.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold flex items-center gap-1 px-2 py-1 rounded-md border border-border dark:border-border-dark text-slate-500 dark:text-slate-400 hover:text-accent dark:hover:text-accent-light hover:border-accent/40 dark:hover:border-accent-light/40 transition-colors"
                  >
                    <Github size={10} />
                    Submit correction
                  </a>
                </div>
              </div>
            </main>
          </>
        ) : (
          <PricingCalculator data={data} />
        )}
      </div>

      {/* Mobile FAB — open weights bottom sheet */}
      {activeTab === 'eval' && !weightsSheetOpen && (
        <button
          onClick={() => setWeightsSheetOpen(true)}
          className="fixed bottom-5 right-5 z-30 md:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent dark:bg-accent-light text-white dark:text-slate-900 shadow-lg hover:shadow-xl active:scale-95 transition-all font-display font-bold text-sm"
        >
          <SlidersHorizontal size={16} />
          Weights
        </button>
      )}
    </div>
  )
}
