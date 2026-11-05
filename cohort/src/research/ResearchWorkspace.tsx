import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  FlaskConical,
  GitBranch,
  Link2,
  LoaderCircle,
  Menu,
  MessageSquare,
  Monitor,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Logo } from "../Brand";
import {
  api,
  downloadReport,
  getConnection,
  loadWorkspace,
  saveWorkspace,
  streamResearch,
  type WorkspaceData,
} from "./client";
import {
  initialStudy,
  studySchema,
  type AgentRun,
  type Connection,
  type MarketEvidence,
  type Persona,
  type ResearchEvent,
  type ResearchReport,
  type ResearchSource,
  type Study,
} from "./contracts";
import {
  AgentCard,
  Avatar,
  PersonaCard,
  PopulationCloud,
} from "./ResearchVisuals";
import {
  makePopulation,
  makeSyntheticReport,
  sampleReaction,
} from "./synthetic";
import { PopulationExplorer, Metric } from "./PopulationExplorer";
import { PriceLab } from "./PriceLab";
import { Calibration } from "./Calibration";
import "./workspace.css";

type Page =
  | "Overview"
  | "Populations"
  | "Studies"
  | "Surveys"
  | "Focus groups"
  | "Pricing"
  | "A/B tests"
  | "Data sources"
  | "Calibration";
type ChatMessage = { role: "user" | "assistant"; text: string };
const phases = [
  { id: "context", label: "Product context" },
  { id: "market", label: "Market evidence" },
  { id: "population", label: "Build population" },
  { id: "agents", label: "Cloud Bot swarm" },
  { id: "synthesis", label: "Decision brief" },
];
const emptyConnection: Connection = {
  configured: false,
  publicUrl: "",
  webhookConfigured: false,
  callbackReady: false,
  runtime: "Grok Bot",
  source: "none",
};
const number = (n: number) => n.toLocaleString("en-US");
const isSynthetic = (report: ResearchReport) =>
  report.id.startsWith("synthetic-");

function ConnectionDialog({
  connection,
  onClose,
  onSave,
}: {
  connection: Connection;
  onClose: () => void;
  onSave: (connection: Connection) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState(connection.webhookUrl ?? "");
  const [secret, setSecret] = useState("");
  const [publicUrl, setPublicUrl] = useState(connection.publicUrl);
  const [instruction, setInstruction] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    if (import.meta.env.PROD) return;
    void api<{ instruction: string }>("setup")
      .then((r) => setInstruction(r.instruction))
      .catch(() =>
        setError(
          "The local connection service is unavailable. Restart npm run dev:cloud.",
        ),
      );
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api<Connection>("connection", {
        webhookUrl: url.trim(),
        webhookKey: secret
          .trim()
          .replace(/^Authorization:\s*Bearer\s+/i, "")
          .replace(/^Bearer\s+/i, ""),
        publicUrl: publicUrl.trim(),
      });
      setSecret("");
      onSave(result);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The connection could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (import.meta.env.PROD)
    return (
      <dialog
        className="rw-dialog"
        ref={dialog}
        onCancel={onClose}
        aria-labelledby="connect-title"
      >
        <div className="rw-dialog-top">
          <span>
            <Monitor size={16} />
            Hosted demo
          </span>
          <button
            className="rw-icon-button"
            onClick={onClose}
            aria-label="Close connection settings"
          >
            <X size={18} />
          </button>
        </div>
        <div className="rw-dialog-body">
          <span className="rw-eyebrow">SYNTHETIC RESEARCH WORKSPACE</span>
          <h2 id="connect-title">Explore the full workspace.</h2>
          <p>
            This published demo includes mock sign-in, synthetic populations,
            research, conversations, pricing, and calibration. Your work stays
            in this browser.
          </p>
          <p>
            The native Grok Bot webhook bridge runs in the local development
            environment. This site does not run cloud Bots or accept their
            credentials.
          </p>
        </div>
        <div className="rw-dialog-footer">
          <a
            href="https://github.com/Kabanosk/grok-bot-hackathon-26#local-development"
            target="_blank"
            rel="noreferrer"
          >
            Local setup
            <ExternalLink size={12} />
          </a>
          <button className="rw-button primary" onClick={onClose}>
            Continue exploring
            <ArrowRight size={14} />
          </button>
        </div>
      </dialog>
    );
  return (
    <dialog
      className="rw-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="connect-title"
    >
      <div className="rw-dialog-top">
        <span>
          <Monitor size={16} />
          Grok Bot connection
        </span>
        <button
          className="rw-icon-button"
          onClick={onClose}
          aria-label="Close connection settings"
        >
          <X size={18} />
        </button>
      </div>
      <form onSubmit={save}>
        <div className="rw-dialog-body">
          <span className="rw-eyebrow">NATIVE CLOUD COMPUTERS</span>
          <h2 id="connect-title">Connect your research team.</h2>
          <p>
            Run studies with real Grok Bots, each working as an independent
            customer persona.
          </p>
          <div className="connection-step">
            <span>01</span>
            <div>
              <h3>Create a webhook routine</h3>
              <p>
                Give this instruction to your Grok Bot. It sets up a coordinator
                that receives studies and reports real activity back here.
              </p>
              <button
                type="button"
                className="rw-button secondary"
                disabled={!instruction}
                onClick={() =>
                  void navigator.clipboard
                    .writeText(instruction)
                    .then(() => setCopied(true))
                    .catch(() =>
                      setError(
                        "Clipboard unavailable. Copy the setup instruction from the text below.",
                      ),
                    )
                }
              >
                <Copy size={13} />
                {copied ? "Copied instruction" : "Copy setup instruction"}
              </button>
              <details>
                <summary>Read the instruction</summary>
                <p className="setup-instruction">{instruction || "Loading…"}</p>
              </details>
            </div>
          </div>
          <div className="connection-step">
            <span>02</span>
            <div>
              <h3>Connect the routine</h3>
              <p>
                In{" "}
                <a
                  href="https://grok.com/automations"
                  target="_blank"
                  rel="noreferrer"
                >
                  Grok Automations <ExternalLink size={10} />
                </a>
                , open your routine’s Webhook settings and copy its endpoint and
                signing secret.
              </p>
              <label>
                Routine webhook URL
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://grok.com/webhook/automation/…"
                />
              </label>
              <label>
                Automation signing secret
                <input
                  type="password"
                  required
                  autoComplete="off"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="whsec_…"
                />
              </label>
              <small className="rw-fineprint">
                Copy the whsec_ signing secret when it is created or rotated. It
                stays in local server memory.
              </small>
              <label>
                Public callback origin
                <input
                  type="url"
                  required
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  placeholder="https://your-callback.trycloudflare.com"
                />
              </label>
              <small className="rw-fineprint">
                Running npm run dev:cloud fills this automatically. Only
                authenticated run callbacks are exposed.
              </small>
            </div>
          </div>
          {error && (
            <div className="rw-error" role="alert">
              {error}
            </div>
          )}
        </div>
        <div className="rw-dialog-footer">
          <a
            href="https://docs.x.ai/grok/automations/webhooks"
            target="_blank"
            rel="noreferrer"
          >
            Webhook setup guide
            <ExternalLink size={12} />
          </a>
          <button className="rw-button primary" disabled={saving} type="submit">
            {saving ? (
              <LoaderCircle size={14} className="spinning" />
            ) : (
              <Link2 size={14} />
            )}
            Save connection
          </button>
        </div>
      </form>
    </dialog>
  );
}

function ReportView({
  report,
  onPerson,
  onNew,
}: {
  report: ResearchReport;
  onPerson: (person: Persona) => void;
  onNew: () => void;
}) {
  const total = report.responses.length;
  const score = total
    ? Math.round(
        report.responses.reduce(
          (sum, r) =>
            sum +
            r.reaction.score *
              (report.personas.find((p) => p.id === r.agentId)?.weight ?? 1),
          0,
        ) /
          report.responses.reduce(
            (sum, r) =>
              sum +
              (report.personas.find((p) => p.id === r.agentId)?.weight ?? 1),
            0,
          ),
      )
    : 0;
  const positive = report.responses.filter(
    (r) => r.reaction.sentiment === "positive",
  ).length;
  const taskResponses = report.responses.filter(
    (r) => r.reaction.taskCompleted !== null,
  );
  const completedTasks = taskResponses.filter(
    (r) => r.reaction.taskCompleted,
  ).length;
  const synthetic = isSynthetic(report);
  return (
    <div>
      <div className="rw-page-heading">
        <div>
          <span className="rw-eyebrow">
            {synthetic ? "SYNTHETIC STUDY" : "CLOUD BOT RESEARCH"} ·{" "}
            {new Date(report.completedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <h1>
            {report.study.product}
            <span className="rw-heading-label">{report.study.objective}</span>
          </h1>
          <p>{report.study.question}</p>
        </div>
        <div className="rw-inline-actions">
          <button
            className="rw-button secondary"
            onClick={() => downloadReport(report)}
          >
            <Download size={14} />
            Export report
          </button>
          <button className="rw-button primary" onClick={onNew}>
            <Plus size={14} />
            New study
          </button>
        </div>
      </div>
      <div className="rw-metric-grid four">
        <Metric
          label="Modeled appeal"
          value={`${score}/100`}
          note="Subjective agent score, not conversion"
        />
        <Metric
          label="Positive perspectives"
          value={`${total ? Math.round((positive / total) * 100) : 0}%`}
          note={`${positive} of ${total} completed responses`}
        />
        <Metric
          label="Observed AI task completion"
          value={
            taskResponses.length
              ? `${Math.round((completedTasks / taskResponses.length) * 100)}%`
              : "—"
          }
          note={
            taskResponses.length
              ? `${completedTasks} of ${taskResponses.length} observed agent tasks`
              : "No completed task observations reported"
          }
        />
        <Metric
          label="Real market sources"
          value={String(report.marketEvidence.benchmarks.length)}
          note={
            synthetic
              ? "Not used in the synthetic sandbox"
              : "Sources researched by the coordinator"
          }
        />
      </div>
      <section className="rw-panel report-decision">
        <span className="rw-eyebrow">DECISION BRIEF</span>
        <h2>{report.synthesis.headline}</h2>
        <p>{report.synthesis.summary}</p>
        <span className="rw-data-note">
          <ShieldCheck size={13} />
          {synthetic
            ? "Illustrative data. No cloud Bots ran."
            : "AI task outcomes and opinions remain distinct from actual human conversion."}
        </span>
      </section>
      <div className="rw-report-columns">
        <section>
          <div className="rw-section-heading">
            <h2>What matters most</h2>
            <span>{report.synthesis.findings.length} findings</span>
          </div>
          <div className="rw-findings">
            {report.synthesis.findings.map((finding, i) => (
              <article className="rw-panel" key={i}>
                <div className="finding-top">
                  <span className="rw-index">0{i + 1}</span>
                  <span
                    className={`rw-priority ${finding.severity.toLowerCase()}`}
                  >
                    {finding.severity} priority
                  </span>
                </div>
                <h3>{finding.title}</h3>
                <p>{finding.detail}</p>
                <div className="finding-evidence">
                  {finding.agentIds.map((id) => {
                    const persona = report.personas.find((p) => p.id === id);
                    return persona ? (
                      <button key={id} onClick={() => onPerson(persona)}>
                        <Avatar persona={persona} />
                        {persona.name.split(" ")[0]}
                      </button>
                    ) : null;
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="rw-section-heading">
            <h2>Market context</h2>
            <span>Source-backed benchmarks</span>
          </div>
          <div className="rw-panel market-evidence">
            {report.marketEvidence.benchmarks.length ? (
              report.marketEvidence.benchmarks.map((b, i) => (
                <div className="market-benchmark" key={i}>
                  <span>{b.metric}</span>
                  <strong>
                    {b.rate === null ? "Qualitative" : `${b.rate}%`}
                  </strong>
                  <p>{b.relevance}</p>
                  <a href={b.sourceUrl} target="_blank" rel="noreferrer">
                    {b.sourceName}
                    <ArrowUpRight size={12} />
                  </a>
                  <small>
                    {b.period}
                    {b.sampleSize
                      ? ` · n=${number(b.sampleSize)}`
                      : " · sample size not reported"}
                  </small>
                </div>
              ))
            ) : (
              <div className="rw-empty compact">
                <Database size={22} />
                <h3>No measured market benchmark</h3>
                <p>
                  {synthetic
                    ? "Run a cloud Bot study to research comparable real-world rates."
                    : "The coordinator did not find a comparable published rate."}
                </p>
              </div>
            )}
            {report.marketEvidence.gaps.map((gap, i) => (
              <p className="market-gap" key={i}>
                {gap}
              </p>
            ))}
          </div>
          <div className="rw-panel report-next">
            <h3>Recommended next steps</h3>
            {report.synthesis.nextSteps.map((step, i) => (
              <div key={i}>
                <span>{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="rw-section-heading">
        <h2>Every perspective, preserved.</h2>
        <span>
          {total} responses · {report.failures.length} interrupted
        </span>
      </div>
      <div className="rw-persona-grid">
        {report.personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            reaction={
              report.responses.find((r) => r.agentId === persona.id)?.reaction
            }
            onSelect={() => onPerson(persona)}
          />
        ))}
      </div>
      <details className="rw-limitations">
        <summary>Research limits and assumptions</summary>
        {report.synthesis.limitations.map((limit, i) => (
          <p key={i}>{limit}</p>
        ))}
        <p>
          {report.productContext.fetched
            ? "The cloud Bot reported reading the product page."
            : "No completed product-page review was reported."}
        </p>
      </details>
    </div>
  );
}

export function ResearchWorkspace({ onExit }: { onExit: () => void }) {
  const [signedIn, setSignedIn] = useState(
    () => sessionStorage.getItem("cohort-demo-session") === "true",
  );
  const [loginEmail, setLoginEmail] = useState("pedro@cohort.local");
  const people = useMemo(() => makePopulation(), []);
  const [data, setData] = useState<WorkspaceData>(() => {
    const saved = loadWorkspace();
    if (!saved.studies.length)
      saved.studies = [
        makeSyntheticReport(
          {
            ...initialStudy,
            product: "Atlas",
            description:
              "A shared workspace that helps small product teams make decisions.",
            question: "Is this concept clear and useful to product teams?",
          },
          people,
        ),
        makeSyntheticReport(
          {
            ...initialStudy,
            product: "Orbit",
            description:
              "A project planning app for independent founders and small teams.",
            objective: "Pricing research",
            question: "What would make this product worth paying for?",
          },
          people,
        ),
      ];
    return saved;
  });
  const [page, setPage] = useState<Page>("Overview");
  const [mode, setMode] = useState<"synthetic" | "cloud">("synthetic");
  const [connection, setConnection] = useState<Connection>(emptyConnection);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [study, setStudy] = useState<Study>({
    ...initialStudy,
    product: "",
    description: "",
  });
  const [composing, setComposing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(
    null,
  );
  const [busy, setBusy] = useState<"research" | "population" | "chat" | null>(
    null,
  );
  const [phase, setPhase] = useState("context");
  const [phaseMessage, setPhaseMessage] = useState("");
  const [agents, setAgents] = useState<AgentRun[]>([]);
  const [market, setMarket] = useState<MarketEvidence | null>(null);
  const [events, setEvents] = useState<{ time: string; message: string }[]>([]);
  const [error, setError] = useState("");
  const [savingError, setSavingError] = useState(false);
  const [search, setSearch] = useState("");
  const [person, setPerson] = useState<Persona | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [conversations, setConversations] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [liveChat, setLiveChat] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceKind, setSourceKind] =
    useState<ResearchSource["kind"]>("interview");
  const [surveyQuestions, setSurveyQuestions] = useState([
    "What problem would this product solve for you?",
    "How likely would you be to try it?",
    "What would stop you from signing up?",
  ]);
  const [variantA, setVariantA] = useState(
    "A simpler way to plan your next project.",
  );
  const [variantB, setVariantB] = useState("Less planning. More progress.");
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const latestPersonas = data.population?.personas ?? people.slice(0, 6);
  const activePerson =
    person ?? selectedReport?.personas[0] ?? latestPersonas[0];
  const chatKey = `${selectedReport?.id ?? "general"}:${activePerson.id}`;
  const messages = conversations[chatKey] ?? [];
  const studies = data.studies.filter((r) =>
    `${r.study.product} ${r.study.objective}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const liveStudies = data.studies.filter((r) => !isSynthetic(r));
  useEffect(() => {
    void getConnection()
      .then(setConnection)
      .catch(() => {});
    return () => request.current?.abort();
  }, []);
  useEffect(() => {
    setSavingError(!saveWorkspace(data));
  }, [data]);
  function navigate(next: Page) {
    setPage(next);
    setMobileMenu(false);
    setError("");
    if (next !== "Studies") setComposing(false);
  }
  function newStudy(
    objective: Study["objective"] = "Concept validation",
    next: Page = "Studies",
  ) {
    setStudy((s) => ({ ...s, objective }));
    setSelectedReport(null);
    setComposing(true);
    setPage(next);
    setMobileMenu(false);
    setError("");
  }
  function inspect(result: ResearchReport) {
    setSelectedReport(result);
    setComposing(false);
    setPage("Studies");
  }
  function selectPerson(p: Persona) {
    setPerson(p);
    setPage("Focus groups");
  }
  function log(message: string) {
    setEvents((previous) =>
      [
        ...previous,
        {
          time: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          message,
        },
      ].slice(-80),
    );
  }
  function receive(event: ResearchEvent) {
    if (event.type === "job") log(event.message);
    if (event.type === "phase") {
      setPhase(event.phase);
      setPhaseMessage(event.message);
      log(event.message);
    }
    if (event.type === "context")
      log(
        event.context.fetched
          ? `Product page read: ${event.context.title || event.context.url}`
          : "Product review is using the supplied brief.",
      );
    if (event.type === "market") {
      setMarket(event.evidence);
      log(`${event.evidence.benchmarks.length} market benchmarks received.`);
    }
    if (event.type === "population") {
      setAgents(
        event.personas.map((persona) => ({
          persona,
          status: "queued",
          preview: "",
        })),
      );
      setData((d) => ({
        ...d,
        population: {
          personas: event.personas,
          audience: study.audience,
          sourceIds: d.sources.map((s) => s.id),
        },
      }));
      log(`${event.personas.length} personas assembled.`);
    }
    if (event.type === "agent.start") {
      setAgents((rows) =>
        rows.map((a) =>
          a.persona.id === event.agentId ? { ...a, status: "running" } : a,
        ),
      );
      log(`${event.agentId} started on a cloud computer.`);
    }
    if (event.type === "agent.delta")
      setAgents((rows) =>
        rows.map((a) =>
          a.persona.id === event.agentId ? { ...a, preview: event.preview } : a,
        ),
      );
    if (event.type === "agent.activity") {
      setAgents((rows) =>
        rows.map((a) =>
          a.persona.id === event.agentId ? { ...a, preview: event.message } : a,
        ),
      );
      log(`${event.agentId}: ${event.message}`);
    }
    if (event.type === "agent.complete") {
      setAgents((rows) =>
        rows.map((a) =>
          a.persona.id === event.agentId
            ? {
                ...a,
                status: "complete",
                reaction: event.reaction,
                preview: event.reaction.reaction,
              }
            : a,
        ),
      );
      log(`${event.agentId} completed an independent response.`);
    }
    if (event.type === "agent.error") {
      setAgents((rows) =>
        rows.map((a) =>
          a.persona.id === event.agentId
            ? { ...a, status: "error", error: event.message }
            : a,
        ),
      );
      log(`${event.agentId}: ${event.message}`);
    }
    if (event.type === "report") {
      setData((d) => ({
        ...d,
        studies: [
          event.report,
          ...d.studies.filter((r) => r.id !== event.report.id),
        ].slice(0, 10),
      }));
      setSelectedReport(event.report);
      setComposing(false);
      setPage("Studies");
      log("Decision brief received.");
    }
  }
  async function run(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    const augmented = {
      ...study,
      sources: data.sources,
      question:
        page === "Surveys"
          ? `${study.question}\nSurvey questions:\n${surveyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
          : page === "A/B tests"
            ? `${study.question}\nCompare variant A: ${variantA}\nVariant B: ${variantB}. Give a clear preference and explain it.`
            : study.question,
    };
    const parsed = studySchema.safeParse(augmented);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" · "),
      );
      return;
    }
    if (mode === "synthetic") {
      const report = makeSyntheticReport(parsed.data, people);
      setData((d) => ({ ...d, studies: [report, ...d.studies].slice(0, 10) }));
      inspect(report);
      return;
    }
    if (!connection.configured) {
      setConnectionOpen(true);
      return;
    }
    setBusy("research");
    setSelectedReport(null);
    setAgents([]);
    setEvents([]);
    setMarket(null);
    setPhase("context");
    setPhaseMessage("Sending your study to the Grok Bot coordinator…");
    setPage("Studies");
    setComposing(false);
    request.current = new AbortController();
    try {
      await streamResearch(
        "research",
        parsed.data,
        receive,
        request.current.signal,
      );
    } catch (e) {
      if (!request.current.signal.aborted)
        setError(
          e instanceof Error
            ? e.message
            : "The cloud study could not be completed.",
        );
    } finally {
      setBusy(null);
    }
  }
  async function buildPopulation() {
    if (mode === "synthetic") {
      setData((d) => ({
        ...d,
        population: {
          personas: people.slice(0, study.participants),
          audience: study.audience,
          sourceIds: [],
        },
      }));
      navigate("Populations");
      return;
    }
    if (!connection.configured) {
      setConnectionOpen(true);
      return;
    }
    setBusy("population");
    setError("");
    request.current = new AbortController();
    try {
      await streamResearch(
        "population",
        {
          ...study,
          product: study.product || "Audience discovery",
          description:
            study.description ||
            "Understand the needs and motivations of this target market.",
          sources: data.sources,
        },
        receive,
        request.current.signal,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The audience could not be built.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function sendChat(e: FormEvent) {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question || busy) return;
    if (mode === "cloud" && !connection.configured) {
      setConnectionOpen(true);
      return;
    }
    const context = selectedReport?.study ?? {
      ...study,
      product: study.product || "the proposed product",
      description:
        study.description ||
        "A product concept under exploration; details have not been provided.",
      sources: data.sources,
    };
    setConversations((c) => ({
      ...c,
      [chatKey]: [...messages, { role: "user", text: question }],
    }));
    setChatInput("");
    setError("");
    if (mode === "synthetic") {
      const reaction = sampleReaction(activePerson, context, question);
      setConversations((c) => ({
        ...c,
        [chatKey]: [
          ...(c[chatKey] ?? []),
          { role: "assistant", text: reaction.reaction },
        ],
      }));
      return;
    }
    setBusy("chat");
    setLiveChat("");
    request.current = new AbortController();
    try {
      await streamResearch(
        "chat",
        {
          persona: activePerson,
          study: context,
          question,
          history: messages.slice(-12),
          priorReaction: selectedReport?.responses.find(
            (r) => r.agentId === activePerson.id,
          )?.reaction,
        },
        (event) => {
          if (event.type === "chat.delta") setLiveChat(event.text);
          if (event.type === "chat.complete") {
            setConversations((c) => ({
              ...c,
              [chatKey]: [
                ...(c[chatKey] ?? []),
                { role: "assistant", text: event.text },
              ],
            }));
            setLiveChat("");
          }
        },
        request.current.signal,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The conversation was interrupted.",
      );
    } finally {
      setBusy(null);
    }
  }
  function addSource(name: string, content: string) {
    if (data.sources.length >= 8) {
      setError("Use up to eight source documents per study.");
      return;
    }
    if (!content.trim()) {
      setError("Add some research text first.");
      return;
    }
    if (content.length > 50_000) {
      setError("Use a source document with fewer than 50,000 characters.");
      return;
    }
    setData((d) => ({
      ...d,
      sources: [
        ...d.sources,
        {
          id: `source-${crypto.randomUUID()}`,
          name: name.trim() || "Customer research",
          content: content.trim(),
          kind: sourceKind,
        },
      ],
    }));
    setSourceName("");
    setSourceText("");
    setError("");
  }
  const nav = [
    { page: "Overview", icon: LayoutIcon },
    { page: "Populations", icon: Users },
    { page: "Studies", icon: FlaskConical },
    { page: "Surveys", icon: FileText },
    { page: "Focus groups", icon: MessageSquare },
    { page: "Pricing", icon: BarChart3 },
    { page: "A/B tests", icon: GitBranch },
    { page: "Data sources", icon: Database },
    { page: "Calibration", icon: ShieldCheck },
  ] as const;
  function renderBuilder() {
    return (
      <>
        <div className="rw-page-heading">
          <div>
            <span className="rw-eyebrow">
              {page === "Surveys"
                ? "SURVEY BUILDER"
                : page === "A/B tests"
                  ? "COMPARE TWO DIRECTIONS"
                  : "A QUESTION WORTH ASKING"}
            </span>
            <h1>
              {page === "Surveys"
                ? "Ask a better question."
                : page === "A/B tests"
                  ? "Find the stronger direction."
                  : "Start with what you want to know."}
            </h1>
            <p>
              Define your product, choose an audience, and put the important
              assumptions in view.
            </p>
          </div>
        </div>
        <form onSubmit={run} className="rw-builder-layout">
          <section className="rw-panel study-composer">
            <div className="rw-panel-title">
              <Target size={16} />
              <h2>The research brief</h2>
              <span className="rw-tag">
                {mode === "cloud" ? "CLOUD BOTS" : "SYNTHETIC SANDBOX"}
              </span>
            </div>
            <div className="rw-form-row">
              <label>
                Product name
                <input
                  value={study.product}
                  onChange={(e) =>
                    setStudy({ ...study, product: e.target.value })
                  }
                  placeholder="e.g. Your next product"
                  maxLength={100}
                />
              </label>
              <label>
                Product URL<span>Optional</span>
                <input
                  value={study.url}
                  onChange={(e) => setStudy({ ...study, url: e.target.value })}
                  placeholder="https://your-product.com"
                />
              </label>
            </div>
            <label>
              What are you building?
              <textarea
                rows={3}
                value={study.description}
                onChange={(e) =>
                  setStudy({ ...study, description: e.target.value })
                }
                placeholder="Describe the problem, your solution, and who it helps…"
                maxLength={6000}
              />
            </label>
            <label>
              Research question
              <textarea
                rows={3}
                value={study.question}
                onChange={(e) =>
                  setStudy({ ...study, question: e.target.value })
                }
                maxLength={2000}
              />
            </label>
            <div className="rw-objectives">
              {(
                [
                  "Concept validation",
                  "Usability review",
                  "Pricing research",
                ] as const
              ).map((objective) => (
                <button
                  type="button"
                  aria-pressed={study.objective === objective}
                  key={objective}
                  onClick={() => setStudy({ ...study, objective })}
                >
                  {objective}
                </button>
              ))}
            </div>
            {page === "Surveys" && (
              <div className="survey-questions">
                <div className="rw-section-heading">
                  <h3>Survey questions</h3>
                  <span>{surveyQuestions.length} questions</span>
                </div>
                {surveyQuestions.map((q, i) => (
                  <div key={i}>
                    <span>{i + 1}</span>
                    <input
                      aria-label={`Survey question ${i + 1}`}
                      value={q}
                      onChange={(e) =>
                        setSurveyQuestions((qs) =>
                          qs.map((value, index) =>
                            index === i ? e.target.value : value,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="rw-icon-button"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() =>
                        setSurveyQuestions((qs) =>
                          qs.filter((_, index) => index !== i),
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rw-button secondary"
                  disabled={surveyQuestions.length >= 10}
                  onClick={() => setSurveyQuestions((qs) => [...qs, ""])}
                >
                  <Plus size={13} />
                  Add question
                </button>
              </div>
            )}
            {page === "A/B tests" && (
              <div className="rw-variant-grid">
                <label>
                  <span className="variant-letter">A</span>Variant A
                  <textarea
                    rows={3}
                    value={variantA}
                    onChange={(e) => setVariantA(e.target.value)}
                  />
                </label>
                <label>
                  <span className="variant-letter">B</span>Variant B
                  <textarea
                    rows={3}
                    value={variantB}
                    onChange={(e) => setVariantB(e.target.value)}
                  />
                </label>
              </div>
            )}
            <div className="rw-form-row">
              <label>
                Success metric
                <select
                  value={study.targetMetric}
                  onChange={(e) =>
                    setStudy({ ...study, targetMetric: e.target.value })
                  }
                >
                  {[
                    "Product adoption",
                    "Checkout completion",
                    "Trial-to-paid conversion",
                    "Activation",
                    "Concept interest",
                  ].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                Target rate (%)<span>Optional</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Compare with a market benchmark"
                  value={study.targetRate ?? ""}
                  onChange={(e) =>
                    setStudy({
                      ...study,
                      targetRate:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <div className="study-submit">
              <span>
                <Database size={13} />
                {data.sources.length} research sources attached
              </span>
              <button
                className="rw-button primary"
                type="submit"
                disabled={!!busy}
              >
                {mode === "cloud" ? (
                  <Monitor size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                Run {mode === "cloud" ? "cloud research" : "synthetic study"}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
          <aside>
            <section className="rw-panel audience-builder">
              <div className="rw-panel-title">
                <Users size={16} />
                <h2>Your audience</h2>
              </div>
              <label>
                Who should weigh in?
                <textarea
                  rows={5}
                  value={study.audience}
                  onChange={(e) =>
                    setStudy({ ...study, audience: e.target.value })
                  }
                  maxLength={2000}
                />
              </label>
              <label>
                Independent perspectives
                <div className="rw-participants">
                  {[6, 12, 24].map((n) => (
                    <button
                      type="button"
                      aria-pressed={study.participants === n}
                      key={n}
                      onClick={() =>
                        setStudy({ ...study, participants: n as 6 | 12 | 24 })
                      }
                    >
                      <strong>{n}</strong>
                      <span>personas</span>
                    </button>
                  ))}
                </div>
              </label>
              <div className="audience-builder-people">
                {latestPersonas.slice(0, 3).map((p) => (
                  <div key={p.id}>
                    <Avatar persona={p} />
                    <span>
                      {p.name}
                      <small>{p.role}</small>
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="rw-text-button"
                onClick={() => void buildPopulation()}
                disabled={!!busy}
              >
                Build this population
                <ArrowRight size={13} />
              </button>
            </section>
            <section className="rw-panel brief-evidence">
              <Search size={18} />
              <h3>Start with market reality.</h3>
              <p>
                Cloud research looks for product-specific benchmarks, then gives
                each persona a distinct perspective. Missing evidence stays
                visible.
              </p>
              <button
                type="button"
                className="rw-text-button"
                onClick={() => navigate("Data sources")}
              >
                Add your customer research
                <ArrowRight size={13} />
              </button>
            </section>
          </aside>
        </form>
      </>
    );
  }
  function renderStudies() {
    if (busy === "research" || (agents.length && !selectedReport && !composing))
      return (
        <div>
          <div className="rw-page-heading">
            <div>
              <span className="rw-eyebrow">NATIVE GROK BOT RUNTIME</span>
              <h1>Your research team, at work.</h1>
              <p>{phaseMessage}</p>
            </div>
            <a
              className="rw-button secondary"
              href="https://grok.com/automations"
              target="_blank"
              rel="noreferrer"
            >
              <Monitor size={14} />
              Open Grok Bot
              <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="research-pipeline">
            {phases.map((p, i) => {
              const current = phases.findIndex((s) => s.id === phase);
              return (
                <div
                  key={p.id}
                  className={
                    i < current ? "complete" : i === current ? "active" : ""
                  }
                >
                  <span>
                    {i < current ? (
                      <Check size={13} />
                    ) : i === current && busy ? (
                      <LoaderCircle className="spinning" size={13} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {p.label}
                </div>
              );
            })}
          </div>
          <div className="rw-live-layout">
            <section className="rw-panel">
              <div className="rw-panel-title">
                <Users size={16} />
                <h2>Independent perspectives</h2>
                <span className="rw-tag">
                  {agents.filter((a) => a.status === "complete").length} /{" "}
                  {study.participants} COMPLETE
                </span>
              </div>
              {agents.length ? (
                <PopulationCloud
                  personas={agents.map((a) => a.persona)}
                  agents={agents}
                  onSelect={(id) => {
                    const p = agents.find((a) => a.persona.id === id)?.persona;
                    if (p) setPerson(p);
                  }}
                />
              ) : (
                <div className="cloud-waiting">
                  <LoaderCircle size={28} className="spinning" />
                  <h3>Waiting for the cloud coordinator</h3>
                  <p>
                    Progress appears only when Grok Bot reports it. Market
                    research and persona creation can take several minutes.
                  </p>
                </div>
              )}
            </section>
            <aside className="rw-panel activity-feed">
              <div className="rw-panel-title">
                <Activity size={15} />
                <h2>Live activity</h2>
                <span className="rw-live-dot" />
              </div>
              {events.length ? (
                events.slice(-12).map((event, i) => (
                  <div className="activity-event" key={i}>
                    <time>{event.time}</time>
                    <p>{event.message}</p>
                  </div>
                ))
              ) : (
                <p className="rw-muted">
                  The coordinator has not reported an action yet.
                </p>
              )}
              {market && (
                <div className="activity-market">
                  <strong>{market.benchmarks.length}</strong>
                  <span>market sources returned</span>
                </div>
              )}
            </aside>
          </div>
          <div className="rw-agent-grid">
            {agents.map((a) => (
              <AgentCard
                key={a.persona.id}
                agent={a}
                onSelect={() => selectPerson(a.persona)}
              />
            ))}
          </div>
        </div>
      );
    if (selectedReport && !composing)
      return (
        <ReportView
          report={selectedReport}
          onPerson={selectPerson}
          onNew={() => newStudy()}
        />
      );
    if (composing) return renderBuilder();
    return (
      <>
        <div className="rw-page-heading">
          <div>
            <span className="rw-eyebrow">EVERY QUESTION, IN ONE PLACE</span>
            <h1>Research studies</h1>
            <p>Your concepts, decisions, and the evidence behind them.</p>
          </div>
          <button className="rw-button primary" onClick={() => newStudy()}>
            <Plus size={14} />
            New study
          </button>
        </div>
        <StudyTable studies={studies} onInspect={inspect} />
      </>
    );
  }
  if (!signedIn)
    return (
      <div className="mock-login">
        <form
          className="mock-login-card"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem("cohort-demo-session", "true");
            setSignedIn(true);
          }}
        >
          <Logo small />
          <h1>Welcome to your workspace.</h1>
          <p>
            Your audience, research, and the evidence behind your next decision.
          </p>
          <label htmlFor="demo-email">Work email</label>
          <input
            id="demo-email"
            type="email"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autoComplete="email"
          />
          <button className="rw-button primary" type="submit">
            Enter demo workspace
            <ArrowRight size={15} />
          </button>
          <p className="rw-fineprint">
            Mock sign-in · no password or account required.
            <br />
            Your workspace is saved in this browser.
          </p>
          <button className="mock-login-back" type="button" onClick={onExit}>
            Back to website
          </button>
        </form>
      </div>
    );
  return (
    <div className="research-app">
      <aside className={`rw-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="rw-brand">
          <Logo small />
          <span className="rw-tag">LAB</span>
        </div>
        <button className="rw-workspace-switch">
          <span className="workspace-letter">P</span>
          <span>
            Personal workspace<small>Product research</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <button
          className="rw-new-research"
          onClick={() => newStudy()}
          disabled={!!busy}
        >
          <Plus size={16} />
          New research<span>↗</span>
        </button>
        <div className="rw-sidebar-search">
          <Search size={14} />
          <input
            aria-label="Find research"
            placeholder="Find research…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage("Studies");
              setComposing(false);
              setSelectedReport(null);
            }}
          />
          <kbd>⌘ K</kbd>
        </div>
        <div className="rw-nav-label">WORKSPACE</div>
        <nav aria-label="Research navigation">
          {nav.map((item) => (
            <button
              key={item.page}
              className={page === item.page ? "selected" : ""}
              aria-current={page === item.page ? "page" : undefined}
              onClick={() => navigate(item.page)}
            >
              <item.icon size={16} />
              {item.page}
              {item.page === "Populations" && <span>12k</span>}
              {item.page === "Studies" && <span>{data.studies.length}</span>}
            </button>
          ))}
        </nav>
        <div className="rw-nav-label recent-label">RECENT RESEARCH</div>
        <div className="rw-sidebar-recent">
          {data.studies.slice(0, 3).map((r) => (
            <button key={r.id} onClick={() => inspect(r)}>
              <span
                className={isSynthetic(r) ? "study-dot sample" : "study-dot"}
              />
              {r.study.product}
              <ArrowUpRight size={11} />
            </button>
          ))}
        </div>
        <div className="rw-sidebar-bottom">
          <button
            className={`rw-runtime ${connection.configured ? "connected" : ""}`}
            onClick={() => setConnectionOpen(true)}
          >
            <Monitor size={16} />
            <span>
              Grok Bot runtime
              <small>
                {connection.configured
                  ? "Routine configured"
                  : "Connect cloud computers"}
              </small>
            </span>
            <span className="rw-dot" />
          </button>
          <button className="rw-exit" onClick={onExit}>
            <ArrowLeft size={13} />
            Back to website
          </button>
          <div className="rw-account">
            <span>PW</span>
            <div>
              Your workspace<small>Local research environment</small>
            </div>
            <button
              className="rw-icon-button"
              aria-label="Connection settings"
              onClick={() => setConnectionOpen(true)}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="rw-sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="rw-main">
        <header className="rw-topbar">
          <button
            className="rw-icon-button rw-mobile-toggle"
            aria-label="Open workspace navigation"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu size={18} />
          </button>
          <span className="rw-breadcrumb">
            Workspace<span>/</span>
            <strong>{page}</strong>
          </span>
          <div>
            <select
              aria-label="Research engine"
              className="rw-mode-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              disabled={!!busy}
            >
              <option value="synthetic">Synthetic sandbox</option>
              <option value="cloud" disabled={import.meta.env.PROD}>
                Cloud Grok Bots{import.meta.env.PROD ? " · local only" : ""}
              </option>
            </select>
            <span
              className={`rw-connection-status ${connection.configured ? "ready" : ""}`}
            >
              <span className="rw-dot" />
              {connection.configured
                ? "Routine configured"
                : "Cloud not connected"}
            </span>
            <button
              className="rw-icon-button"
              aria-label="Open connection settings"
              onClick={() => setConnectionOpen(true)}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </header>
        <main className="rw-content">
          {error && (
            <div className="rw-error" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={14} />
              </button>
            </div>
          )}
          {savingError && (
            <div className="rw-banner subtle">
              Browser storage is full. Export important reports before
              refreshing.
            </div>
          )}
          {page === "Overview" && (
            <>
              <div className="rw-page-heading">
                <div>
                  <span className="rw-eyebrow">THE RESEARCH WORKSPACE</span>
                  <h1>Your next move, informed.</h1>
                  <p>
                    Explore your audience. Test a direction. Follow the
                    evidence.
                  </p>
                </div>
                <button
                  className="rw-button primary"
                  onClick={() => newStudy()}
                >
                  <Plus size={14} />
                  New research
                </button>
              </div>
              <div className="rw-metric-grid four">
                <Metric
                  label="Population profiles"
                  value="12,000"
                  note="Synthetic research audience"
                />
                <Metric
                  label="Research studies"
                  value={String(data.studies.length)}
                  note={`${liveStudies.length} cloud · ${data.studies.length - liveStudies.length} synthetic`}
                />
                <Metric
                  label="Customer research sources"
                  value={String(data.sources.length)}
                  note="Imported interviews and feedback"
                />
                <Metric
                  label="Real market benchmarks"
                  value={String(
                    liveStudies.reduce(
                      (n, r) => n + r.marketEvidence.benchmarks.length,
                      0,
                    ),
                  )}
                  note="Sources returned by cloud Bots"
                />
              </div>
              <div className="rw-overview-main">
                <section className="rw-panel overview-population">
                  <div className="rw-panel-title">
                    <Users size={16} />
                    <h2>A world of perspectives.</h2>
                    <span className="rw-tag">SYNTHETIC AUDIENCE</span>
                  </div>
                  <svg
                    className="overview-dots"
                    viewBox="0 0 650 260"
                    aria-label="360 of 12,000 synthetic customer profiles"
                  >
                    {people.slice(0, 360).map((p, i) => {
                      const r = Math.sqrt(i / 360) * 111;
                      const a = i * 2.399;
                      return (
                        <circle
                          key={p.id}
                          cx={325 + Math.cos(a) * r * 2.2}
                          cy={125 + Math.sin(a) * r}
                          r={i % 11 === 0 ? 3.5 : 2.2}
                          fill={
                            p.attitude === "Skeptic"
                              ? "#b5c8bc"
                              : p.attitude === "Pragmatist"
                                ? "#72a78c"
                                : "#216d4b"
                          }
                          opacity={0.45 + (i % 5) * 0.1}
                        />
                      );
                    })}
                  </svg>
                  <div className="overview-population-footer">
                    <span>
                      <strong>12,000</strong> profiles across 12 cities
                    </span>
                    <button
                      className="rw-text-button"
                      onClick={() => navigate("Populations")}
                    >
                      Explore population
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </section>
                <section className="rw-panel overview-start">
                  <span className="rw-eyebrow">A SHORTER PATH TO CLARITY</span>
                  <h2>What would you like to learn?</h2>
                  {[
                    {
                      title: "Will this concept resonate?",
                      sub: "Concept validation",
                      icon: Target,
                      objective: "Concept validation",
                    },
                    {
                      title: "What are people willing to pay?",
                      sub: "Pricing research",
                      icon: BarChart3,
                      objective: "Pricing research",
                    },
                    {
                      title: "Where will customers hesitate?",
                      sub: "Usability review",
                      icon: Monitor,
                      objective: "Usability review",
                    },
                  ].map((item) => (
                    <button
                      key={item.title}
                      onClick={() =>
                        newStudy(item.objective as Study["objective"])
                      }
                    >
                      <item.icon size={17} />
                      <span>
                        {item.title}
                        <small>{item.sub}</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                </section>
              </div>
              <div className="rw-section-heading">
                <h2>Recent research</h2>
                <button
                  className="rw-text-button"
                  onClick={() => navigate("Studies")}
                >
                  View all studies
                  <ArrowRight size={13} />
                </button>
              </div>
              <StudyTable studies={studies.slice(0, 5)} onInspect={inspect} />
              <div className="rw-overview-bottom">
                <div className="rw-panel">
                  <ShieldCheck size={20} />
                  <h3>Confidence needs a ground truth.</h3>
                  <p>
                    Backtest previous scores against real outcomes. See false
                    positives, false negatives, and how often you abstain.
                  </p>
                  <button
                    className="rw-text-button"
                    onClick={() => navigate("Calibration")}
                  >
                    Open calibration
                    <ArrowRight size={13} />
                  </button>
                </div>
                <div className="rw-panel">
                  <Database size={20} />
                  <h3>Bring the customer context.</h3>
                  <p>
                    Connect the motivations and friction in your research to
                    every future population and cloud Bot study.
                  </p>
                  <button
                    className="rw-text-button"
                    onClick={() => navigate("Data sources")}
                  >
                    Add research sources
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
          {page === "Populations" && (
            <PopulationExplorer
              people={people}
              onSelect={selectPerson}
              onBuild={() => {
                newStudy();
                void buildPopulation();
              }}
            />
          )}
          {page === "Studies" && renderStudies()}
          {(page === "Surveys" || page === "A/B tests") && renderBuilder()}
          {page === "Pricing" && (
            <PriceLab
              people={people}
              onResearch={() => newStudy("Pricing research")}
            />
          )}
          <div hidden={page !== "Calibration"}>
            <Calibration />
          </div>
          {page === "Focus groups" && (
            <div>
              <div className="rw-page-heading">
                <div>
                  <span className="rw-eyebrow">
                    THE REASONING BEHIND THE RESPONSE
                  </span>
                  <h1>Talk to your audience.</h1>
                  <p>
                    Ask follow-up questions and explore a perspective in depth.
                  </p>
                </div>
                <span className="rw-tag">
                  {mode === "synthetic"
                    ? "SYNTHETIC CONVERSATION"
                    : "NATIVE CLOUD BOT"}
                </span>
              </div>
              <div className="rw-chat-layout">
                <aside className="rw-panel chat-people">
                  <div className="rw-panel-title">
                    <Users size={15} />
                    <h2>Your focus group</h2>
                  </div>
                  {(selectedReport?.personas ?? latestPersonas).map((p) => (
                    <button
                      key={p.id}
                      className={activePerson.id === p.id ? "selected" : ""}
                      onClick={() => setPerson(p)}
                    >
                      <Avatar persona={p} />
                      <span>
                        {p.name}
                        <small>{p.role}</small>
                      </span>
                    </button>
                  ))}
                </aside>
                <section className="rw-panel chat-panel">
                  <div className="chat-person-heading">
                    <Avatar persona={activePerson} />
                    <span>
                      <strong>{activePerson.name}</strong>
                      <small>
                        {activePerson.role} · {activePerson.age} ·{" "}
                        {activePerson.location}
                      </small>
                    </span>
                    <span className="rw-tag">AI PERSONA</span>
                  </div>
                  <div className="chat-messages">
                    {!messages.length && (
                      <div className="chat-intro">
                        <MessageSquare size={25} />
                        <h2>A different point of view.</h2>
                        <p>{activePerson.motivation}</p>
                        <div>
                          {[
                            "What would make you try this?",
                            "What feels unclear?",
                            "What would you pay for this?",
                          ].map((q) => (
                            <button key={q} onClick={() => setChatInput(q)}>
                              {q}
                              <ArrowUpRight size={12} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((message, i) => (
                      <div key={i} className={`chat-message ${message.role}`}>
                        {message.role === "assistant" && (
                          <Avatar persona={activePerson} />
                        )}
                        <p>{message.text}</p>
                      </div>
                    ))}
                    {busy === "chat" && (
                      <div className="chat-message assistant">
                        <Avatar persona={activePerson} />
                        <p>
                          {liveChat || "Waiting for the cloud Bot to respond…"}
                          <span className="typing-caret" />
                        </p>
                      </div>
                    )}
                  </div>
                  <form className="chat-composer" onSubmit={sendChat}>
                    <input
                      aria-label="Ask the persona a question"
                      placeholder={`Ask ${activePerson.name.split(" ")[0]} a question…`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      maxLength={2000}
                    />
                    <button
                      className="rw-button primary"
                      type="submit"
                      disabled={!!busy || !chatInput.trim()}
                      aria-label="Send question"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                  <p className="chat-disclosure">
                    {mode === "synthetic"
                      ? "Illustrative responses from a deterministic sample dataset."
                      : "Responses come from your native Grok Bot routine."}{" "}
                    AI perspectives are not actual human interviews.
                  </p>
                </section>
                <aside className="rw-panel persona-detail">
                  <Avatar persona={activePerson} size="large" />
                  <h2>{activePerson.name}</h2>
                  <p>{activePerson.bio}</p>
                  <span className="rw-tag">{activePerson.attitude}</span>
                  <dl>
                    <dt>Motivation</dt>
                    <dd>{activePerson.motivation}</dd>
                    <dt>Frustration</dt>
                    <dd>{activePerson.frustration}</dd>
                    <dt>Research context</dt>
                    <dd>
                      {activePerson.sourceIds.length
                        ? `${activePerson.sourceIds.length} source documents`
                        : "No uploaded source documents linked"}
                    </dd>
                  </dl>
                  {selectedReport?.responses
                    .find((r) => r.agentId === activePerson.id)
                    ?.reaction.observations.map((observation, i) => (
                      <div className="persona-observation" key={i}>
                        <strong>{observation.action}</strong>
                        <p>{observation.detail}</p>
                        {/^https?:\/\//.test(observation.url) && (
                          <a
                            href={observation.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Observed page
                            <ArrowUpRight size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                </aside>
              </div>
            </div>
          )}
          {page === "Data sources" && (
            <div>
              <div className="rw-page-heading">
                <div>
                  <span className="rw-eyebrow">
                    HUMAN CONTEXT, BEFORE THE SIMULATION
                  </span>
                  <h1>Research sources</h1>
                  <p>
                    Ground the cloud Bot’s personas and observations in customer
                    research you provide.
                  </p>
                </div>
                <button
                  className="rw-button secondary"
                  onClick={() => fileInput.current?.click()}
                >
                  <FileUp size={14} />
                  Import a document
                </button>
                <input
                  hidden
                  ref={fileInput}
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 100_000)
                        setError("Use a text document smaller than 100 KB.");
                      else
                        void file
                          .text()
                          .then((text) => addSource(file.name, text))
                          .catch(() =>
                            setError("The document could not be read."),
                          );
                    }
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="rw-source-layout">
                <section className="rw-panel">
                  <div className="rw-panel-title">
                    <FileText size={16} />
                    <h2>Add customer context</h2>
                  </div>
                  <label>
                    Source name
                    <input
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. Founder interviews, November"
                      maxLength={160}
                    />
                  </label>
                  <label>
                    Research type
                    <select
                      value={sourceKind}
                      onChange={(e) =>
                        setSourceKind(e.target.value as ResearchSource["kind"])
                      }
                    >
                      <option value="interview">Customer interviews</option>
                      <option value="feedback">Product feedback</option>
                      <option value="survey">Survey responses</option>
                      <option value="document">Research document</option>
                    </select>
                  </label>
                  <label>
                    Research notes
                    <textarea
                      rows={9}
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Paste interviews, survey responses, customer feedback, or benchmark notes with their source links…"
                      maxLength={50000}
                    />
                  </label>
                  <div className="study-submit">
                    <span>{number(sourceText.length)} / 50,000 characters</span>
                    <button
                      className="rw-button primary"
                      onClick={() => addSource(sourceName, sourceText)}
                      disabled={!sourceText.trim()}
                    >
                      <Plus size={14} />
                      Add source
                    </button>
                  </div>
                </section>
                <section>
                  <div className="rw-section-heading">
                    <h2>Your research library</h2>
                    <span>{data.sources.length} / 8 documents</span>
                  </div>
                  {data.sources.length ? (
                    data.sources.map((source) => (
                      <article
                        className="rw-panel research-source"
                        key={source.id}
                      >
                        <div>
                          <FileText size={18} />
                          <span>
                            <strong>{source.name}</strong>
                            <small>
                              {source.kind} · {number(source.content.length)}{" "}
                              characters
                            </small>
                          </span>
                          <button
                            className="rw-icon-button"
                            aria-label={`Remove ${source.name}`}
                            onClick={() =>
                              setData((d) => ({
                                ...d,
                                sources: d.sources.filter(
                                  (s) => s.id !== source.id,
                                ),
                              }))
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p>
                          {source.content.slice(0, 240)}
                          {source.content.length > 240 ? "…" : ""}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="rw-panel rw-empty">
                      <Database size={28} />
                      <h3>A stronger foundation starts here.</h3>
                      <p>
                        Add interviews, reviews, or survey responses. Cloud
                        research uses their content and cites the source
                        documents.
                      </p>
                    </div>
                  )}
                  <div className="rw-banner subtle">
                    <ShieldCheck size={15} />
                    <span>
                      Documents stay in this browser until you submit a cloud
                      research task. Use research you have permission to
                      process.
                    </span>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
        <footer className="rw-footer">
          <span>
            {mode === "synthetic"
              ? "Synthetic data · explore the workflow"
              : "Native Grok Bot runtime · results reported by your coordinator"}
          </span>
          <span>
            Local workspace
            <span className="rw-dot" />
          </span>
        </footer>
      </div>
      {connectionOpen && (
        <ConnectionDialog
          connection={connection}
          onClose={() => setConnectionOpen(false)}
          onSave={setConnection}
        />
      )}
    </div>
  );
}

function LayoutIcon({ size = 16 }: { size?: number }) {
  return <BarChart3 size={size} />;
}
function StudyTable({
  studies,
  onInspect,
}: {
  studies: ResearchReport[];
  onInspect: (report: ResearchReport) => void;
}) {
  return (
    <section className="rw-panel no-padding">
      <div className="rw-table-scroll">
        <table className="rw-data-table study-data-table">
          <thead>
            <tr>
              <th>Study</th>
              <th>Method</th>
              <th>Population</th>
              <th>Status</th>
              <th>Data source</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {studies.map((report) => (
              <tr key={report.id} onClick={() => onInspect(report)}>
                <td>
                  <button
                    className="rw-study-name"
                    onClick={() => onInspect(report)}
                  >
                    <span>
                      <FlaskConical size={14} />
                    </span>
                    <strong>
                      {report.study.product}
                      <small>
                        {report.study.question.slice(0, 65)}
                        {report.study.question.length > 65 ? "…" : ""}
                      </small>
                    </strong>
                  </button>
                </td>
                <td>{report.study.objective}</td>
                <td>
                  <Users size={12} />
                  {report.personas.length}
                </td>
                <td>
                  <span className="rw-status">
                    <Check size={11} />
                    Complete
                  </span>
                </td>
                <td>
                  <span
                    className={`rw-source-badge ${isSynthetic(report) ? "synthetic" : "cloud"}`}
                  >
                    {isSynthetic(report) ? "Synthetic" : "Cloud Bots"}
                  </span>
                </td>
                <td>
                  {new Date(report.completedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td>
                  <ArrowUpRight size={14} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!studies.length && (
        <div className="rw-empty compact">No studies match your search.</div>
      )}
    </section>
  );
}
