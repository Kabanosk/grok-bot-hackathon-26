import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BarChart3,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  CirclePlay,
  Command,
  Database,
  Download,
  FileText,
  FlaskConical,
  GitBranch,
  CodeXml,
  Globe2,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageSquare,
  Plus,
  Scan,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  agentCount,
  createDemoReport,
  defaultConfig,
  sampleProfiles,
  type Audience,
  type Objective,
  type Persona,
  type Reaction,
  type Report,
  type StudyConfig,
  type SwarmEvent,
} from "./demo";

const repoUrl = "https://github.com/Kabanosk/grok-bot-hackathon-26";

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={`logo ${small ? "logo-small" : ""}`}>
      <svg viewBox="0 0 32 36" fill="none" aria-hidden="true">
        <path d="m16 1 13 7.5L16 16 3 8.5Z" fill="currentColor" />
        <path d="m1 13 12 7v15L1 28Z" fill="currentColor" opacity=".7" />
        <path d="m31 13-12 7v15l12-7Z" fill="currentColor" opacity=".9" />
      </svg>
      <span>
        cohort<span className="logo-period">.</span>
      </span>
    </span>
  );
}

function Swarm({
  compact = false,
  running = false,
}: {
  compact?: boolean;
  running?: boolean;
}) {
  const dots = Array.from({ length: 48 }, (_, i) => {
    const angle = i * 2.399963;
    const radius = 18 + Math.sqrt(i / 48) * 121;
    return {
      x: 220 + Math.cos(angle) * radius * 1.29,
      y: 123 + Math.sin(angle) * radius * 0.64,
      size: i % 9 === 0 ? 4 : 2.4,
      index: i,
    };
  });
  return (
    <svg
      className={`swarm ${compact ? "swarm-compact" : ""} ${running ? "is-running" : ""}`}
      viewBox="0 0 440 245"
      role="img"
      aria-label="Illustration of simulated customer agents connected in a swarm"
    >
      <defs>
        <radialGradient id={compact ? "glow-small" : "glow"}>
          <stop offset="0%" stopColor="#e8bd7c" stopOpacity=".11" />
          <stop offset="100%" stopColor="#e8bd7c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="220"
        cy="123"
        rx="205"
        ry="119"
        fill={`url(#${compact ? "glow-small" : "glow"})`}
      />
      <g stroke="currentColor" fill="none" className="swarm-orbits">
        <ellipse cx="220" cy="123" rx="174" ry="75" />
        <ellipse
          cx="220"
          cy="123"
          rx="131"
          ry="75"
          transform="rotate(-25 220 123)"
        />
        <ellipse
          cx="220"
          cy="123"
          rx="131"
          ry="75"
          transform="rotate(25 220 123)"
        />
        <ellipse cx="220" cy="123" rx="78" ry="90" />
        <path d="M46 123h348M220 33v180" />
      </g>
      <g className="swarm-links" stroke="#b89b70">
        {dots
          .filter((_, i) => i % 3 === 0)
          .map((d) => (
            <path key={d.index} d={`M220 123  ${d.x} ${d.y}`} />
          ))}
      </g>
      {dots.map((d) => (
        <g
          key={d.index}
          className="swarm-dot"
          style={{ animationDelay: `${d.index * -0.17}s` }}
        >
          <circle
            cx={d.x}
            cy={d.y}
            r={d.size + 4}
            fill={d.index % 5 === 0 ? "#9caf91" : "#e8bd7c"}
            opacity=".07"
          />
          <circle
            cx={d.x}
            cy={d.y}
            r={d.size}
            fill={d.index % 5 === 0 ? "#9caf91" : "#d8bc91"}
            opacity={d.index % 3 === 0 ? 0.95 : 0.5}
          />
        </g>
      ))}
      <circle cx="220" cy="123" r="23" fill="#24251f" stroke="#6b5e47" />
      <path
        d="m220 109 12 7-12 7-12-7Zm-11 12 9 5v12l-9-5Zm22 0-9 5v12l9-5Z"
        fill="#e8bd7c"
      />
      {!compact && (
        <>
          <rect
            x="295"
            y="47"
            width="107"
            height="29"
            rx="6"
            fill="#22231e"
            stroke="#3a3b31"
          />
          <circle cx="308" cy="61.5" r="3" fill="#a2b896" />
          <text
            x="318"
            y="65"
            fill="#c3c5b9"
            fontSize="9.5"
            fontFamily="inherit"
          >
            48 unique perspectives
          </text>
          <rect
            x="27"
            y="170"
            width="113"
            height="29"
            rx="6"
            fill="#22231e"
            stroke="#3a3b31"
          />
          <circle cx="40" cy="184.5" r="3" fill="#e8bd7c" />
          <text
            x="50"
            y="188"
            fill="#c3c5b9"
            fontSize="9.5"
            fontFamily="inherit"
          >
            One collective insight
          </text>
        </>
      )}
    </svg>
  );
}

type Panel = "Overview" | "Simulations" | "Audiences" | "Data sources";

function Dashboard({
  onLaunch,
  onInspect,
  report,
}: {
  onLaunch: () => void;
  onInspect: (report: Report) => void;
  report: Report | null;
}) {
  const [panel, setPanel] = useState<Panel>("Overview");
  const [tab, setTab] = useState<"All studies" | "Completed">("All studies");
  const current = report ?? createDemoReport(defaultConfig);
  const profiles = sampleProfiles[current.config.audience];
  const studies: {
    title: string;
    result: Report | null;
    audience: string;
    count: number;
  }[] = [
    {
      title: "Onboarding experience",
      result: createDemoReport(defaultConfig),
      audience: "Startup founders",
      count: 8,
    },
    {
      title: "Pricing page clarity",
      result: createDemoReport({
        ...defaultConfig,
        objective: "Pricing research",
        audience: "Product teams",
        participants: 24,
      }),
      audience: "Product teams",
      count: 6,
    },
    {
      title: "New product concept",
      result: createDemoReport({
        ...defaultConfig,
        objective: "Concept validation",
        audience: "Everyday consumers",
      }),
      audience: "Everyday consumers",
      count: 8,
    },
    {
      title: "Next launch concept",
      result: null,
      audience: "Not selected",
      count: 0,
    },
  ];
  if (report)
    studies.unshift({
      title: `${report.config.product} — ${report.config.objective.toLowerCase()}`,
      result: report,
      audience: report.config.audience,
      count: agentCount(report.config.participants),
    });
  const visibleStudies =
    tab === "Completed" ? studies.filter((study) => study.result) : studies;
  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Simulations", icon: FlaskConical },
    { name: "Audiences", icon: Users },
    { name: "Data sources", icon: Database },
  ] as const;

  return (
    <div className="product-window" id="platform">
      <aside className="app-sidebar">
        <div className="workspace-identity">
          <span className="workspace-icon">
            c<span> /</span>
          </span>
          <span>
            Your workspace<small>Personal workspace</small>
          </span>
        </div>
        <button className="app-search" onClick={onLaunch}>
          <Search size={14} aria-hidden="true" />
          <span>Start a new study</span>
          <kbd>↵</kbd>
        </button>
        <span className="sidebar-label">WORKSPACE</span>
        <nav aria-label="Demo workspace">
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setPanel(name)}
              className={
                panel === name ? "app-nav-item selected" : "app-nav-item"
              }
              aria-current={panel === name ? "page" : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              {name}
              {name === "Simulations" && (
                <span className="nav-count">{studies.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-card">
            <span className="engine-icon">
              <Zap size={14} aria-hidden="true" />
            </span>
            <span>
              Built for Grok<small>Swarm intelligence</small>
            </span>
            <span className="status-dot" />
          </div>
          <span className="demo-sidebar-note">Interactive product preview</span>
          <div className="workspace-user">
            <span className="user-avatar">Y</span>
            <span>Your workspace</span>
            <span className="preview-pill">DEMO</span>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <div className="app-breadcrumb">
          <span>
            <Layers3 size={13} aria-hidden="true" /> Workspace{" "}
            <span className="slash">/</span> <strong>{panel}</strong>
          </span>
          <span className="breadcrumb-right">
            <span className="demo-dot" /> Sample data
          </span>
        </div>
        <div className="app-content">
          <div className="app-heading">
            <div>
              <div className="tiny-eyebrow">YOUR RESEARCH, IN FOCUS</div>
              <h2>
                {panel === "Overview" ? "From questions to clarity." : panel}
              </h2>
              <p>
                {panel === "Overview"
                  ? "The next best move starts with your customers."
                  : panel === "Audiences"
                    ? "Different people. Different perspectives. A clearer picture."
                    : panel === "Data sources"
                      ? "Human context is the foundation of useful research."
                      : "Every product decision deserves a little evidence."}
              </p>
            </div>
            <button className="button small amber" onClick={onLaunch}>
              <Plus size={14} aria-hidden="true" /> New simulation
            </button>
          </div>
          {panel === "Overview" && (
            <>
              <div className="stats-row">
                <div className="stat">
                  <span>
                    Simulations completed{" "}
                    <CheckCheck size={13} aria-hidden="true" />
                  </span>
                  <div>
                    {report ? "04" : "03"}
                    <small>This workspace</small>
                  </div>
                </div>
                <div className="stat">
                  <span>
                    Grok agents <Users size={13} aria-hidden="true" />
                  </span>
                  <div>
                    {agentCount(current.config.participants)}
                    <small>Grok agents in the panel</small>
                  </div>
                </div>
                <div className="stat">
                  <span>
                    Insights uncovered <Sparkles size={13} aria-hidden="true" />
                  </span>
                  <div>
                    {report ? "15" : "12"}
                    <small>
                      <span className="sage-text">Ready to explore</span>
                    </small>
                  </div>
                </div>
              </div>
              <div className="dashboard-middle">
                <div className="swarm-card">
                  <div className="panel-header">
                    <span>
                      <span className="status-dot" /> A world of perspectives
                    </span>
                    <span className="micro-tag">AI CUSTOMER SWARM</span>
                  </div>
                  <Swarm />
                  <div className="swarm-caption">
                    <span>{current.config.audience}</span>
                    <span>
                      {agentCount(current.config.participants)} Grok agents{" "}
                      <span className="separator-dot">·</span> Sample personas
                    </span>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="panel-header">
                    <span>
                      <Sparkles size={13} aria-hidden="true" /> Latest insight
                    </span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </div>
                  <span className="insight-category">
                    ONBOARDING · USABILITY
                  </span>
                  <h3>
                    A clearer first step.
                    <br />A stronger first impression.
                  </h3>
                  <p>
                    Sample participants looked for a guided starting point
                    before exploring on their own.
                  </p>
                  <div className="insight-people">
                    <div className="avatar-stack">
                      {profiles.slice(0, 3).map((p) => (
                        <span key={p.initials} className={`avatar ${p.tone}`}>
                          {p.initials}
                        </span>
                      ))}
                    </div>
                    <span>3 sample perspectives</span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => onInspect(current)}
                  >
                    Explore the findings{" "}
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
          {(panel === "Overview" || panel === "Simulations") && (
            <div className="recent-studies">
              <div className="study-heading">
                <h3>Recent simulations</h3>
                <div className="table-tabs" aria-label="Filter studies">
                  {(["All studies", "Completed"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      aria-pressed={tab === t}
                      className={tab === t ? "active" : ""}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="study-table">
                <div className="study-row table-head">
                  <span>Study</span>
                  <span>Audience</span>
                  <span>Status</span>
                  <span>Agents</span>
                </div>
                {visibleStudies.map((study, i) => (
                  <button
                    className="study-row"
                    key={`${study.title}-${i}`}
                    onClick={() =>
                      study.result ? onInspect(study.result) : onLaunch()
                    }
                    aria-label={`${study.result ? "View sample study" : "Set up study"} ${study.title}`}
                  >
                    <span>
                      <span
                        className={`study-icon ${i === 1 ? "rose" : i === 2 ? "sage" : "amber"}`}
                      >
                        {i === 1 ? (
                          <BarChart3 size={13} />
                        ) : i === 2 ? (
                          <Target size={13} />
                        ) : (
                          <Scan size={13} />
                        )}
                      </span>
                      {study.title}
                    </span>
                    <span>{study.audience}</span>
                    <span className={study.result ? "completed" : "draft"}>
                      {study.result ? (
                        <Check size={11} aria-hidden="true" />
                      ) : (
                        <FileText size={11} aria-hidden="true" />
                      )}
                      {study.result ? "Completed" : "Draft"}
                    </span>
                    <span>
                      <Users size={12} aria-hidden="true" />
                      {study.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {panel === "Audiences" && (
            <div className="audience-view">
              <div className="audience-summary">
                <span className="section-kicker">ILLUSTRATIVE PERSONAS</span>
                <h3>{current.config.audience}</h3>
                <p>
                  These fictional profiles show how a future audience could
                  look. No real people have been interviewed or modeled.
                </p>
              </div>
              <div className="profile-grid">
                {profiles.map((p) => (
                  <div className="profile-card" key={p.name}>
                    <span className={`avatar ${p.tone}`}>{p.initials}</span>
                    <h3>{p.name}</h3>
                    <p>{p.role}</p>
                    <span className="micro-tag">SAMPLE PERSONA</span>
                  </div>
                ))}
              </div>
              <button className="button secondary small" onClick={onLaunch}>
                Build a sample audience{" "}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
          {panel === "Data sources" && (
            <div className="sources-view">
              {[
                {
                  icon: MessageSquare,
                  title: "Customer interviews",
                  text: "Bring the motivations, language, and context behind customer decisions.",
                },
                {
                  icon: FileText,
                  title: "Research & survey data",
                  text: "Use consented research to give your audience a meaningful foundation.",
                },
                {
                  icon: AudioLines,
                  title: "Customer feedback",
                  text: "Add product reviews and support themes to build a richer perspective.",
                },
              ].map((source) => (
                <div className="source-card" key={source.title}>
                  <source.icon size={20} aria-hidden="true" />
                  <div>
                    <h3>{source.title}</h3>
                    <p>{source.text}</p>
                  </div>
                  <span className="micro-tag">NOT CONNECTED</span>
                </div>
              ))}
              <p className="source-note">
                <ShieldCheck size={15} aria-hidden="true" />
                Data ingestion is planned. This demo uses fictional personas
                only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const runningSteps = [
  "Building your sample audience",
  "Simulating individual perspectives",
  "Comparing responses across the swarm",
  "Preparing your sample report",
];

function Workspace({
  onClose,
  onComplete,
  initialReport,
}: {
  onClose: () => void;
  onComplete: (report: Report) => void;
  initialReport: Report | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [config, setConfig] = useState<StudyConfig>(
    initialReport?.config ?? {
      ...defaultConfig,
      product: "",
      url: "",
      description: "",
    },
  );
  const [stage, setStage] = useState<"setup" | "running" | "results">(
    initialReport ? "results" : "setup",
  );
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<Report | null>(initialReport);
  const [error, setError] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [run, setRun] = useState<{ mode: "live" | "demo"; model: string; agents: number } | null>(null);
  const productInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    if (stage !== "running") return;
    const controller = new AbortController();
    const finish = (result: Report) => {
      setReport(result);
      onComplete(result);
      setStage("results");
    };
    const handle = (event: SwarmEvent) => {
      if (event.type === "mode") setRun(event);
      else if (event.type === "stage") setStep(event.index);
      else if (event.type === "persona")
        setPersonas((list) => [...list, event.persona]);
      else if (event.type === "reaction")
        setReactions((list) => [...list, event.reaction]);
      else if (event.type === "scout" || event.type === "warning")
        setNotes((list) => [
          ...list,
          event.type === "scout" ? event.detail : event.message,
        ]);
      else if (event.type === "error") throw new Error(event.message);
      else if (event.type === "report") finish(event.report);
    };
    (async () => {
      try {
        const res = await fetch("/api/study", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error("Swarm service unavailable");
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        let done = false;
        while (!done) {
          const chunk = await reader.read();
          done = chunk.done;
          buffer += chunk.value ?? "";
          let newline = buffer.indexOf("\n");
          while (newline >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (line) handle(JSON.parse(line) as SwarmEvent);
            newline = buffer.indexOf("\n");
          }
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        // Offline fallback: keep the demo working without the swarm service.
        setNotes((list) => [
          ...list,
          `Swarm unavailable (${(e as Error).message}). Showing sample data.`,
        ]);
        for (let i = 0; i < runningSteps.length; i++) {
          setStep(i);
          await new Promise((r) => window.setTimeout(r, 500));
          if (controller.signal.aborted) return;
        }
        finish({ ...createDemoReport(config), mode: "demo" });
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function start(e: FormEvent) {
    e.preventDefault();
    if (!config.product.trim()) {
      setError("Give your product a name to continue.");
      productInput.current?.focus();
      return;
    }
    if (!config.description.trim()) {
      setError("Add a short description so your study has some context.");
      return;
    }
    if (config.url.trim()) {
      try {
        const url = new URL(config.url);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setError("Use a full product URL, starting with https:// or http://.");
        return;
      }
    }
    setError("");
    setConfig((c) => ({
      ...c,
      product: c.product.trim(),
      description: c.description.trim(),
      url: c.url.trim(),
    }));
    setStep(0);
    setPersonas([]);
    setReactions([]);
    setNotes([]);
    setRun(null);
    setStage("running");
  }

  const live = report?.mode === "live";

  function downloadReport() {
    if (!report) return;
    const data = {
      ...report,
      mode: live ? "live" : "demo",
      provenance: live
        ? `Generated by a swarm of ${report.agents} Grok agents (${report.model}) acting as synthetic customers, then synthesized by a researcher agent. Synthetic opinions: validate with real customers.`
        : "Fictional personas and prewritten sample findings. No website was fetched and no Grok API was called.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort-${report.config.product
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60)}-${live ? "swarm" : "demo"}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <dialog
      ref={dialog}
      className="workspace-dialog"
      aria-labelledby="workspace-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-shell">
        <div className="dialog-header">
          <Logo small />
          <span className="preview-pill">
            {(run ?? report)?.mode === "live"
              ? `LIVE · ${(run ?? report)?.model}`
              : "INTERACTIVE DEMO"}
          </span>
          <button
            className="icon-button"
            aria-label="Close workspace"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {stage === "setup" && (
          <form onSubmit={start} noValidate>
            <div className="dialog-intro">
              <span className="section-kicker">
                A LITTLE CONTEXT. A LOT OF PERSPECTIVE.
              </span>
              <h2 id="workspace-title">Meet your next customers.</h2>
              <p>Set up a sample study and see how Cohort works.</p>
            </div>
            <div className="setup-grid">
              <div className="setup-fields">
                <label htmlFor="product">
                  Product name <span>Required</span>
                </label>
                <input
                  ref={productInput}
                  autoFocus
                  id="product"
                  value={config.product}
                  maxLength={80}
                  onChange={(e) =>
                    setConfig({ ...config, product: e.target.value })
                  }
                  placeholder="e.g. Orbit"
                  required
                  aria-invalid={!!error && !config.product.trim()}
                />
                <label htmlFor="product-url">
                  Product URL <span>Optional</span>
                </label>
                <input
                  id="product-url"
                  type="url"
                  value={config.url}
                  maxLength={2000}
                  onChange={(e) =>
                    setConfig({ ...config, url: e.target.value })
                  }
                  placeholder="https://your-product.com"
                />
                <label htmlFor="description">
                  What are you building? <span>Required</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={config.description}
                  maxLength={1000}
                  onChange={(e) =>
                    setConfig({ ...config, description: e.target.value })
                  }
                  placeholder="Describe your product and the problem it solves…"
                  required
                />
                <label htmlFor="objective">What would you like to learn?</label>
                <div className="select-wrap">
                  <select
                    id="objective"
                    value={config.objective}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        objective: e.target.value as Objective,
                      })
                    }
                  >
                    {(
                      [
                        "Usability test",
                        "Concept validation",
                        "Pricing research",
                      ] as const
                    ).map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="setup-audience">
                <div className="setup-audience-heading">
                  <Users size={17} aria-hidden="true" />
                  <h3>Your sample audience</h3>
                </div>
                <label htmlFor="audience">Who is it for?</label>
                <div className="select-wrap">
                  <select
                    id="audience"
                    value={config.audience}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        audience: e.target.value as Audience,
                      })
                    }
                  >
                    {(
                      [
                        "Startup founders",
                        "Product teams",
                        "Everyday consumers",
                      ] as const
                    ).map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </div>
                <fieldset className="size-field">
                  <legend>Panel size (Grok agents)</legend>
                  <div className="participant-options">
                    {[24, 48, 96].map((n) => (
                      <button
                        type="button"
                        className={config.participants === n ? "selected" : ""}
                        key={n}
                        aria-pressed={config.participants === n}
                        onClick={() =>
                          setConfig({ ...config, participants: n })
                        }
                      >
                        {agentCount(n)}
                        <span>Grok agents</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="setup-profiles">
                  {sampleProfiles[config.audience].slice(0, 3).map((p) => (
                    <div key={p.name}>
                      <span className={`avatar ${p.tone}`}>{p.initials}</span>
                      <span>
                        {p.name}
                        <small>{p.role}</small>
                      </span>
                      <Check size={12} aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className="demo-notice">
                  <CircleHelp size={15} aria-hidden="true" />
                  <span>
                    This preview uses fictional personas and prewritten
                    findings. Product URLs are saved as context, but aren’t
                    visited.
                  </span>
                </div>
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-footer">
              <span>
                <ShieldCheck size={14} aria-hidden="true" />
                No account or API key needed
              </span>
              <button className="button amber" type="submit">
                Run sample simulation{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </form>
        )}
        {stage === "running" && (
          <div className="running-stage">
            <span className="section-kicker">SWARM PREVIEW</span>
            <h2 id="workspace-title">A few different points of view.</h2>
            <p>
              Preparing a sample {config.objective.toLowerCase()} for{" "}
              {config.product}.
            </p>
            <Swarm compact running />
            <div className="running-steps" role="status" aria-live="polite">
              {runningSteps.map((s, i) => (
                <div key={s} className={i <= step ? "current" : ""}>
                  {i < step ? (
                    <Check size={16} aria-hidden="true" />
                  ) : i === step ? (
                    <LoaderCircle
                      size={16}
                      className="spinning"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="step-circle" />
                  )}
                  {s}
                </div>
              ))}
            </div>
            {personas.length > 0 && (
              <ul className="swarm-feed" aria-label="Swarm participants">
                {personas.map((p) => {
                  const r = reactions.find((x) => x.personaId === p.id);
                  return (
                    <li key={p.id} className={r ? "answered" : ""}>
                      <span className={`avatar ${p.tone}`}>{p.initials}</span>
                      <span className="swarm-feed-body">
                        <strong>
                          {p.name} <small>{p.role}</small>
                        </strong>
                        {r ? (
                          <q>{r.quote}</q>
                        ) : (
                          <em>
                            <LoaderCircle size={12} className="spinning" aria-hidden="true" />{" "}
                            thinking as a {p.attitude}…
                          </em>
                        )}
                      </span>
                      {r && (
                        <span className={`verdict ${r.verdict}`}>
                          {r.verdict === "yes" ? "Would use" : r.verdict === "no" ? "Wouldn’t" : "Maybe"}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {notes.map((n) => (
              <p key={n} className="running-note">
                {n}
              </p>
            ))}
            <p className="running-note">
              {run?.mode === "live"
                ? `Live · ${run.agents} Grok agents · ${run.model} · ${reactions.length}/${run.agents} answered`
                : "Simulated progress · No live model calls"}
            </p>
          </div>
        )}
        {stage === "results" && report && (
          <div className="result-stage">
            <div className="result-top">
              <div>
                <span className="section-kicker">
                  <CheckCheck size={14} aria-hidden="true" />{" "}
                  {live ? "SWARM STUDY COMPLETE" : "SAMPLE STUDY COMPLETE"}
                </span>
                <h2 id="workspace-title">
                  A clearer view of {report.config.product}.
                </h2>
                <p>
                  {report.config.objective}{" "}
                  <span className="separator-dot">·</span>{" "}
                  {report.config.audience}{" "}
                  <span className="separator-dot">·</span>{" "}
                  {live
                    ? `${report.agents} Grok agents`
                    : `${agentCount(report.config.participants)} sample agents`}
                </p>
              </div>
              <div className="result-score">
                <strong>
                  {report.score}
                  <span>/100</span>
                </strong>
                <span>{live ? "Swarm score" : "Illustrative score"}</span>
              </div>
            </div>
            <div className="result-disclaimer">
              <CircleHelp size={16} aria-hidden="true" />
              <p>
                {live
                  ? report.summary ||
                    "Synthetic customers generated by Grok. Treat these as hypotheses and validate them with real customers."
                  : "These are prewritten examples for your chosen study type, not an evaluation of your product. Validate findings with real customers."}
              </p>
            </div>
            {report.breakdown && (
              <div
                className="verdict-bar"
                role="img"
                aria-label={`${report.breakdown.yes} would use, ${report.breakdown.maybe} maybe, ${report.breakdown.no} would not`}
              >
                <span className="yes" style={{ flex: report.breakdown.yes || 0.001 }}>
                  {report.breakdown.yes} would use
                </span>
                <span className="maybe" style={{ flex: report.breakdown.maybe || 0.001 }}>
                  {report.breakdown.maybe} maybe
                </span>
                <span className="no" style={{ flex: report.breakdown.no || 0.001 }}>
                  {report.breakdown.no} wouldn’t
                </span>
              </div>
            )}
            <h3 className="findings-title">
              {live ? "What the swarm told you" : "A preview of what you could learn"}
            </h3>
            <div className="result-findings">
              {report.findings.map((finding, i) => (
                <article key={finding.title}>
                  <span className="finding-index">0{i + 1}</span>
                  <div>
                    <h3>{finding.title}</h3>
                    <p>{finding.detail}</p>
                  </div>
                  <span
                    className={`severity ${finding.severity.toLowerCase()}`}
                  >
                    {finding.severity} priority
                  </span>
                </article>
              ))}
            </div>
            {live && report.voices && report.voices.length > 0 && (
              <>
                <h3 className="findings-title">Voices from the swarm</h3>
                <ul className="swarm-feed voices">
                  {[...report.voices]
                    .sort((a, b) => a.score - b.score)
                    .filter((_, i, all) => i < 2 || i >= all.length - 2)
                    .map((r) => (
                      <li key={r.personaId} className="answered">
                        <span className={`avatar ${r.tone}`}>{r.initials}</span>
                        <span className="swarm-feed-body">
                          <strong>
                            {r.name} <small>{r.role} · {r.score}/100</small>
                          </strong>
                          <q>{r.quote}</q>
                          {r.concern && <small>Concern: {r.concern}</small>}
                        </span>
                        <span className={`verdict ${r.verdict}`}>
                          {r.verdict === "yes" ? "Would use" : r.verdict === "no" ? "Wouldn’t" : "Maybe"}
                        </span>
                      </li>
                    ))}
                </ul>
              </>
            )}
            <div className="dialog-footer">
              <button className="text-button" onClick={() => setStage("setup")}>
                <ArrowDownLeft size={15} aria-hidden="true" /> Adjust your study
              </button>
              <button className="button amber" onClick={downloadReport}>
                <Download size={15} aria-hidden="true" /> Download sample report
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

function App() {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const launch = () => {
    setSelectedReport(null);
    setMobileNav(false);
    setWorkspaceOpen(true);
  };
  const inspect = (result: Report) => {
    setSelectedReport(result);
    setWorkspaceOpen(true);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" aria-label="Cohort home">
            <Logo />
          </a>
          <nav
            className={mobileNav ? "site-nav is-open" : "site-nav"}
            aria-label="Main navigation"
          >
            <a href="#platform" onClick={() => setMobileNav(false)}>
              Platform
            </a>
            <a href="#how-it-works" onClick={() => setMobileNav(false)}>
              How it works
            </a>
            <a href="#our-approach" onClick={() => setMobileNav(false)}>
              Our approach
            </a>
          </nav>
          <div className="header-actions">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="github-link"
              aria-label="View Cohort source on GitHub"
            >
              <CodeXml size={17} />
            </a>
            <button className="button header-cta" onClick={launch}>
              Open workspace <ArrowUpRight size={14} aria-hidden="true" />
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label={mobileNav ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-light" aria-hidden="true" />
          <div className="hero-content">
            <a className="announcement" href="#our-approach">
              <span className="announcement-dot" />
              <span>Human perspective. Swarm intelligence.</span>
              <ArrowRight size={12} aria-hidden="true" />
            </a>
            <h1>
              Know your users.
              <br />
              <span>Before you launch.</span>
            </h1>
            <p className="hero-description">
              Put your next product decision in front of an AI customer swarm.
              <br className="desktop-break" /> More perspectives. Fewer blind
              spots. A clearer way forward.
            </p>
            <div className="hero-actions">
              <button className="button amber hero-button" onClick={launch}>
                Test your product <ArrowRight size={16} aria-hidden="true" />
              </button>
              <a href="#how-it-works" className="button ghost">
                <CirclePlay size={16} aria-hidden="true" />
                See how it works
              </a>
            </div>
            <div className="hero-footnote">
              <span className="tiny-swarm">
                <span />
                <span />
                <span />
              </span>
              Built for Grok
              <span className="footnote-divider" />
              Designed around human context
            </div>
          </div>
          <div className="preview-container">
            <div className="preview-label">
              <span>
                <span className="status-dot" /> THE COHORT WORKSPACE
              </span>
              <span>
                Clarity looks good on you.
                <ArrowDown size={12} aria-hidden="true" />
              </span>
            </div>
            <Dashboard onLaunch={launch} onInspect={inspect} report={report} />
            <div className="preview-caption">
              <span>
                <Command size={12} aria-hidden="true" /> A working preview. Go
                ahead, explore.
              </span>
              <span>Sample data · No live research</span>
            </div>
          </div>
        </section>
        <section className="value-strip" aria-label="Cohort capabilities">
          <div>
            <Users size={18} aria-hidden="true" />
            <span>
              Many perspectives.<strong>One clear direction.</strong>
            </span>
          </div>
          <div>
            <GitBranch size={18} aria-hidden="true" />
            <span>
              Explore the alternatives.<strong>Find your next move.</strong>
            </span>
          </div>
          <div>
            <Zap size={18} aria-hidden="true" />
            <span>
              Less time wondering.<strong>More time building.</strong>
            </span>
          </div>
        </section>
        <section className="how-section section-container" id="how-it-works">
          <div className="section-intro">
            <span className="section-kicker">FROM WHAT IF TO WHAT’S NEXT</span>
            <div>
              <h2>
                Your questions.
                <br />
                <span>A whole new perspective.</span>
              </h2>
              <p>
                A research workflow built for the pace of product development.
                Start with a question. Leave with a direction.
              </p>
            </div>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <div className="step-visual brief-visual">
                <div className="brief-line">
                  <Globe2 size={14} aria-hidden="true" />
                  <span>your-next-big-thing.com</span>
                  <ArrowUpRight size={12} aria-hidden="true" />
                </div>
                <div className="brief-question">
                  <span className="small-icon">
                    <Target size={15} aria-hidden="true" />
                  </span>
                  Will this make sense to new users?
                </div>
                <span className="brief-tag">
                  <Check size={11} aria-hidden="true" />A question worth asking
                </span>
              </div>
              <div className="step-description">
                <span>01</span>
                <div>
                  <h3>Bring your product.</h3>
                  <p>
                    A concept, a prototype, a pricing page. Tell us what you’re
                    building and what you want to learn.
                  </p>
                </div>
              </div>
            </article>
            <article className="step-card">
              <div className="step-visual audience-visual">
                <div className="persona-orbit">
                  <div className="persona-orbit-ring" />
                  <span className="avatar amber a-one">AL</span>
                  <span className="avatar sage a-two">SK</span>
                  <span className="avatar rose a-three">JM</span>
                  <span className="avatar stone a-four">RN</span>
                  <span className="orbit-center">
                    <Users size={23} aria-hidden="true" />
                  </span>
                </div>
                <span className="audience-visual-label">
                  <span className="status-dot" /> Your audience, ready to weigh
                  in
                </span>
              </div>
              <div className="step-description">
                <span>02</span>
                <div>
                  <h3>Assemble your audience.</h3>
                  <p>
                    Build a swarm around the people you’re designing for, with
                    customer research as its foundation.
                  </p>
                </div>
              </div>
            </article>
            <article className="step-card">
              <div className="step-visual findings-visual">
                <div className="mini-finding">
                  <span className="mini-check">
                    <Check size={12} aria-hidden="true" />
                  </span>
                  <span>Make the first step clearer</span>
                  <span className="finding-line" />
                </div>
                <div className="mini-finding">
                  <span className="mini-check">
                    <Check size={12} aria-hidden="true" />
                  </span>
                  <span>Show value before setup</span>
                  <span className="finding-line" />
                </div>
                <div className="mini-finding">
                  <span className="mini-check">
                    <Check size={12} aria-hidden="true" />
                  </span>
                  <span>Explain the trial terms</span>
                  <span className="finding-line" />
                </div>
                <div className="mini-result">
                  <Sparkles size={12} aria-hidden="true" />
                  Less noise. More next steps.
                  <ArrowRight size={12} aria-hidden="true" />
                </div>
              </div>
              <div className="step-description">
                <span>03</span>
                <div>
                  <h3>See what you’ve been missing.</h3>
                  <p>
                    Explore individual responses, spot patterns, and turn fresh
                    perspectives into your next iteration.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section
          className="approach-section section-container"
          id="our-approach"
        >
          <div className="approach-copy">
            <span className="section-kicker">BUILT WITH PEOPLE IN MIND</span>
            <h2>
              Artificial intelligence.
              <br />
              <span>Human context.</span>
            </h2>
            <p>
              The best product decisions start with understanding people. We’re
              building Cohort to bring their motivations, frustrations, and
              expectations into the development process.
            </p>
            <div className="approach-points">
              <div>
                <Database size={17} aria-hidden="true" />
                <span>
                  <strong>Research as the foundation</strong>Designed to use
                  consented interviews and customer feedback.
                </span>
              </div>
              <div>
                <GitBranch size={17} aria-hidden="true" />
                <span>
                  <strong>Independent perspectives, together</strong>A swarm
                  architecture built for Grok-powered customer agents.
                </span>
              </div>
              <div>
                <ShieldCheck size={17} aria-hidden="true" />
                <span>
                  <strong>Evidence you can question</strong>Clear sources and
                  explicit limits, so you know what to validate.
                </span>
              </div>
            </div>
          </div>
          <div className="context-visual">
            <div className="context-top">
              <span>
                <span className="status-dot" /> THE BIGGER PICTURE
              </span>
              <span className="micro-tag">OUR APPROACH</span>
            </div>
            <div className="context-inputs">
              <span>
                <MessageSquare size={14} aria-hidden="true" /> Interviews
              </span>
              <span>
                <FileText size={14} aria-hidden="true" /> Research
              </span>
              <span>
                <AudioLines size={14} aria-hidden="true" /> Feedback
              </span>
            </div>
            <div className="context-connectors" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="context-engine">
              <Logo small />
              <span>
                Human context meets
                <br />
                swarm intelligence.
              </span>
              <Sparkles size={19} aria-hidden="true" />
            </div>
            <div className="context-output-line" aria-hidden="true" />
            <div className="context-output">
              <span className="small-icon">
                <Target size={17} aria-hidden="true" />
              </span>
              <span>A more informed decision</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </div>
            <p className="context-note">
              The vision we’re building toward.
              <br />
              Today’s preview uses illustrative data.
            </p>
          </div>
        </section>
        <section className="closing-section section-container">
          <span className="section-kicker">
            YOUR NEXT IDEA DESERVES A SECOND OPINION.
          </span>
          <h2>
            Go from “we think”
            <br />
            <span>to “let’s find out.”</span>
          </h2>
          <button className="button amber hero-button" onClick={launch}>
            Explore the workspace <ArrowRight size={16} aria-hidden="true" />
          </button>
          <span className="closing-note">
            Start with the interactive demo. No sign-up needed.
          </span>
          <div className="closing-orbit" aria-hidden="true" />
        </section>
      </main>
      <footer className="site-footer">
        <a href="#" aria-label="Cohort home">
          <Logo small />
        </a>
        <span>A little perspective changes everything.</span>
        <div>
          <span className="hackathon-note">Built at the xAI hackathon</span>
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Cohort on GitHub"
          >
            <CodeXml size={16} />
          </a>
        </div>
      </footer>
      {workspaceOpen && (
        <Workspace
          onClose={() => setWorkspaceOpen(false)}
          onComplete={setReport}
          initialReport={selectedReport}
        />
      )}
    </>
  );
}

export default App;
