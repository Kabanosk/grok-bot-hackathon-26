import { useEffect, useState } from "react";
import "./market.css";

type Verdict = "yes" | "maybe" | "no";
type Segment = { id: string; name: string; share: number; description: string };
type Persona = {
  id: string;
  segmentId: string;
  name: string;
  age: number;
  city: string;
  role: string;
  context: string;
  attitude: "enthusiast" | "pragmatist" | "skeptic";
};
type Reaction = { personaId: string; verdict: Verdict; score: number; quote: string; concern: string; wtp?: string };
type Debate = { personaId: string; replyTo: string; text: string; changed: boolean; verdict?: Verdict };
type Finding = { title: string; detail: string; severity: "High" | "Medium" | "Low" };
type Market = {
  study: { product: string; market: string; description: string; objective: string; createdAt: string } | null;
  segments: Segment[];
  personas: Persona[];
  reactions: Reaction[];
  debate: Debate[];
  report: { summary: string; findings: Finding[]; recommendation?: string } | null;
  log: { at: string; text: string }[];
  stats: {
    personas: number;
    answered: number;
    weightedScore: number | null;
    adoption: { yes: number; maybe: number; no: number } | null;
    bySegment: { segmentId: string; score: number | null; yes: number; maybe: number; no: number }[];
  };
};

const tones = ["amber", "sage", "rose", "stone"];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
const toneOf = (id: string) => tones[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length];
const time = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};
const pct = (n: number) => `${Math.round(n)}%`;

export function useMarket() {
  const [data, setData] = useState<Market | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/market");
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as Market;
        if (alive) {
          setData(json);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };
    void tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);
  return { data, error };
}

function PersonaChip({ p, r }: { p: Persona; r?: Reaction }) {
  return (
    <li className={`mk-chip ${r ? `is-${r.verdict}` : "is-pending"} att-${p.attitude}`} tabIndex={0}>
      <span className={`avatar ${toneOf(p.id)}`}>{initials(p.name)}</span>
      <span className="mk-chip-name">
        <strong>{p.name}</strong>
        <small>
          {p.age} · {p.city}
        </small>
      </span>
      {r && <span className={`verdict ${r.verdict}`}>{r.verdict}</span>}
      <div className="mk-pop" role="tooltip">
        <b>
          {p.role} · {p.attitude}
        </b>
        <p className="mk-ctx">{p.context}</p>
        {r ? (
          <>
            <q>{r.quote}</q>
            <p>
              <em>Concern:</em> {r.concern}
            </p>
            {r.wtp && (
              <p>
                <em>Would pay:</em> {r.wtp}
              </p>
            )}
            <p>
              <em>Score:</em> {r.score}/100
            </p>
          </>
        ) : (
          <p>Waiting for Grok Bot to answer…</p>
        )}
      </div>
    </li>
  );
}

export default function MarketPanel() {
  const { data, error } = useMarket();
  const study = data?.study ?? null;
  const reactions = new Map((data?.reactions ?? []).map((r) => [r.personaId, r]));
  const personas = new Map((data?.personas ?? []).map((p) => [p.id, p]));
  const segStats = new Map((data?.stats.bySegment ?? []).map((s) => [s.segmentId, s]));
  const adoption = data?.stats.adoption ?? null;

  return (
    <div className="mk">
      <header className="mk-header">
        <a href="#" className="mk-logo" aria-label="Cohort home">
          <span className="mk-mark" aria-hidden="true">▲</span> cohort<span>.</span>
        </a>
        <span className="mk-pill">
          <i aria-hidden="true" /> Cohort Master · powered by Grok Bot
        </span>
        {study && (
          <div className="mk-study">
            <h1>
              {study.product} <small>on the {study.market} market</small>
            </h1>
            <p>{study.objective}</p>
          </div>
        )}
        <a className="mk-back" href="#">
          Back to site
        </a>
      </header>

      {!study ? (
        <section className="mk-empty" data-testid="panel-empty">
          <h1>Waiting for Cohort Master…</h1>
          <p>
            Ask Grok Bot: <q>Cohort Master, test &lt;product&gt; on the Polish market</q>
          </p>
          {error && <small>Server not reachable yet, retrying…</small>}
          {data && data.log.length > 0 && <ActivityLog log={data.log} />}
        </section>
      ) : (
        <div className="mk-body">
          <aside className="mk-log">
            <h2>Grok Bot activity</h2>
            <ActivityLog log={data!.log} />
          </aside>
          <main className="mk-main">
            <div className="mk-kpis">
              <div>
                <span>Personas</span>
                <strong>{data!.stats.personas}</strong>
              </div>
              <div>
                <span>Answered</span>
                <strong>
                  {data!.stats.answered}/{data!.stats.personas}
                </strong>
              </div>
              <div>
                <span>Market-weighted score</span>
                <strong>{data!.stats.weightedScore == null ? "–" : Math.round(data!.stats.weightedScore)}</strong>
              </div>
            </div>
            <div className="mk-adopt">
              <span>Weighted adoption</span>
              {adoption ? (
                <div className="verdict-bar" aria-label="Weighted adoption">
                  <span className="yes" style={{ width: `${adoption.yes}%` }}>{adoption.yes >= 8 ? `yes ${pct(adoption.yes)}` : ""}</span>
                  <span className="maybe" style={{ width: `${adoption.maybe}%` }}>{adoption.maybe >= 8 ? `maybe ${pct(adoption.maybe)}` : ""}</span>
                  <span className="no" style={{ width: `${adoption.no}%` }}>{adoption.no >= 8 ? `no ${pct(adoption.no)}` : ""}</span>
                </div>
              ) : (
                <div className="verdict-bar mk-bar-empty" />
              )}
            </div>

            <h2 className="mk-h">Market segments</h2>
            <div className="mk-segments">
              {data!.segments.map((s) => {
                const st = segStats.get(s.id);
                const members = data!.personas.filter((p) => p.segmentId === s.id);
                return (
                  <article className="mk-seg" key={s.id}>
                    <div className="mk-seg-top">
                      <h3>{s.name}</h3>
                      <b>{pct(s.share)}</b>
                    </div>
                    <div className="mk-share"><i style={{ width: `${Math.min(100, s.share)}%` }} /></div>
                    <p className="mk-seg-desc">{s.description}</p>
                    <div className="mk-seg-stats">
                      <span>Score {st?.score == null ? "–" : Math.round(st.score)}</span>
                      <span className="verdict yes">{st?.yes ?? 0} yes</span>
                      <span className="verdict maybe">{st?.maybe ?? 0} maybe</span>
                      <span className="verdict no">{st?.no ?? 0} no</span>
                    </div>
                    <ul className="mk-chips">
                      {members.map((p) => (
                        <PersonaChip key={p.id} p={p} r={reactions.get(p.id)} />
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            {data!.debate.length > 0 && (
              <>
                <h2 className="mk-h">Panel debate</h2>
                <ul className="mk-debate">
                  {data!.debate.map((d, i) => {
                    const a = personas.get(d.personaId);
                    const b = personas.get(d.replyTo);
                    return (
                      <li key={i}>
                        <span className={`avatar ${toneOf(d.personaId)}`}>{initials(a?.name ?? "?")}</span>
                        <div>
                          <strong>
                            {a?.name ?? d.personaId} ↩ {b?.name ?? d.replyTo}
                          </strong>
                          {d.changed && <span className="mind-chip">changed mind{d.verdict ? ` → ${d.verdict}` : ""}</span>}
                          <p>{d.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {data!.report && (
              <section className="mk-report">
                <h2 className="mk-h">Final report</h2>
                <p className="mk-summary">{data!.report.summary}</p>
                <ul className="mk-findings">
                  {data!.report.findings.slice(0, 3).map((f, i) => (
                    <li key={i}>
                      <span className={`mk-sev sev-${f.severity.toLowerCase()}`}>{f.severity}</span>
                      <div>
                        <strong>{f.title}</strong>
                        <p>{f.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {data!.report.recommendation && (
                  <p className="mk-reco">
                    <b>Recommendation</b>
                    {data!.report.recommendation}
                  </p>
                )}
              </section>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function ActivityLog({ log }: { log: { at: string; text: string }[] }) {
  const items = [...log].reverse();
  return (
    <ol className="mk-log-list">
      {items.map((l, i) => (
        <li key={`${l.at}-${i}`}>
          <time>{time(l.at)}</time>
          <span>{l.text}</span>
        </li>
      ))}
    </ol>
  );
}
