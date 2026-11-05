import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Avatar, PersonaCard } from "./ResearchVisuals";
import { distribution, incomeBands, type SyntheticPerson } from "./synthetic";
import type { Persona } from "./contracts";

export function PopulationExplorer({
  people,
  onSelect,
  onBuild,
}: {
  people: SyntheticPerson[];
  onSelect: (person: Persona) => void;
  onBuild: () => void;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All regions");
  const [income, setIncome] = useState("All incomes");
  const [attitude, setAttitude] = useState("All attitudes");
  const [view, setView] = useState<"explore" | "list">("explore");
  const [split, setSplit] = useState<
    "income" | "region" | "attitude" | "occupation"
  >("income");
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      people.filter(
        (p) =>
          (region === "All regions" || p.region === region) &&
          (income === "All incomes" || p.income === income) &&
          (attitude === "All attitudes" || p.attitude === attitude) &&
          `${p.name} ${p.role} ${p.location}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [people, region, income, attitude, query],
  );
  const groups = distribution(filtered, split);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 25));
  const activePage = Math.min(page, totalPages - 1);
  const averageAge = filtered.length
    ? (filtered.reduce((sum, p) => sum + p.age, 0) / filtered.length).toFixed(1)
    : "—";
  const colors = [
    "#0d704c",
    "#2a8e65",
    "#50a47c",
    "#7bb793",
    "#a2cbb0",
    "#c0dccc",
    "#477965",
    "#6a977a",
    "#8bab93",
    "#b9c8bc",
    "#376550",
    "#728d7b",
  ];
  function exportCsv() {
    const header = "id,name,age,role,location,region,income,attitude\n";
    const text =
      header +
      filtered
        .map((p) =>
          [
            p.id,
            p.name,
            p.age,
            p.role,
            p.location,
            p.region,
            p.income,
            p.attitude,
          ]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cohort-synthetic-population.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div>
      <div className="rw-page-heading">
        <div>
          <div className="rw-eyebrow">YOUR RESEARCH AUDIENCE</div>
          <h1>
            Population explorer{" "}
            <span className="rw-count">{filtered.length.toLocaleString()}</span>
          </h1>
          <p>A closer look at the people your next decision is designed for.</p>
        </div>
        <div className="rw-inline-actions">
          <button className="rw-button secondary" onClick={exportCsv}>
            <ArrowDownToLine size={14} />
            Export CSV
          </button>
          <button className="rw-button primary" onClick={onBuild}>
            Build an audience
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <div className="rw-banner subtle">
        <span className="rw-dot" />
        <strong>Synthetic population</strong>
        <span>
          12,000 fictional profiles for exploring the product. No real customer
          outcomes are represented.
        </span>
      </div>
      <div className="rw-filterbar">
        <div className="rw-search">
          <Search size={15} />
          <input
            aria-label="Search population"
            placeholder="Search name, role, or location…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          aria-label="Filter region"
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            setPage(0);
          }}
        >
          {["All regions", "North America", "Europe", "Asia Pacific"].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
        <select
          aria-label="Filter income"
          value={income}
          onChange={(e) => {
            setIncome(e.target.value);
            setPage(0);
          }}
        >
          {["All incomes", ...incomeBands].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Filter attitude"
          value={attitude}
          onChange={(e) => {
            setAttitude(e.target.value);
            setPage(0);
          }}
        >
          {["All attitudes", "Early adopter", "Pragmatist", "Skeptic"].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
        <div className="rw-segment">
          <button
            aria-pressed={view === "explore"}
            onClick={() => setView("explore")}
          >
            <LayoutGrid size={14} />
            Explore
          </button>
          <button
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={14} />
            List
          </button>
        </div>
      </div>
      <div className="rw-metric-grid four">
        <Metric
          label="Audience size"
          value={filtered.length.toLocaleString()}
          note="Matching selected filters"
        />
        <Metric
          label="Average age"
          value={averageAge}
          note="Years · synthetic profiles"
        />
        <Metric
          label="Markets represented"
          value={String(new Set(filtered.map((p) => p.location)).size)}
          note="Cities across 3 regions"
        />
        <Metric
          label="Occupation groups"
          value={String(new Set(filtered.map((p) => p.role)).size)}
          note="Different working contexts"
        />
      </div>
      {view === "explore" ? (
        <>
          <div className="rw-population-layout">
            <section className="rw-panel population-plot">
              <div className="rw-panel-title">
                <Users size={16} />
                <h2>One population. Many perspectives.</h2>
                <span className="rw-tag">
                  {Math.min(360, filtered.length)} PROFILES SHOWN
                </span>
              </div>
              <svg
                className="population-dot-plot"
                viewBox="0 0 760 360"
                role="img"
                aria-label={`Visualization of ${Math.min(360, filtered.length)} synthetic profiles grouped by ${split}`}
              >
                <g>
                  {filtered.slice(0, 360).map((p, i) => {
                    const group = Math.max(
                      0,
                      groups.findIndex((g) => g.label === p[split]),
                    );
                    const columns = Math.min(3, groups.length || 1);
                    const x =
                      130 +
                      (group % columns) * 245 +
                      Math.cos(i * 2.399) * Math.sqrt((i % 60) + 1) * 11;
                    const y =
                      100 +
                      Math.floor(group / columns) * 145 +
                      Math.sin(i * 2.399) * Math.sqrt((i % 60) + 1) * 7;
                    return (
                      <circle
                        key={p.id}
                        cx={x}
                        cy={y}
                        r={i % 9 === 0 ? 4 : 2.8}
                        fill={colors[group % colors.length]}
                        opacity={0.45 + (i % 5) * 0.12}
                      >
                        <title>
                          {p.name} · {p[split]}
                        </title>
                      </circle>
                    );
                  })}
                </g>
                {groups.slice(0, 6).map((g, i) => (
                  <text
                    key={g.label}
                    x={130 + (i % 3) * 245}
                    y={160 + Math.floor(i / 3) * 145}
                    textAnchor="middle"
                  >
                    {g.label}
                  </text>
                ))}
              </svg>
            </section>
            <section className="rw-panel population-breakdown">
              <div className="rw-panel-title">
                <h2>Population breakdown</h2>
                <SlidersHorizontal size={14} />
              </div>
              <label className="rw-inline-label">
                Split by
                <select
                  value={split}
                  onChange={(e) => setSplit(e.target.value as typeof split)}
                >
                  <option value="income">Household income</option>
                  <option value="region">Region</option>
                  <option value="attitude">Adoption attitude</option>
                  <option value="occupation">Occupation</option>
                </select>
              </label>
              <div className="demographic-bars">
                {groups.map((g, i) => (
                  <div key={g.label}>
                    <span>
                      <i style={{ background: colors[i % colors.length] }} />
                      {g.label}
                      <strong>{g.count.toLocaleString()}</strong>
                    </span>
                    <div>
                      <i
                        style={{
                          width: `${(g.count / Math.max(1, filtered.length)) * 100}%`,
                          background: colors[i % colors.length],
                        }}
                      />
                    </div>
                    <small>
                      {((g.count / Math.max(1, filtered.length)) * 100).toFixed(
                        1,
                      )}
                      %
                    </small>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="rw-section-heading">
            <h2>Meet the perspectives</h2>
            <span>
              Fictional identities · {filtered.length.toLocaleString()} profiles
            </span>
          </div>
          <div className="rw-persona-grid">
            {filtered.slice(0, 8).map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                onSelect={() => onSelect(p)}
              />
            ))}
          </div>
        </>
      ) : (
        <section className="rw-panel no-padding">
          <div className="rw-table-scroll">
            <table className="rw-data-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Age</th>
                  <th>Occupation</th>
                  <th>Location</th>
                  <th>Household income</th>
                  <th>Attitude</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice(activePage * 25, (activePage + 1) * 25)
                  .map((p) => (
                    <tr key={p.id} onClick={() => onSelect(p)}>
                      <td>
                        <button
                          className="rw-person-cell"
                          onClick={() => onSelect(p)}
                        >
                          <Avatar persona={p} />
                          <span>
                            {p.name}
                            <small>{p.id}</small>
                          </span>
                        </button>
                      </td>
                      <td>{p.age}</td>
                      <td>{p.role}</td>
                      <td>{p.location}</td>
                      <td>{p.income}</td>
                      <td>
                        <span className="rw-tag">{p.attitude}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="rw-table-footer">
            <span>
              {filtered.length.toLocaleString()} profiles · page{" "}
              {activePage + 1} of {totalPages}
            </span>
            <div>
              <button
                className="rw-icon-button"
                aria-label="Previous page"
                disabled={activePage === 0}
                onClick={() => setPage(activePage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="rw-icon-button"
                aria-label="Next page"
                disabled={activePage >= totalPages - 1}
                onClick={() => setPage(activePage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
      {filtered.length === 0 && (
        <div className="rw-empty">
          No profiles match these filters. Try a broader audience.
        </div>
      )}
    </div>
  );
}

export function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rw-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
