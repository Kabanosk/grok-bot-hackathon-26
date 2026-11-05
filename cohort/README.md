# Cohort

**Know your users. Before you launch.**

Cohort is a product-testing workspace for exploring customer perspectives with a swarm of AI agents. The intended architecture uses Grok-powered agents grounded in consented customer research. This first version makes the product and workflow tangible for a hackathon pitch.

## Run

From the repository root, use `npm ci` followed by `npm run dev`. The app runs at http://127.0.0.1:5173/.

Stack: React, TypeScript, Vite, Geist, and Lucide. The root package declares npm workspaces; this product is isolated in `cohort/` so other products and services can be added beside it.

## What works

- Responsive landing page with an original Cohort wordmark and vector logo.
- Interactive workspace with overview, simulations, fictional audience profiles, and planned data sources.
- Study setup with product context, three research objectives, three audience segments, and 24/48/96 sample participants.
- Required-field and URL validation, simulated progress, and study-specific sample findings.
- JSON report downloads, including an explicit demo-data provenance statement.
- Session-local overview updates after completing a sample study.
- Native dialog focus containment, keyboard dismissal, visible focus states, and reduced-motion support.

## Demo boundary

All names, personas, counts, scores, findings, and progress are illustrative. Reports are deterministic, prewritten examples selected by study type; they do not assess the supplied product. URLs are retained only in in-memory study context and the downloaded report. They are never fetched. Closing or refreshing the page discards the workspace state.

No API credentials, backend, real Grok swarm, customer interviews, file ingestion, authentication, or durable storage are connected. The data-sources panel explicitly shows disconnected integrations. Those are future implementation seams, not working features.

## Visual direction

The compact layouts, restrained typography, and detailed product preview take inspiration from [Linear](https://linear.app/). The product-research concept was informed by [Auxos](https://useauxos.com/); branding and interface are original.

Used the [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) to query design-system, color, modal focus, and React guidance. Its luxury palette supplied a verified stone-and-gold reference. That reference was adapted to the requested dark enterprise direction; the skill's generic blue SaaS recommendation was overridden by the brief.

| Token      | Color     | Purpose                    |
| ---------- | --------- | -------------------------- |
| Background | `#11130F` | Warm charcoal canvas       |
| Surface    | `#1B1D16` | Olive charcoal panels      |
| Text       | `#E9E9DE` | Warm neutral text          |
| Muted      | `#A7AB99` | Supporting text            |
| Accent     | `#E8BD7C` | Amber actions and identity |
| On accent  | `#292217` | Dark button text           |
| Sage       | `#A1B58A` | Completion and status      |

Global semantic colors are in `src/tokens.css`. Illustrations and fine borders use tonal variations in the stylesheet. The interface uses no blue-and-white theme, stock customer logos, or unsupported predictive-accuracy claims.

## Checks

From the root: `npm run build`, `npm run typecheck`, and `npm run test:e2e`. Browser checks cover the primary demo journey, report export, workspace navigation, mobile navigation, and horizontal overflow at 375/768/1024/1440px.
