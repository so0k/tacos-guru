# tacos.guru

An interactive evaluation tool for comparing TACOS (Terraform Automation & Collaboration Software) platforms. Compare Spacelift, env0, Scalr, Terramate, Stategraph (formerly Terrateam), HCP Terraform, OpenTaco (formerly Digger), ops0, Pulumi, Terragrunt Scale, Atmos, and OTF across 24 weighted criteria — plus 5 hard gates that can disqualify a platform outright — and estimate monthly costs based on your team size, resources, run volume, and stack count.

**Live site:** [tacos.guru](https://tacos.guru)

## Features

- **Evaluation tab** — 24 criteria with adjustable weight sliders. Changing weights recalculates and re-sorts platform scores in real time. Two criteria (Chat integration, VCS integration) are scored per-variant — pick your chat tool and VCS provider from the sidebar selects and the weighted total updates to match. Expand any platform row to see per-criterion rationales, the 5 hard gates (pass/fail with evidence + source link), and — for disqualified platforms — which gates failed.
- **Hard gates** — G1–G5 (no Kubernetes required, self-hosted runners in your cloud account, can run a CDK Terrain synth step, maintained within 6 months, OpenTofu support) are shown per platform. A platform that fails any gate is marked **Disqualified**, sorted after qualified platforms, and can be hidden entirely with the "Show disqualified" toggle.
- **Pricing tab** — 4 input sliders (users, resources under management, monthly runs, stacks/workspaces). Auto-selects the cheapest usable tier per platform; quote-only tiers show "Contact sales" instead of a price, and tiers not viable at team scale are labelled accordingly. Override tiers manually by clicking them in the expanded card. The Evaluation tab's "Pricing suitability" criterion is computed live from these same slider inputs, so changing them re-scores every platform.

## Running locally

```bash
# Requires pnpm
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
# Production build (output in dist/)
pnpm build
pnpm preview
```

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) icons

## Data

All evaluation data lives in a single file: [`public/evaluation.json`](public/evaluation.json)

It contains:
- **`criteria`** — 24 evaluation criteria with default weights (1–5) and categories (Critical / High / Medium / Low / Nice-to-have). Two criteria carry `variants` (Chat integration: Slack / MS Teams / Google Chat; VCS integration: GitHub / GitLab / Bitbucket / Azure DevOps) with a `defaultVariant`.
- **`gates`** — the 5 hard gates (G1–G5) shown on every platform, each with a pass/fail result, evidence text, and a source link.
- **`excluded`** — platforms considered but excluded before scoring (e.g. Terrakube — requires Kubernetes), shown as a subtle note below the platform list.
- **`platforms`** — 12 platforms, each with scores (0–3) per criterion, per-variant scores for the two variant criteria, gate results, a `disqualified` flag, rationale text, and metadata.
- **`pricing`** — tier definitions for each platform including base prices, per-unit costs (including per-stack), feature gates, quote-only/auto-select flags, a source link, and a `pricingScore` mapping (cost bands → 0–3) used to derive the "Pricing suitability" criterion live from the calculator.

Scores and pricing were researched from public vendor documentation in September 2026.

### Hard gates

| Gate | Requirement |
|------|-------------|
| G1 | No Kubernetes required |
| G2 | Self-hosted runners in your cloud account |
| G3 | Can run a CDK Terrain synth step before plan |
| G4 | Maintained (release in last 6 months) |
| G5 | OpenTofu support |

A platform failing any gate is disqualified — still shown and scored, but ranked after every qualified platform.

### Evaluation criteria

| # | Criterion | Weight | Category |
|---|-----------|:------:|----------|
| 1 | CDK Terrain workflow | **5** | Critical |
| 2 | OpenTofu support | **5** | Critical |
| 3 | Self-hosted runners, no K8s | **5** | Critical |
| 4 | RBAC & SSO | **5** | Critical |
| 5 | Linked-state orchestration | **5** | Critical |
| 6 | Drift detection | **4** | High |
| 7 | Cloud credentials (OIDC) | **4** | High |
| 8 | Pricing suitability | **4** | High |
| 9 | Repo scaffolding & codegen | **4** | High |
| 10 | State governance & RBAC | **4** | High |
| 11 | Migration from Atlantis | **3** | Medium |
| 12 | Custom workflows, hooks & gates | **3** | Medium |
| 13 | Private module registry | **3** | Medium |
| 14 | Cost estimation | **3** | Medium |
| 15 | Policy as code | **3** | Medium |
| 16 | AI: trusted PR review | **3** | Medium |
| 17 | Chat integration (variant-scored) | **4** | High |
| 18 | VCS integration (variant-scored) | **3** | Medium |
| 19 | Observability | **3** | Medium |
| 20 | Visualizations / graphs | **2** | Low |
| 21 | AI: agentic ops & MCP | **2** | Low |
| 22 | Ephemeral environments | **1** | Nice-to-have |
| 23 | Terraform provider | **1** | Nice-to-have |
| 24 | Multi-cloud support | **1** | Nice-to-have |

All weights are adjustable in the app, and the max weighted score is computed from the current weights rather than hardcoded — with default weights (total 80) it's **240** (weight total × 3).

## Submitting corrections

Scores, rationales, and pricing data go out of date. To suggest a fix:

1. Click **Submit correction** in the app footer — it opens GitHub's web editor for `evaluation.json`
2. Make your change and open a pull request
3. Or [open an issue](https://github.com/so0k/tacos-guru/issues/new) describing the inaccuracy

## Deployment

Deployed to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`. Custom domain configured via [`public/CNAME`](public/CNAME).
