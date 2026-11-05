import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  personaSchema,
  reactionSchema,
  studySchema,
  synthesisSchema,
  marketEvidenceSchema,
  type Persona,
  type ResearchEvent,
  type ResearchReport,
  type Study,
} from "../src/research/contracts.ts";
import { coordinatorInstruction, setupInstruction } from "./protocol.ts";
import { signedWebhookHeaders } from "./webhook-signing.ts";

type Runtime = { webhookUrl: string; webhookKey: string; publicUrl: string };
type Job = {
  id: string;
  owner: string;
  token: string;
  task: string;
  study: Study;
  events: ResearchEvent[];
  listeners: Set<(event: ResearchEvent) => void>;
  personas: Persona[];
  responses: ResearchReport["responses"];
  failures: ResearchReport["failures"];
  context: ResearchReport["productContext"];
  market: ResearchReport["marketEvidence"];
  status: "running" | "complete" | "error";
  created: number;
  report?: ResearchReport;
};
const sessions = new Map<string, Runtime>();
const jobs = new Map<string, Job>();
const safeHttps = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname)
  );
}, "Use a public HTTPS URL.");
const runtimeSchema = z.object({
  webhookUrl: safeHttps,
  webhookKey: z.string().trim().min(8).max(2000),
  publicUrl: safeHttps,
});
const personaWithId = personaSchema.extend({
  id: z.string().regex(/^agent-\d+$/),
});
const contextSchema = z.object({
  fetched: z.boolean(),
  title: z.string().max(300),
  excerpt: z.string().max(20_000),
  url: z.string().max(2000),
});
const callbackSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("phase"),
    phase: z.enum(["context", "market", "population", "agents", "synthesis"]),
    message: z.string().max(1000),
  }),
  z.object({ type: z.literal("context"), context: contextSchema }),
  z.object({ type: z.literal("market"), evidence: marketEvidenceSchema }),
  z.object({
    type: z.literal("population"),
    personas: z.array(personaWithId).min(1).max(24),
  }),
  z.object({ type: z.literal("agent.start"), agentId: z.string() }),
  z.object({
    type: z.literal("agent.delta"),
    agentId: z.string(),
    preview: z.string().max(6000),
  }),
  z.object({
    type: z.literal("agent.activity"),
    agentId: z.string(),
    message: z.string().max(1200),
    screenshot: z
      .string()
      .max(700_000)
      .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
      .optional(),
  }),
  z.object({
    type: z.literal("agent.complete"),
    agentId: z.string(),
    reaction: reactionSchema,
  }),
  z.object({
    type: z.literal("agent.error"),
    agentId: z.string(),
    message: z.string().max(1000),
  }),
  z.object({ type: z.literal("report"), synthesis: synthesisSchema }),
  z.object({ type: z.literal("chat.delta"), text: z.string().max(12000) }),
  z.object({ type: z.literal("chat.complete"), text: z.string().max(12000) }),
  z.object({ type: z.literal("error"), message: z.string().max(2000) }),
]);

async function body(req: IncomingMessage): Promise<unknown> {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw new Error("Send the request as JSON.");
  let size = 0,
    text = "";
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_100_000)
      throw new Error("This event or research context is too large.");
    text += chunk;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The request was not valid JSON.");
  }
}
function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
function sessionId(req: IncomingMessage) {
  return (
    req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("cohort_session="))
      ?.slice(15) ?? ""
  );
}
function emit(job: Job, event: ResearchEvent) {
  job.events.push(event);
  if (job.events.length > 500) job.events.shift();
  for (const listener of job.listeners) listener(event);
}
function equalToken(actual: string, expected: string) {
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
function pruneJobs() {
  for (const [id, job] of jobs)
    if (Date.now() - job.created > 2 * 60 * 60 * 1000) {
      if (job.status === "running")
        emit(job, {
          type: "error",
          message:
            "The cloud run expired after two hours. Check the coordinator in Grok Bot.",
        });
      jobs.delete(id);
    }
}

async function receiveCallback(
  req: IncomingMessage,
  res: ServerResponse,
  id: string,
) {
  pruneJobs();
  const job = jobs.get(id);
  if (
    !job ||
    !equalToken(
      req.headers.authorization?.replace(/^Bearer /, "") ?? "",
      job.token,
    )
  ) {
    json(res, 401, { error: "Invalid or expired run callback." });
    return;
  }
  if (job.status !== "running") {
    json(res, 409, { error: "This run has already ended." });
    return;
  }
  const event = callbackSchema.parse(await body(req));
  if ("agentId" in event && !job.personas.some((p) => p.id === event.agentId))
    throw new Error("Post the population before using an agent ID.");
  if (event.type === "population") {
    if (
      event.personas.length !== job.study.participants ||
      new Set(event.personas.map((p) => p.id)).size !== event.personas.length
    )
      throw new Error(
        `Expected exactly ${job.study.participants} personas with unique agent IDs.`,
      );
    job.personas = event.personas.map((p) => ({
      ...p,
      sourceIds: p.sourceIds.filter((id) =>
        job.study.sources.some((source) => source.id === id),
      ),
    }));
    emit(job, { type: "population", personas: job.personas });
    if (job.task === "population") job.status = "complete";
  } else if (event.type === "agent.complete") {
    if (
      job.responses.some((r) => r.agentId === event.agentId) ||
      job.failures.some((r) => r.agentId === event.agentId)
    ) {
      json(res, 200, { accepted: true, duplicate: true });
      return;
    }
    event.reaction.sourceIds = event.reaction.sourceIds.filter((id) =>
      job.study.sources.some((source) => source.id === id),
    );
    job.responses.push({ agentId: event.agentId, reaction: event.reaction });
    emit(job, event);
  } else if (event.type === "agent.error") {
    if (
      !job.responses.some((r) => r.agentId === event.agentId) &&
      !job.failures.some((f) => f.agentId === event.agentId)
    ) {
      job.failures.push({ agentId: event.agentId, message: event.message });
      emit(job, event);
    }
  } else if (event.type === "report") {
    if (!job.responses.length)
      throw new Error(
        "At least one actual agent response is required before a report.",
      );
    if (job.responses.length + job.failures.length !== job.personas.length)
      throw new Error(
        "Every persona must report completion or failure before synthesis.",
      );
    if (!job.events.some((e) => e.type === "market"))
      throw new Error(
        "Report market evidence and any explicit data gaps before synthesis.",
      );
    const ids = new Set(job.responses.map((r) => r.agentId));
    for (const finding of event.synthesis.findings)
      if (finding.agentIds.some((id) => !ids.has(id)))
        throw new Error(
          "A finding cites an agent without a completed response.",
        );
    job.report = {
      id: job.id,
      study: job.study,
      personas: job.personas,
      responses: job.responses,
      failures: job.failures,
      synthesis: event.synthesis,
      model: "Grok Bot · cloud computers",
      completedAt: new Date().toISOString(),
      productContext: job.context,
      marketEvidence: job.market,
    };
    job.status = "complete";
    emit(job, { type: "report", report: job.report });
  } else {
    if (event.type === "context") job.context = event.context;
    if (event.type === "market") job.market = event.evidence;
    if (event.type === "error") job.status = "error";
    if (event.type === "chat.complete") job.status = "complete";
    emit(job, event);
  }
  json(res, 200, { accepted: true, status: job.status });
}

export function createApi(env: Record<string, string>) {
  const envRuntime: Runtime = {
    webhookUrl: env.GROK_BOT_WEBHOOK_URL ?? "",
    webhookKey: env.GROK_BOT_WEBHOOK_KEY ?? "",
    publicUrl: env.COHORT_PUBLIC_URL ?? "",
  };
  let localRuntime = envRuntime;
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const path = req.url?.split("?")[0] ?? "";
    if (!path.startsWith("/api/") && !path.startsWith("/hooks/")) {
      next();
      return;
    }
    try {
      const callback = path.match(/^\/hooks\/jobs\/([a-f0-9-]+)$/);
      if (callback && req.method === "POST") {
        await receiveCallback(req, res, callback[1]);
        return;
      }
      // The tunnel exposes callbacks. Workspace configuration and research documents stay local.
      const host = req.headers.host?.split(":")[0];
      if (
        !["localhost", "127.0.0.1", "[::1]"].includes(host ?? "") ||
        req.headers["cf-connecting-ip"]
      ) {
        json(res, 403, {
          error:
            "Workspace APIs are available only on localhost. Cloud Bots use the authenticated callback endpoint.",
        });
        return;
      }
      if (
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}`
      ) {
        json(res, 403, { error: "Use the local Cohort workspace." });
        return;
      }
      const owner = sessionId(req) || "local";
      const runtime = sessions.get(owner) ?? localRuntime;
      const connection = () => ({
        configured: !!(
          runtime.webhookUrl &&
          runtime.webhookKey &&
          runtime.publicUrl
        ),
        webhookUrl: runtime.webhookUrl,
        webhookConfigured: !!(runtime.webhookUrl && runtime.webhookKey),
        callbackReady: !!runtime.publicUrl,
        publicUrl: runtime.publicUrl,
        runtime: "Grok Bot",
        source: sessions.has(owner)
          ? "session"
          : envRuntime.webhookUrl
            ? "environment"
            : "none",
      });
      if (path === "/api/connection" && req.method === "GET") {
        json(res, 200, connection());
        return;
      }
      if (path === "/api/setup" && req.method === "GET") {
        json(res, 200, { instruction: setupInstruction });
        return;
      }
      if (path === "/api/connection" && req.method === "POST") {
        const input = runtimeSchema.parse(await body(req));
        if (sessions.size > 32)
          throw new Error(
            "Restart the local server to reset connection slots.",
          );
        const id = sessions.has(owner) ? owner : randomUUID();
        sessions.set(id, input);
        localRuntime = input;
        res.setHeader(
          "Set-Cookie",
          `cohort_session=${id}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200`,
        );
        json(res, 200, {
          configured: true,
          webhookConfigured: true,
          callbackReady: true,
          publicUrl: input.publicUrl,
          runtime: "Grok Bot",
          source: "session",
        });
        return;
      }
      if (path === "/api/disconnect" && req.method === "POST") {
        sessions.delete(owner);
        localRuntime = envRuntime;
        res.setHeader(
          "Set-Cookie",
          "cohort_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0",
        );
        json(res, 200, { disconnected: true });
        return;
      }
      if (path === "/api/jobs" && req.method === "GET") {
        pruneJobs();
        json(
          res,
          200,
          Array.from(jobs.values())
            .filter((j) => j.owner === owner)
            .map((j) => ({ id: j.id, status: j.status, report: j.report })),
        );
        return;
      }
      if (
        !["/api/research", "/api/population", "/api/chat"].includes(path) ||
        req.method !== "POST"
      ) {
        json(res, 404, { error: "Unknown workspace request." });
        return;
      }
      if (!connection().configured) {
        json(res, 401, {
          error:
            "Connect a Grok Bot webhook routine and a public callback URL in Connection settings.",
        });
        return;
      }
      pruneJobs();
      if (
        Array.from(jobs.values()).some(
          (j) => j.owner === owner && j.status === "running",
        )
      ) {
        json(res, 409, {
          error:
            "Your coordinator already has an active task. Complete it in Grok Bot before starting another.",
        });
        return;
      }
      if (jobs.size > 100)
        throw new Error(
          "The local run queue is full. Restart after your current runs finish.",
        );
      const input = await body(req);
      const chat =
        path === "/api/chat"
          ? z
              .object({
                persona: personaWithId,
                study: studySchema,
                question: z.string().trim().min(1).max(2000),
                history: z
                  .array(
                    z.object({
                      role: z.enum(["user", "assistant"]),
                      text: z.string().max(6000),
                    }),
                  )
                  .max(12),
                priorReaction: reactionSchema.optional(),
              })
              .parse(input)
          : null;
      const study = chat?.study ?? studySchema.parse(input);
      const task = path.slice(5);
      const job: Job = {
        id: randomUUID(),
        owner,
        token: randomBytes(32).toString("hex"),
        task,
        study,
        events: [],
        listeners: new Set(),
        personas: [],
        responses: [],
        failures: [],
        context: {
          fetched: false,
          title: "",
          excerpt: "Awaiting the cloud Bot’s product review.",
          url: study.url,
        },
        market: {
          segment: study.audience,
          benchmarks: [],
          gaps: ["Market research has not returned yet."],
        },
        status: "running",
        created: Date.now(),
      };
      jobs.set(job.id, job);
      const payload = {
        task,
        study,
        ...(chat
          ? {
              persona: chat.persona,
              question: chat.question,
              history: chat.history,
              priorReaction: chat.priorReaction,
            }
          : {}),
        instructions: coordinatorInstruction,
        callback: {
          url: `${new URL(runtime.publicUrl).origin}/hooks/jobs/${job.id}`,
          token: job.token,
          authentication: "Authorization: Bearer <token>",
        },
        schemas: {
          persona: z.toJSONSchema(personaWithId),
          reaction: z.toJSONSchema(reactionSchema),
          synthesis: z.toJSONSchema(synthesisSchema),
          market: z.toJSONSchema(marketEvidenceSchema),
          callbackEvent: z.toJSONSchema(callbackSchema),
        },
      };
      let trigger: Response;
      try {
        const serialized = JSON.stringify(payload);
        const headers = runtime.webhookKey.startsWith("whsec_")
          ? signedWebhookHeaders(runtime.webhookKey, serialized)
          : {
              Authorization: `Bearer ${runtime.webhookKey}`,
              "Content-Type": "application/json",
            };
        trigger = await fetch(runtime.webhookUrl, {
          method: "POST",
          redirect: "error",
          headers,
          body: serialized,
          signal: AbortSignal.timeout(25_000),
        });
      } catch {
        job.status = "error";
        throw new Error(
          "The Grok Bot routine could not be reached. Verify its webhook URL and that it is active.",
        );
      }
      await trigger.body?.cancel();
      if (![200, 202].includes(trigger.status)) {
        job.status = "error";
        throw new Error(
          `Grok Bot did not accept this run (${trigger.status}). Check the routine and signing secret.`,
        );
      }
      emit(job, {
        type: "job",
        jobId: job.id,
        message:
          "Grok Bot accepted the task. Waiting for the coordinator’s real progress.",
      });
      res.writeHead(200, {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();
      let ended = false;
      const cleanup = () => {
        ended = true;
        clearInterval(heartbeat);
        job.listeners.delete(send);
      };
      const send = (event: ResearchEvent) => {
        if (ended || res.destroyed || res.writableEnded) return;
        res.write(`${JSON.stringify(event)}\n`);
        if (
          ["report", "error", "chat.complete"].includes(event.type) ||
          (task === "population" && event.type === "population")
        ) {
          cleanup();
          res.end();
        }
      };
      const heartbeat = setInterval(() => {
        if (!res.destroyed) res.write("\n");
        if (Date.now() - job.created > 2 * 60 * 60 * 1000) {
          job.status = "error";
          send({
            type: "error",
            message: "The cloud run timed out. Check its status in Grok Bot.",
          });
        }
      }, 10_000);
      res.on("close", cleanup);
      job.listeners.add(send);
      for (const event of job.events) send(event);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      json(res, 400, {
        error:
          error instanceof z.ZodError
            ? error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")
            : error instanceof Error
              ? error.message
              : "The operation could not be completed.",
      });
    }
  };
}
