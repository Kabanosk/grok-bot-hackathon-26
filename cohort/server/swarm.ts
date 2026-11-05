// Cohort swarm: a multi-agent study pipeline served from the Vite dev/preview server.
//
//   scout (reads the product URL)  ─┐
//   recruiter (builds the panel)   ─┴─> N persona agents in parallel ─> synthesizer ─> report
//
// Every step streams NDJSON events to the browser. Without XAI_API_KEY (or with MOCK_LLM=1)
// the same event stream is produced from deterministic sample data, so the demo never breaks.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  createDemoReport,
  sampleProfiles,
  type Audience,
  type Finding,
  type Objective,
  type Persona,
  type Reaction,
  type Report,
  type StudyConfig,
  type SwarmEvent,
} from "../src/demo";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const OBJECTIVES: Objective[] = ["Usability test", "Concept validation", "Pricing research"];
const AUDIENCES: Audience[] = ["Startup founders", "Product teams", "Everyday consumers"];
const SIZES = [24, 48, 96];
const TONES = ["amber", "sage", "rose", "stone"];

type Env = Record<string, string | undefined>;
type Emit = (event: SwarmEvent) => void;

export function agentCount(participants: number): number {
  return participants >= 96 ? 12 : participants >= 48 ? 8 : 6;
}

export function parseConfig(body: unknown): StudyConfig | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const config: StudyConfig = {
    product: str(b.product, 80),
    url: str(b.url, 2000),
    description: str(b.description, 1000),
    objective: b.objective as Objective,
    audience: b.audience as Audience,
    participants: Number(b.participants),
  };
  if (!config.product || !config.description) return null;
  if (!OBJECTIVES.includes(config.objective) || !AUDIENCES.includes(config.audience)) return null;
  if (!SIZES.includes(config.participants)) return null;
  if (config.url && !/^https?:\/\//i.test(config.url)) return null;
  return config;
}

// ---------------------------------------------------------------- Grok

async function grokJson(
  env: Env,
  system: string,
  user: string,
  signal: AbortSignal,
  temperature = 0.9,
): Promise<Record<string, unknown>> {
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.XAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model(env),
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(60_000)]),
  });
  if (!res.ok) throw new Error(`xAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Grok returned no JSON");
  return JSON.parse(text.slice(start, end + 1));
}

const model = (env: Env) => env.XAI_MODEL || "grok-4.7";
const isLive = (env: Env) => !!env.XAI_API_KEY && env.MOCK_LLM !== "1";

// ---------------------------------------------------------------- scout

export function pageText(html: string): { title: string; text: string } {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const text = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return { title, text: text.slice(0, 3000) };
}

async function scout(url: string, signal: AbortSignal): Promise<{ title: string; text: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CohortScout/0.1 (hackathon demo)" },
      signal: AbortSignal.any([signal, AbortSignal.timeout(6_000)]),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return pageText(await res.text());
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- prompts

const QUESTIONS: Record<Objective, string> = {
  "Usability test":
    "Imagine your first five minutes with this product. What do you try first, where do you get stuck, and would you come back tomorrow?",
  "Concept validation":
    "Does this solve a real problem you have today? What are you using instead, and what would make you switch?",
  "Pricing research":
    "What would you expect to pay per month? What would make it a no-brainer, and what would be a deal-breaker?",
};

function productBrief(config: StudyConfig, site: { title: string; text: string } | null): string {
  return [
    `Product: ${config.product}`,
    `Description: ${config.description}`,
    config.url ? `URL: ${config.url}` : "",
    site ? `Landing page (${site.title || "untitled"}), excerpt:\n"""${site.text.slice(0, 2000)}"""` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toPersona(raw: Record<string, unknown>, i: number): Persona {
  const name = String(raw.name ?? `Participant ${i + 1}`).slice(0, 40);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const attitude = String(raw.attitude ?? "pragmatist").toLowerCase();
  return {
    id: `p${i + 1}`,
    name,
    initials: initials || "P",
    role: String(raw.role ?? "Customer").slice(0, 60),
    context: String(raw.context ?? "").slice(0, 300),
    attitude: (["enthusiast", "pragmatist", "skeptic"].includes(attitude) ? attitude : "pragmatist") as Persona["attitude"],
    tone: TONES[i % TONES.length],
  };
}

function toReaction(raw: Record<string, unknown>, persona: Persona): Reaction {
  const verdict = String(raw.verdict ?? "maybe").toLowerCase();
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.score) || 50)));
  return {
    personaId: persona.id,
    name: persona.name,
    role: persona.role,
    initials: persona.initials,
    tone: persona.tone,
    verdict: (["yes", "maybe", "no"].includes(verdict) ? verdict : "maybe") as Reaction["verdict"],
    score,
    quote: String(raw.quote ?? "").slice(0, 280),
    concern: String(raw.concern ?? "").slice(0, 200),
    delight: String(raw.delight ?? "").slice(0, 200),
  };
}

export function aggregate(reactions: Reaction[], participants: number) {
  const n = Math.max(1, reactions.length);
  const share = (v: Reaction["verdict"]) =>
    Math.round((reactions.filter((r) => r.verdict === v).length / n) * participants);
  const yes = share("yes");
  const no = share("no");
  return {
    score: Math.round(reactions.reduce((s, r) => s + r.score, 0) / n),
    breakdown: { yes, maybe: Math.max(0, participants - yes - no), no },
  };
}

// ---------------------------------------------------------------- live pipeline

async function runLive(config: StudyConfig, env: Env, emit: Emit, signal: AbortSignal): Promise<void> {
  const k = agentCount(config.participants);
  emit({ type: "mode", mode: "live", model: model(env), agents: k });

  emit({ type: "stage", index: 0 });
  const sitePromise = config.url ? scout(config.url, signal) : Promise.resolve(null);
  const site = await sitePromise;
  if (config.url)
    emit({
      type: "scout",
      ok: !!site,
      detail: site ? `Read ${site.text.length} characters from “${site.title || config.url}”` : `Could not read ${config.url}`,
    });

  let personas: Persona[];
  try {
    const raw = await grokJson(
      env,
      "You are Cohort's recruiter agent. You assemble a realistic, diverse panel of synthetic customers for a product study. Reply with JSON only.",
      `${productBrief(config, site)}\n\nTarget audience: ${config.audience}\nStudy: ${config.objective}\n\n` +
        `Create exactly ${k} distinct personas from this audience. Mix attitudes: about a third enthusiasts, a third pragmatists, a third skeptics. ` +
        `Vary seniority, budget, company size, region and current tools. ` +
        `Return {"personas":[{"name":"first name + last initial","role":"short job/life role","context":"one sentence: situation, current workaround, budget","attitude":"enthusiast|pragmatist|skeptic"}]}`,
      signal,
    );
    const list = Array.isArray(raw.personas) ? (raw.personas as Record<string, unknown>[]) : [];
    if (list.length === 0) throw new Error("Recruiter returned no personas");
    personas = list.slice(0, k).map(toPersona);
  } catch (e) {
    emit({ type: "warning", message: `Recruiter fell back to sample panel (${(e as Error).message})` });
    personas = mockPersonas(config, k);
  }
  for (const p of personas) emit({ type: "persona", persona: p });

  emit({ type: "stage", index: 1 });
  const reactions: Reaction[] = [];
  await Promise.all(
    personas.map(async (p) => {
      try {
        const raw = await grokJson(
          env,
          `You are ${p.name}, ${p.role}. ${p.context} Your attitude toward new products: ${p.attitude}. ` +
            `You are a participant in a ${config.objective.toLowerCase()}. Stay fully in character, speak in first person, be specific and candid. ` +
            `Skeptics push back hard; nobody is polite for the sake of it. Reply with JSON only.`,
          `${productBrief(config, site)}\n\n${QUESTIONS[config.objective]}\n\n` +
            `Return {"verdict":"yes|maybe|no (would you use/buy it)","score":0-100,"quote":"one or two sentences in your own voice","concern":"your biggest concern, specific","delight":"what you like most, specific"}`,
          signal,
        );
        const r = toReaction(raw, p);
        reactions.push(r);
        emit({ type: "reaction", reaction: r });
      } catch (e) {
        if (!signal.aborted) emit({ type: "warning", message: `${p.name} dropped out (${(e as Error).message})` });
      }
    }),
  );
  if (reactions.length === 0) throw new Error("Every agent in the swarm failed");

  emit({ type: "stage", index: 2 });
  const { score, breakdown } = aggregate(reactions, config.participants);
  let findings: Finding[];
  let summary = "";
  try {
    const raw = await grokJson(
      env,
      "You are Cohort's lead researcher agent. You synthesize interviews from a swarm of synthetic customers into a short, actionable report for a product team. Weigh disagreement, name which personas raised each point, never invent data that is not in the interviews. Reply with JSON only.",
      `${productBrief(config, null)}\nStudy: ${config.objective}, audience: ${config.audience}\n\nInterviews:\n` +
        reactions
          .map(
            (r) =>
              `- ${r.name} (${r.role}) verdict=${r.verdict} score=${r.score}\n  quote: ${r.quote}\n  concern: ${r.concern}\n  delight: ${r.delight}`,
          )
          .join("\n") +
        `\n\nReturn {"summary":"two sentences: overall reception and the main split in opinion","findings":[{"title":"imperative recommendation, max 8 words","detail":"one or two sentences with evidence from named personas","severity":"High|Medium|Low"}]} with exactly 3 findings ordered by severity.`,
      signal,
      0.4,
    );
    const list = Array.isArray(raw.findings) ? (raw.findings as Record<string, unknown>[]) : [];
    findings = list.slice(0, 3).map((f) => ({
      title: String(f.title ?? "").slice(0, 120),
      detail: String(f.detail ?? "").slice(0, 400),
      severity: (["High", "Medium", "Low"].includes(String(f.severity)) ? f.severity : "Medium") as Finding["severity"],
    }));
    if (findings.length === 0) throw new Error("no findings");
    summary = String(raw.summary ?? "").slice(0, 400);
  } catch (e) {
    emit({ type: "warning", message: `Synthesizer failed, using raw concerns (${(e as Error).message})` });
    findings = reactions
      .filter((r) => r.concern)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((r, i) => ({
        title: `Address ${r.name}'s concern`,
        detail: r.concern,
        severity: (["High", "Medium", "Low"] as const)[i],
      }));
  }

  emit({ type: "stage", index: 3 });
  const report: Report = {
    config: { ...config },
    score,
    findings,
    completedAt: new Date().toISOString(),
    mode: "live",
    model: model(env),
    agents: reactions.length,
    summary,
    breakdown,
    voices: reactions,
  };
  emit({ type: "report", report });
}

// ---------------------------------------------------------------- mock pipeline

const EXTRA_NAMES = [
  ["Nadia P.", "Operations lead"],
  ["Tomasz W.", "Freelance consultant"],
  ["Lena H.", "Growth marketer"],
  ["Omar B.", "Agency owner"],
  ["Priya S.", "Data analyst"],
  ["Ben C.", "Customer success manager"],
  ["Mai T.", "Student and side-project builder"],
  ["Felix R.", "Finance manager"],
];

function mockPersonas(config: StudyConfig, k: number): Persona[] {
  const base = sampleProfiles[config.audience].map((p) => [p.name, p.role]);
  const pool = [...base, ...EXTRA_NAMES];
  const attitudes: Persona["attitude"][] = ["enthusiast", "pragmatist", "skeptic"];
  return pool.slice(0, k).map(([name, role], i) =>
    toPersona({ name, role, context: "Sample persona.", attitude: attitudes[i % 3] }, i),
  );
}

const MOCK_LINES: Record<Persona["attitude"], { verdict: Reaction["verdict"]; score: number; quote: string }> = {
  enthusiast: { verdict: "yes", score: 82, quote: "I'd try this today if the first step were obvious." },
  pragmatist: { verdict: "maybe", score: 64, quote: "Looks useful, but I need to see it with my own data before I commit." },
  skeptic: { verdict: "no", score: 38, quote: "I've seen tools like this before. Show me why it beats what I already use." },
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

async function runMock(config: StudyConfig, emit: Emit, signal: AbortSignal): Promise<void> {
  const k = agentCount(config.participants);
  emit({ type: "mode", mode: "demo", model: "sample data", agents: k });
  emit({ type: "stage", index: 0 });
  const personas = mockPersonas(config, k);
  for (const p of personas) {
    await sleep(60, signal);
    emit({ type: "persona", persona: p });
  }
  emit({ type: "stage", index: 1 });
  const reactions: Reaction[] = [];
  for (const p of personas) {
    await sleep(140, signal);
    const line = MOCK_LINES[p.attitude];
    const r = toReaction(
      { ...line, concern: "Sample concern.", delight: "Sample delight." },
      p,
    );
    reactions.push(r);
    emit({ type: "reaction", reaction: r });
  }
  emit({ type: "stage", index: 2 });
  await sleep(400, signal);
  emit({ type: "stage", index: 3 });
  await sleep(300, signal);
  const demo = createDemoReport(config);
  emit({
    type: "report",
    report: {
      ...demo,
      mode: "demo",
      model: "sample data",
      agents: reactions.length,
      breakdown: aggregate(reactions, config.participants).breakdown,
      voices: reactions,
    },
  });
}

// ---------------------------------------------------------------- HTTP

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 20_000) reject(new Error("Body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function studyHandler(env: Env) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method !== "POST") return next();
    let config: StudyConfig | null = null;
    try {
      config = parseConfig(JSON.parse(await readBody(req)));
    } catch {
      config = null;
    }
    if (!config) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid study configuration" }));
      return;
    }
    const controller = new AbortController();
    res.on("close", () => controller.abort());
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders?.();
    const emit: Emit = (e) => {
      if (!res.writableEnded) res.write(`${JSON.stringify(e)}\n`);
    };
    try {
      if (isLive(env)) await runLive(config, env, emit, controller.signal);
      else await runMock(config, emit, controller.signal);
    } catch (e) {
      if (!controller.signal.aborted) emit({ type: "error", message: (e as Error).message });
    }
    res.end();
  };
}

export function swarmPlugin(env: Env): Plugin {
  const info = (_req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ live: isLive(env), model: isLive(env) ? model(env) : "sample data" }));
  };
  return {
    name: "cohort-swarm",
    configureServer(server) {
      server.middlewares.use("/api/study", studyHandler(env));
      server.middlewares.use("/api/info", info);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/study", studyHandler(env));
      server.middlewares.use("/api/info", info);
    },
  };
}
