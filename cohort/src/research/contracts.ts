import { z } from "zod";

export const sourceSchema = z.object({
  id: z.string().max(80),
  name: z.string().min(1).max(160),
  content: z.string().min(1).max(50_000),
  kind: z.enum(["interview", "feedback", "survey", "document"]),
});

export const studySchema = z.object({
  product: z.string().trim().min(1).max(100),
  url: z.union([z.literal(""), z.url()]).default(""),
  description: z.string().trim().min(10).max(6_000),
  question: z.string().trim().min(8).max(2_000),
  objective: z.enum([
    "Concept validation",
    "Usability review",
    "Pricing research",
  ]),
  audience: z.string().trim().min(5).max(2_000),
  participants: z.union([z.literal(6), z.literal(12), z.literal(24)]),
  sources: z.array(sourceSchema).max(8),
  targetMetric: z.string().max(120).default("Product adoption"),
  targetRate: z.number().min(0).max(100).nullable().default(null),
});

export const personaSchema = z.object({
  name: z.string(),
  age: z.number().int().min(18).max(90),
  role: z.string(),
  location: z.string(),
  bio: z.string(),
  motivation: z.string(),
  frustration: z.string(),
  attitude: z.enum(["Early adopter", "Pragmatist", "Skeptic"]),
  sourceIds: z.array(z.string()),
  weight: z.number().positive().max(1).default(1),
});
export const populationSchema = z.object({
  personas: z.array(personaSchema).min(1).max(24),
});
export const reactionSchema = z.object({
  reaction: z.string(),
  sentiment: z.enum(["positive", "mixed", "negative"]),
  score: z.number().min(0).max(100),
  frictionPoints: z.array(z.string()),
  recommendation: z.string(),
  sourceIds: z.array(z.string()),
  taskCompleted: z.boolean().nullable().default(null),
  observations: z
    .array(
      z.object({ action: z.string(), detail: z.string(), url: z.string() }),
    )
    .default([]),
});
export const synthesisSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  findings: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      severity: z.enum(["High", "Medium", "Low"]),
      agentIds: z.array(z.string()),
    }),
  ),
  nextSteps: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type ResearchSource = z.infer<typeof sourceSchema>;
export type Study = z.infer<typeof studySchema>;
export type Persona = z.infer<typeof personaSchema> & { id: string };
export type Reaction = z.infer<typeof reactionSchema>;
export type Synthesis = z.infer<typeof synthesisSchema>;
export type AgentRun = {
  persona: Persona;
  status: "queued" | "running" | "complete" | "error";
  preview: string;
  reaction?: Reaction;
  error?: string;
};
export const marketEvidenceSchema = z.object({
  segment: z.string(),
  benchmarks: z
    .array(
      z.object({
        metric: z.string(),
        rate: z.number().min(0).max(100).nullable(),
        sampleSize: z.number().int().positive().nullable(),
        period: z.string(),
        sourceUrl: z.url(),
        sourceName: z.string(),
        relevance: z.string(),
      }),
    )
    .max(12),
  gaps: z.array(z.string()),
});
export type MarketEvidence = z.infer<typeof marketEvidenceSchema>;
export type ResearchReport = {
  id: string;
  study: Study;
  personas: Persona[];
  responses: { agentId: string; reaction: Reaction }[];
  failures: { agentId: string; message: string }[];
  synthesis: Synthesis;
  model: string;
  completedAt: string;
  productContext: {
    fetched: boolean;
    title: string;
    excerpt: string;
    url: string;
  };
  marketEvidence: MarketEvidence;
};
export type Connection = {
  configured: boolean;
  publicUrl: string;
  webhookUrl?: string;
  webhookConfigured: boolean;
  callbackReady: boolean;
  runtime: "Grok Bot";
  source: "environment" | "session" | "none";
};
export type ResearchEvent =
  | {
      type: "phase";
      phase: "context" | "market" | "population" | "agents" | "synthesis";
      message: string;
    }
  | { type: "job"; jobId: string; message: string }
  | { type: "market"; evidence: MarketEvidence }
  | { type: "context"; context: ResearchReport["productContext"] }
  | { type: "population"; personas: Persona[] }
  | { type: "agent.start"; agentId: string }
  | { type: "agent.delta"; agentId: string; preview: string }
  | {
      type: "agent.activity";
      agentId: string;
      message: string;
      screenshot?: string;
    }
  | { type: "agent.complete"; agentId: string; reaction: Reaction }
  | { type: "agent.error"; agentId: string; message: string }
  | { type: "report"; report: ResearchReport }
  | { type: "chat.delta"; text: string }
  | { type: "chat.complete"; text: string }
  | { type: "error"; message: string };

export const initialStudy: Study = {
  product: "",
  url: "",
  description: "",
  question:
    "Would this product solve a meaningful problem for this audience? What would stop them from using it?",
  objective: "Concept validation",
  audience:
    "Early-stage startup founders and independent product builders, with different budgets and levels of technical experience.",
  participants: 6,
  sources: [],
  targetMetric: "Product adoption",
  targetRate: null,
};

export const examplePersonas: Persona[] = [
  {
    id: "example-1",
    name: "Alex Rivera",
    age: 29,
    role: "Startup founder",
    location: "Austin, US",
    bio: "Building a small software company with a team of three.",
    motivation: "Get to the first useful outcome quickly.",
    frustration: "Setup that takes longer than the task itself.",
    attitude: "Early adopter",
    sourceIds: [],
    weight: 1,
  },
  {
    id: "example-2",
    name: "Maya Chen",
    age: 34,
    role: "Product lead",
    location: "London, UK",
    bio: "Owns product decisions at a growing B2B team.",
    motivation: "Evidence that helps the team choose.",
    frustration: "Insights without a clear next action.",
    attitude: "Pragmatist",
    sourceIds: [],
    weight: 1,
  },
  {
    id: "example-3",
    name: "James Okafor",
    age: 41,
    role: "Business owner",
    location: "Toronto, CA",
    bio: "Runs a service business and keeps a close eye on costs.",
    motivation: "Tools that pay for themselves.",
    frustration: "Unclear pricing and long commitments.",
    attitude: "Skeptic",
    sourceIds: [],
    weight: 1,
  },
  {
    id: "example-4",
    name: "Sofia Martins",
    age: 27,
    role: "Product designer",
    location: "Lisbon, PT",
    bio: "Designs digital products for early-stage companies.",
    motivation: "A focused, intuitive workflow.",
    frustration: "Interfaces that hide the important details.",
    attitude: "Early adopter",
    sourceIds: [],
    weight: 1,
  },
  {
    id: "example-5",
    name: "Riya Patel",
    age: 36,
    role: "Engineering manager",
    location: "Berlin, DE",
    bio: "Balances delivery speed with a reliable tool stack.",
    motivation: "A practical way to reduce uncertainty.",
    frustration: "New tools that add more work to the team.",
    attitude: "Pragmatist",
    sourceIds: [],
    weight: 1,
  },
  {
    id: "example-6",
    name: "Daniel Kim",
    age: 32,
    role: "Independent founder",
    location: "Seoul, KR",
    bio: "Bootstraps products and evaluates every recurring cost.",
    motivation: "Clear value with a low commitment.",
    frustration: "Features that are hard to try before paying.",
    attitude: "Skeptic",
    sourceIds: [],
    weight: 1,
  },
];
