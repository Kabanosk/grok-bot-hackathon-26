import { useRef, useState } from "react";
import { ArrowDownToLine, BarChart3, FileUp, ShieldCheck } from "lucide-react";

type Case = { score: number; outcome: boolean };

export function Calibration() {
  const [cases, setCases] = useState<Case[]>([]);
  const [accept, setAccept] = useState(70);
  const [reject, setReject] = useState(35);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0,
    abstain = 0;
  for (const row of cases) {
    if (row.score >= accept) {
      if (row.outcome) tp++;
      else fp++;
    } else if (row.score <= reject) {
      if (row.outcome) fn++;
      else tn++;
    } else abstain++;
  }
  const percent = (value: number, total: number) =>
    total ? `${Math.round((value / total) * 100)}%` : "—";
  async function importCases(selected: File) {
    try {
      if (selected.size > 500_000)
        throw new Error("Use a CSV smaller than 500 KB.");
      const lines = (await selected.text()).trim().split(/\r?\n/);
      if (lines[0].trim().toLowerCase().replace(/\s/g, "") !== "score,outcome")
        throw new Error(
          "The CSV header must be score,outcome. Scores are 0–100; outcomes are 1 (succeeded) or 0 (failed).",
        );
      const rows = lines
        .slice(1)
        .filter(Boolean)
        .map((line) => {
          const [rawScore, rawOutcome, extra] = line
            .split(",")
            .map((s) => s.trim());
          const score = Number(rawScore);
          if (
            extra !== undefined ||
            rawScore === "" ||
            !Number.isFinite(score) ||
            score < 0 ||
            score > 100 ||
            !["0", "1"].includes(rawOutcome)
          )
            throw new Error(
              "Each row must contain a 0–100 score and a 0 or 1 outcome.",
            );
          return { score, outcome: rawOutcome === "1" };
        });
      if (!rows.length)
        throw new Error("Add at least one labeled historical case.");
      setCases(rows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The CSV could not be read.");
    }
  }
  return (
    <div className="rw-calibration">
      <div className="rw-page-heading">
        <div>
          <span className="rw-eyebrow">MEASURE THE MISTAKES</span>
          <h1>Calibrate the signal.</h1>
          <p>
            Compare previous model scores with real outcomes before relying on a
            decision threshold.
          </p>
        </div>
        <button
          className="rw-button secondary"
          onClick={() => file.current?.click()}
        >
          <FileUp size={15} />
          Import labeled outcomes
        </button>
        <input
          hidden
          ref={file}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void importCases(selected);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <div role="alert" className="rw-error">
          {error}
        </div>
      )}
      <div className="rw-calibration-layout">
        <section className="rw-panel">
          <div className="rw-panel-title">
            <ShieldCheck size={16} />
            <h2>Decision boundaries</h2>
            <span className="rw-tag">EXPLICIT UNCERTAINTY</span>
          </div>
          <p className="rw-muted">
            Strong signals can move forward. Weak signals can stop. Everything
            between the thresholds needs more evidence.
          </p>
          <label className="rw-range-label">
            Move forward at <strong>{accept}/100</strong>
            <input
              type="range"
              min={reject + 1}
              max="100"
              value={accept}
              onChange={(e) => setAccept(Number(e.target.value))}
            />
          </label>
          <label className="rw-range-label">
            Reconsider at <strong>{reject}/100</strong>
            <input
              type="range"
              min="0"
              max={accept - 1}
              value={reject}
              onChange={(e) => setReject(Number(e.target.value))}
            />
          </label>
          <div className="threshold-track">
            <span style={{ width: `${reject}%` }}>Reconsider</span>
            <span style={{ width: `${accept - reject}%` }}>More evidence</span>
            <span style={{ width: `${100 - accept}%` }}>Proceed</span>
          </div>
          <p className="rw-fineprint">
            Thresholds are user-defined. Adjusting them here does not train the
            Bots or establish predictive validity.
          </p>
        </section>
        <section className="rw-panel">
          <div className="rw-panel-title">
            <BarChart3 size={16} />
            <h2>Historical errors</h2>
            <span className="rw-tag">{cases.length} LABELED CASES</span>
          </div>
          <div className="confusion-grid">
            <div>
              <strong>{cases.length ? tp : "—"}</strong>
              <span>True positives</span>
              <small>Positive signal, real success</small>
            </div>
            <div className="confusion-error">
              <strong>{cases.length ? fp : "—"}</strong>
              <span>False positives</span>
              <small>Positive signal, real failure</small>
            </div>
            <div className="confusion-error">
              <strong>{cases.length ? fn : "—"}</strong>
              <span>False negatives</span>
              <small>Negative signal, real success</small>
            </div>
            <div>
              <strong>{cases.length ? tn : "—"}</strong>
              <span>True negatives</span>
              <small>Negative signal, real failure</small>
            </div>
          </div>
          <div className="calibration-metrics">
            <span>
              FPR <strong>{percent(fp, fp + tn)}</strong>
            </span>
            <span>
              FNR <strong>{percent(fn, fn + tp)}</strong>
            </span>
            <span>
              Decision coverage{" "}
              <strong>{percent(cases.length - abstain, cases.length)}</strong>
            </span>
          </div>
          <p className="rw-fineprint">
            Rates cover decided cases; uncertain cases are excluded. Coverage
            shows how many were decided. Missing classes show “—”.
          </p>
        </section>
      </div>
      <section className="rw-panel calibration-empty">
        <ArrowDownToLine size={24} />
        <div>
          <h3>
            {cases.length
              ? `${cases.length} real outcome labels loaded`
              : "Bring the ground truth."}
          </h3>
          <p>
            Import a CSV with columns <code>score,outcome</code>. Use a
            previously recorded model score and a real success (1) or failure
            (0). Evaluate a separate held-out cohort after choosing thresholds.
          </p>
          <p className="rw-fineprint">
            No false-positive or false-negative rate is reported without your
            labeled data. Imported labels stay in this browser session.
          </p>
        </div>
      </section>
    </div>
  );
}
