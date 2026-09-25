# CLAUDE.md

## What this is

A Vite + React 19 + TypeScript SPA that evaluates TACOS (Terraform Automation & Collaboration Software) platforms. Live at [tacos.guru](https://tacos.guru).

## Commands

```bash
pnpm install     # install deps
pnpm dev         # dev server → http://localhost:5173
pnpm build       # production build → dist/
pnpm preview     # preview production build
```

## Architecture

- **`public/evaluation.json`** — single source of truth for all data: criteria, platform scores, rationales, pricing tiers
- **`src/App.tsx`** — main layout, tab switching (Evaluation / Pricing), sidebar weight sliders, platform rows
- **`src/PricingCalculator.tsx`** — pricing tab: usage sliders, tier auto-selection, cost cards
- **`src/pricing.ts`** — pure pricing calculation logic (no React)
- **`src/types.ts`** — all TypeScript interfaces

Scores are 0–3. Weights are 1–5. Weighted score = `sum(score × weight)`. Max is computed from the current weights (default weight total 80 → max 240), not hardcoded. Criteria 17 (Chat) and 18 (VCS) are variant-scored — see `Criterion.variants`/`Platform.variants` in `src/types.ts`. Criterion 8 (Pricing suitability) is derived live from the pricing calculator via `computePricingScore` in `src/pricing.ts` rather than a static score.

Pricing tier selection picks the cheapest autoSelect-able tier that can handle the given inputs (users, RUM, runs/mo, stacks); falls back to a quote-only tier, then to the last tier flagged as exceeding limits. `PricingInputs`/pricing state now live in `App.tsx` and are passed down, so both tabs share one set of slider values.

## Recommended skills

Install these Claude Code skills before working on UI or React code in this repo:

```bash
claude skill add frontend-design      # high-quality UI design (from anthropics/skills)
claude skill add web-design-guidelines  # accessibility + UX review (from vercel-labs/agent-skills)
```

Use `/find-skills` in Claude Code to discover additional relevant skills.
