import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BarChart3,
  Check,
  CheckCheck,
  CirclePlay,
  Command,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  CodeXml,
  Globe2,
  Layers3,
  LayoutDashboard,
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
  createDemoReport,
  defaultConfig,
  sampleProfiles,
  type Report,
} from "./demo";

import { Logo, Swarm } from "./Brand";
import { ResearchWorkspace } from "./research/ResearchWorkspace";

const repoUrl = "https://github.com/Kabanosk/grok-bot-hackathon-26";

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
      count: 48,
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
      count: 24,
    },
    {
      title: "New product concept",
      result: createDemoReport({
        ...defaultConfig,
        objective: "Concept validation",
        audience: "Everyday consumers",
      }),
      audience: "Everyday consumers",
      count: 48,
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
      count: report.config.participants,
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
                    AI participants <Users size={13} aria-hidden="true" />
                  </span>
                  <div>
                    {current.config.participants}
                    <small>Across your audience</small>
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
                      {current.config.participants} agents{" "}
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
                  <span>Participants</span>
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

function App() {
  const [workspaceOpen, setWorkspaceOpen] = useState(
    window.location.pathname === "/workspace",
  );
  const [mobileNav, setMobileNav] = useState(false);
  const report: Report | null = null;
  const launch = () => {
    setMobileNav(false);
    window.history.pushState({}, "", "/workspace");
    setWorkspaceOpen(true);
  };
  const inspect = () => launch();
  useEffect(() => {
    const onNavigation = () =>
      setWorkspaceOpen(window.location.pathname === "/workspace");
    window.addEventListener("popstate", onNavigation);
    return () => window.removeEventListener("popstate", onNavigation);
  }, []);
  if (workspaceOpen)
    return (
      <ResearchWorkspace
        onExit={() => {
          window.history.pushState({}, "", "/");
          setWorkspaceOpen(false);
          window.scrollTo(0, 0);
        }}
      />
    );

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
    </>
  );
}

export default App;
