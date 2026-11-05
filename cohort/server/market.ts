// Market panel store. Grok Bot ("Cohort Master") pushes a market cohort step by step
// (via `node cohort/bin/cohort.mjs` or plain curl); the #panel view polls GET /api/market.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

type Verdict = "yes" | "maybe" | "no";
type Obj = Record<string, unknown>;
export type MarketState = {
  study: Obj | null;
  segments: Obj[];
  personas: Obj[];
  reactions: Obj[];
  debate: Obj[];
  report: Obj | null;
  log: { at: string; text: string }[];
};

const empty = (): MarketState => ({
  study: null,
  segments: [],
  personas: [],
  reactions: [],
  debate: [],
  report: null,
  log: [],
});

const LIST_KINDS = ["segments", "personas", "reactions", "debate"] as const;
type ListKind = (typeof LIST_KINDS)[number];
const KEY: Record<ListKind, string> = {
  segments: "id",
  personas: "id",
  reactions: "personaId",
  debate: "",
};

const asArray = (body: unknown, kind: string): Obj[] => {
  if (Array.isArray(body)) return body as Obj[];
  if (body && typeof body === "object") {
    const inner = (body as Obj)[kind];
    if (Array.isArray(inner)) return inner as Obj[];
    return [body as Obj];
  }
  return [];
};

// Upsert by key so Grok Bot can resend items without duplicates.
function merge(list: Obj[], items: Obj[], key: string): Obj[] {
  if (!key) return [...list, ...items];
  const out = [...list];
  for (const item of items) {
    const i = out.findIndex((x) => x[key] !== undefined && x[key] === item[key]);
    if (i >= 0) out[i] = { ...out[i], ...item };
    else out.push(item);
  }
  return out;
}

export function applyUpdate(state: MarketState, kind: string, body: unknown): MarketState {
  const now = new Date().toISOString();
  if (kind === "reset") {
    const study = (body && typeof body === "object" ? (body as Obj) : {}) as Obj;
    return { ...empty(), study: { ...study, createdAt: now }, log: [{ at: now, text: `New study: ${study.product ?? "?"} on ${study.market ?? "?"}` }] };
  }
  if (kind === "load") {
    const b = (body ?? {}) as Partial<MarketState>;
    return { ...empty(), ...b, log: b.log ?? [] };
  }
  if (kind === "study") return { ...state, study: { ...(state.study ?? {}), ...(body as Obj) } };
  if (kind === "report") return { ...state, report: body as Obj };
  if (kind === "log") {
    const text = typeof body === "string" ? body : String((body as Obj)?.text ?? "");
    return text ? { ...state, log: [...state.log, { at: now, text: text.slice(0, 300) }] } : state;
  }
  if ((LIST_KINDS as readonly string[]).includes(kind)) {
    const k = kind as ListKind;
    const items = asArray(body, k);
    return { ...state, [k]: merge(state[k], items, KEY[k]) };
  }
  throw new Error(`Unknown kind "${kind}"`);
}

const verdictOf = (v: unknown): Verdict | null => (v === "yes" || v === "maybe" || v === "no" ? v : null);

export function stats(state: MarketState) {
  // Debate can change a persona's verdict: the latest debate entry wins.
  const finalVerdict = new Map<string, Verdict>();
  for (const r of state.reactions) {
    const v = verdictOf(r.verdict);
    if (v) finalVerdict.set(String(r.personaId), v);
  }
  for (const d of state.debate) {
    const v = verdictOf(d.verdict);
    if (v && d.changed) finalVerdict.set(String(d.personaId), v);
  }
  const scoreOf = new Map(state.reactions.map((r) => [String(r.personaId), Number(r.score)]));
  const bySegment = state.segments.map((s) => {
    const members = state.personas.filter((p) => p.segmentId === s.id).map((p) => String(p.id));
    const scores = members.map((id) => scoreOf.get(id)).filter((x): x is number => Number.isFinite(x));
    const count = (v: Verdict) => members.filter((id) => finalVerdict.get(id) === v).length;
    return {
      segmentId: s.id,
      share: Number(s.share) || 0,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      yes: count("yes"),
      maybe: count("maybe"),
      no: count("no"),
    };
  });
  const weighted = bySegment.filter((s) => s.score !== null && s.share > 0);
  const totalShare = weighted.reduce((a, s) => a + s.share, 0);
  const weightedScore = totalShare
    ? Math.round(weighted.reduce((a, s) => a + s.share * (s.score as number), 0) / totalShare)
    : null;
  let adoption: { yes: number; maybe: number; no: number } | null = null;
  const answeredSegs = bySegment.filter((s) => s.yes + s.maybe + s.no > 0 && s.share > 0);
  const shareSum = answeredSegs.reduce((a, s) => a + s.share, 0);
  if (shareSum) {
    const part = (v: Verdict) =>
      Math.round(answeredSegs.reduce((a, s) => a + (s.share * s[v]) / (s.yes + s.maybe + s.no), 0) / shareSum * 100);
    const yes = part("yes");
    const no = part("no");
    adoption = { yes, maybe: Math.max(0, 100 - yes - no), no };
  }
  return {
    personas: state.personas.length,
    answered: state.reactions.length,
    weightedScore,
    adoption,
    bySegment: bySegment.map(({ share: _share, ...rest }) => rest),
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 2_000_000) reject(new Error("Body too large"));
    });
    req.on("end", () => resolveBody(data));
    req.on("error", reject);
  });
}

export function marketPlugin(file = resolve(process.cwd(), ".local/market.json")): Plugin {
  let state: MarketState = empty();
  try {
    if (existsSync(file)) state = { ...empty(), ...JSON.parse(readFileSync(file, "utf8")) };
  } catch {
    state = empty();
  }
  const save = () => {
    try {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(state, null, 2));
    } catch {
      /* persistence is best effort */
    }
  };
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const send = (code: number, body: unknown) => {
      res.statusCode = code;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(body));
    };
    const kind = (req.url ?? "/").split("?")[0].replace(/^\/+|\/+$/g, "");
    if (req.method === "GET" && !kind) return send(200, { ...state, stats: stats(state) });
    if (req.method !== "POST" || !kind) return send(405, { error: "Use GET /api/market or POST /api/market/<kind>" });
    try {
      const raw = await readBody(req);
      const body = raw.trim() ? JSON.parse(raw) : {};
      state = applyUpdate(state, kind, body);
      save();
      return send(200, { ok: true, kind, stats: stats(state) });
    } catch (e) {
      return send(400, { error: (e as Error).message });
    }
  };
  return {
    name: "cohort-market",
    configureServer(server) {
      server.middlewares.use("/api/market", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/market", handler);
    },
  };
}
