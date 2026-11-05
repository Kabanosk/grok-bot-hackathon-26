# Cohort

A customer-research workspace for exploring demand, pricing and product decisions. The app lives in `cohort/` within the root npm-workspace monorepo.

## Local workspace

Run `npm ci` and `npm run dev` from the repository root. Open **http://127.0.0.1:5173/workspace**. Choose **Enter demo workspace** to use mock sign-in with any email address. This does not authenticate a real account. Sign-in lasts for the browser session; research and source documents are saved in browser local storage.

The default **Synthetic sandbox** is available immediately without credentials. Its data is deterministic and explicitly illustrative:

- 12,000 fictional customer profiles across 12 cities, six income bands, 12 occupation groups and three adoption attitudes.
- Population visualization, demographic distributions, filters, search, paginated records and CSV export.
- Concept, usability and pricing study configuration with 6, 12 or 24 independent perspectives.
- Survey-question builder, two-variant A/B research, individual focus-group conversations and report export.
- Pricing sensitivity, adjustable price and audience region, and computed demand/revenue curves over synthetic willingness-to-pay values.
- Imported interview, feedback, survey and research documents in text, Markdown, CSV or JSON format.
- Historical calibration from CSV columns `score,outcome`: adjustable acceptance/rejection thresholds, confusion matrix, false-positive/false-negative rates and abstention coverage. Labels must be 1 or 0. No error rate is claimed without imported labels.

Synthetic outputs are not measured customer behavior, real revenue forecasts, empirical conversion rates or evidence of predictive accuracy. The mock login and browser storage are intended for local hackathon use, not production account security.

## Visual system

The white-and-green palette matches the pitch at `docs/presentation/cohort/cohort-pitch-45s-en.pdf`, inspected along with its slide source:

| Role | Color |
| --- | --- |
| Primary green | `#176D67` |
| Text | `#132335` |
| Muted text | `#637184` |
| Borders | `#DCE3E8` |
| Pale green | `#EDF6F3` |
| Surface | `#F5F7F9` |
| Canvas | White |

The workspace keeps the logo in its sidebar navigation and centers the interface on tables, metrics, charts, source evidence and research activity. Typography is Geist. Layout takes inspiration from Linear; research workflows take inspiration from Auxos. UI/UX Pro Max supplied layout, focus, accessibility and streaming-feedback guidance; the supplied pitch is the authority for final colors.

## Native Grok Bot connection

The optional **Cloud Grok Bots** mode uses an actual user-configured Grok Bot/automation webhook and authenticated callbacks. It does not replace native Bots with direct xAI model calls.

1. Configure a cloud Bot coordinator or compatible automation that follows the incoming task instructions and posts the requested callback events. The Connection dialog provides setup instructions.
2. Copy the saved routine endpoint and its credential. Current grok.com automations use a `whsec_` signing secret. The server signs the exact JSON body using Standard Webhooks HMAC-SHA256 and accepts HTTP 202 as task acceptance. Legacy Bearer routines are also supported.
3. Provide a public HTTPS callback origin. If `cloudflared` is installed, `npm run dev:cloud` starts a temporary tunnel to the callback-only relay on port 5174 and serves the workspace on port 5173. Other paths on the relay return 404.
4. Save the connection in the local app. Credentials stay in the local server process and are not returned to the client or saved to browser storage. Alternatively configure the server-only values listed in `.env.example`.
5. Choose Cloud Grok Bots and submit an actual research brief. No routine is invoked merely by saving connection settings.

The coordinator instructions specify product inspection, source-backed market benchmarks, independent persona Bots on their cloud computers, activity/response reporting and an evidence-linked decision brief. Real benchmark definitions, source links, periods, sample sizes and gaps remain visible. Observed AI task completion is kept separate from observed human conversion. Weighted model appeal is not presented as a conversion probability.

**Acceptance is not completion.** The app reports activity and final results only after valid authenticated callback events. It checks persona counts/IDs, completed or failed workers, market evidence and finding references. Failed workers remain explicit.

Native cloud access still depends on the account's eligibility and privacy settings. No real cloud Bot study has been completed or verified in this implementation session. The supplied account was blocked by Legacy Privacy Mode, and no irreversible privacy setting was changed. A valid Cursor API key alone is not a Grok automation signing secret. The default synthetic workspace remains usable independently.

The server's callback jobs and credentials last until restart. Completed reports also save to the browser that receives them. This is a local integration bridge, not a production deployment or verified end-to-end native swarm. Do not serve the Vite development server publicly.

## Source structure

- `src/research/ResearchWorkspace.tsx`: workspace, mock login, research, conversations and source library.
- `src/research/PopulationExplorer.tsx`, `PriceLab.tsx`, `Calibration.tsx`: data views.
- `src/research/contracts.ts`: shared request, event and report contracts.
- `src/research/synthetic.ts`: deterministic sample population and responses.
- `server/api.ts`: local configuration, webhook dispatch and callback processing.
- `server/protocol.ts`: operational instructions for the real cloud coordinator.
- `server/webhook-signing.ts`: Standard Webhooks request signing.
- `scripts/dev-cloud.mjs`: local development with a callback-only tunnel.

Validation for this change is `npm run build`, which includes strict TypeScript compilation. Automated test execution was intentionally omitted at the user's request; CI builds the app only. The existing test files cover the earlier modal demo and were not used to validate this new workspace.

Protocol references: [Grok automation webhook signing](https://docs.x.ai/grok/automations/webhooks), [native Grok Bot routines](https://cursor.com/help/grok-bot/routines), [Grok Bot cloud computers](https://docs.x.ai/grok-bot/computer-and-apps).

## Cohort Master (Grok Bot)

Grok Bot runs as the "Cohort Master" bot (instructions: [`COHORT_MASTER.md`](./COHORT_MASTER.md)). Asked to test a product on a market, it splits the market into 8 segments, simulates adoption in all 16 Polish voivodeships, recruits and interviews 32 personas, runs a cross-segment debate and writes a go/no-go report. Each step is pushed with the `cohort` CLI (`node cohort/bin/cohort.mjs`) to `/api/market` and rendered live at `/#panel`. A recorded run (`server/seed-poland.json`) loads with `node cohort/bin/cohort.mjs load cohort/server/seed-poland.json`; static hosting shows it from `public/market-demo.json`.
