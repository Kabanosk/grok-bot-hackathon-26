# Cohort

**Know your users. Before you launch.**

Cohort points a team of Grok agents at your product page and returns a research readout in about a minute. A scout agent reads the landing page, a recruiter agent builds a diverse panel (skeptics included), persona agents are interviewed in parallel, argue with each other in a second round, and a lead-researcher agent turns the debate into three ranked findings that cite the personas by name.

It is a pre-flight check. It tells you which questions to bring to your real customer interviews. It does not replace them, and every result is labeled as synthetic opinion.

Built at the Grok Bot Hackathon Wroclaw (multi-agent systems track).

## Run

Requirements: Node 20.19 or newer (or 22.12+), an xAI API key for live mode (optional).

```bash
npm ci
cp .env.example .env     # then set XAI_API_KEY in .env
npm run dev
```

Run these from the repository root. The app opens at http://127.0.0.1:5173/. `GET /api/info` returns `{"live":true,"model":"..."}` when the key is loaded and `{"live":false,"model":"sample data"}` otherwise.

| Variable | Default | Meaning |
|---|---|---|
| `XAI_API_KEY` | none | xAI API key. Without it the app runs in mock mode. |
| `XAI_MODEL` | `grok-4.7` | Model id sent to `https://api.x.ai/v1/chat/completions`. Pin it to an id your key accepts. |
| `MOCK_LLM` | unset | `1` forces mock mode even when a key is set. |

The server reads `.env` from the repository root or from `cohort/`, and real environment variables override both. `.env.example` lists the three variables.

Stack: React, TypeScript, Vite, Geist, Lucide. The swarm runs as middleware on the Vite dev and preview server (`server/swarm.ts`), so there is no separate backend process. The root package declares npm workspaces; this product lives in `cohort/`.

## How it works

Open the workspace, enter a product name, an optional URL and a description, then choose what to learn (usability test, concept validation or pricing research), the audience, and the panel size (6, 8 or 12 Grok agents). The browser POSTs the study to `/api/study` and reads a stream of newline-delimited JSON events, so every step appears as it happens.

```
product URL ──> scout ──> recruiter ──> persona agents ×N (parallel) ──> panel debate ──> lead researcher ──> report
```

| Stage | Agent | What it does |
|---|---|---|
| 1 | Scout | Fetches the product URL on the server, strips markup, and keeps up to 3,000 characters of page text as shared context. |
| 2 | Recruiter | One Grok call that returns the panel: name, role, situation and attitude (enthusiast, pragmatist, skeptic) for each persona. The prompt asks for roughly a third skeptics and varied seniority, budget, region and tools. |
| 3 | Persona agents | One Grok call per persona, run in parallel. Each answers in character and returns a verdict (yes, maybe, no), a 0 to 100 score, a quote, a concern and a delight. |
| 4 | Panel debate | Round 2 for panels of 8 agents or fewer. Each persona reads 2 to 3 other panelists' answers, always including one with a different verdict, replies to one of them by name, and may change its verdict. The reply and any change appear on its card. |
| 5 | Lead researcher | Reads all interviews and replies, and returns a summary plus exactly three severity-ranked findings that name the personas behind each. |

The report shows the overall score (the mean of the personas' own 0 to 100 ratings), the would-use / maybe / no split, three findings, each panelist's voice, and a JSON download that records the model, the agent count and a synthetic-data provenance statement.

Failure handling: a persona that times out or errors is dropped and the rest continue; if the recruiter fails it falls back to a sample panel with a visible warning; if the debate reply fails for a persona, its round-1 verdict stands; if the synthesizer fails, the report uses the raw concerns. Each Grok call times out after 60 seconds, and the scout after 6.

### Live and mock mode

- **Live** (key present, `MOCK_LLM` not `1`): every agent is a real call to xAI. The workspace header reads `LIVE · <model>` and the progress line shows how many of the N agents answered.
- **Mock** (no key, or `MOCK_LLM=1`): the same event stream is replayed from deterministic sample data, including a sample debate, so the UI and demo flow run offline. The badge reads "Sample data". The findings in mock mode are prewritten and do not assess the product you typed.

Labels always show the true agent count (for example "8 Grok agents"). Cohort does not extrapolate the panel to a larger headcount.

## Limitations

- Synthetic opinions. The personas are Grok-generated hypotheses, not people. The recruiter prompt sets the skeptic share, so the number of "no" votes reflects who is in the room as well as the product. Scores are LLM self-ratings with no calibration, and repeated runs differ.
- Landing text only. Agents read the stripped text of the page (up to about 2,000 characters reach each persona prompt). They never see the UI or click anything, so this tests first impressions of the pitch and page, not task-based usability.
- Client-rendered pages (single-page apps) return almost no text to a plain fetch. Use a server-rendered landing page.
- The scout fetches any http(s) URL from the server and passes the page text into the prompts. There is no SSRF filter or prompt-injection hardening.
- Not validated against real user research. We have not measured agreement with real interview data or run-to-run stability.
- Roadmap, not built: grounding personas in live X posts through xAI's X search tool, personas drawn from real interview notes, and a browser-driving agent for task-based testing.
- No accounts, persistence or authentication. Closing the page discards the workspace state.

## Judging criteria

| Criterion | Where to look |
|---|---|
| Working Prototype | `npm run dev` runs end to end in live and mock mode; Playwright covers the setup-to-report journey, the streaming API (including the debate) and responsive layouts. |
| Technical Complexity & Integration | Five agent roles with shared product context, parallel fan-out, an agent-to-agent debate round, NDJSON streaming, per-agent failure handling, and real-world data from the fetched landing page (`server/swarm.ts`). |
| Innovation & Creativity | A focus group instead of a survey: personas answer each other and can change their minds, and the output is the next question to ask real users. |
| Real-World Impact | Pre-launch validation is slow and costly for every product team; Cohort gives a founder with a URL a first read in about a minute. Labeled synthetic, positioned as a pre-filter. |
| Theme Alignment | Multi-agent track: specialised agents that divide the work, debate each other's answers and check each other's output toward one shared report. |

## Visual direction

The compact layouts, restrained typography, and detailed product preview take inspiration from [Linear](https://linear.app/). Branding and interface are original.

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

From the root: `npm run build`, `npm run typecheck`, and `npm run test:e2e`. An API check covers the streamed swarm (personas, reactions, debate, report) in mock mode. Browser checks cover the primary demo journey, report export, workspace navigation, mobile navigation, and horizontal overflow at 375/768/1024/1440px.
