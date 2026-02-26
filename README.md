# tacos.guru

An interactive evaluation tool for comparing TACOS (Terraform Automation & Collaboration Software) platforms. Compare Spacelift, Env0, Scalr, Terrateam, Terramate Cloud, HCP Terraform, and OpenTaco across 21 weighted criteria — and estimate monthly costs based on your team size, resources, and run volume.

**Live site:** [tacos.guru](https://tacos.guru)

## Features

- **Evaluation tab** — 21 criteria with adjustable weight sliders. Changing weights recalculates and re-sorts platform scores in real time. Expand any platform row to see per-criterion rationales.
- **Pricing tab** — 3 input sliders (users, resources under management, monthly runs). Auto-selects the cheapest tier per platform. Override tiers manually by clicking them in the expanded card.

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
- **`criteria`** — 21 evaluation criteria with default weights (1–5) and categories (Critical / High / Medium / Low / Nice-to-have)
- **`platforms`** — 7 platforms, each with scores (0–3) per criterion, rationale text, and metadata
- **`pricing`** — tier definitions for each platform including base prices, per-unit costs, feature gates, and whether a price is published or estimated

Scores and pricing were researched from public vendor documentation in February 2026.

### Evaluation criteria

| # | Criterion | Weight | Category |
|---|-----------|:------:|----------|
| 1 | CDKTF/CDK Terrain workflow support | **5** | Critical |
| 2 | OpenTofu support | **5** | Critical |
| 3 | No Kubernetes requirement | **5** | Critical |
| 4 | RBAC & SSO integration | **5** | Critical |
| 5 | Dependency orchestration | **4** | High |
| 6 | Drift detection | **4** | High |
| 7 | Secrets management (AWS OIDC) | **4** | High |
| 8 | Pricing suitability | **4** | High |
| 9 | Golden paths / blueprints | **3** | Medium |
| 10 | Migration path from Atlantis | **3** | Medium |
| 11 | Custom workflows / hooks | **3** | Medium |
| 12 | Private module registry | **3** | Medium |
| 13 | InfraCost / cost estimation | **3** | Medium |
| 14 | Integrations (MS Teams, DataDog) | **3** | Medium |
| 15 | Keep S3+DynamoDB state backends | **2** | Low |
| 16 | Visualizations / resource graphs | **2** | Low |
| 17 | OPA / Conftest policies | **3** | Medium |
| 18 | AI features | **1** | Nice-to-have |
| 19 | Ephemeral environments | **1** | Nice-to-have |
| 20 | Terraform provider | **1** | Nice-to-have |
| 21 | Multi-cloud support | **1** | Nice-to-have |

All weights are adjustable in the app. **Max weighted score: 195** (weight total × 3).

## Submitting corrections

Scores, rationales, and pricing data go out of date. To suggest a fix:

1. Click **Submit correction** in the app footer — it opens GitHub's web editor for `evaluation.json`
2. Make your change and open a pull request
3. Or [open an issue](https://github.com/so0k/tacos-guru/issues/new) describing the inaccuracy

## Deployment

Deployed to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`. Custom domain configured via [`public/CNAME`](public/CNAME).
