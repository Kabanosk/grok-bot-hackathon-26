import { useMemo, useState } from "react";
import { ArrowRight, DollarSign, TrendingUp } from "lucide-react";
import type { SyntheticPerson } from "./synthetic";
import { Metric } from "./PopulationExplorer";

export function PriceLab({
  people,
  onResearch,
}: {
  people: SyntheticPerson[];
  onResearch: () => void;
}) {
  const [price, setPrice] = useState(39);
  const [region, setRegion] = useState("All regions");
  const selected = useMemo(
    () => people.filter((p) => region === "All regions" || p.region === region),
    [people, region],
  );
  const series = Array.from({ length: 30 }, (_, i) => {
    const p = (i + 1) * 5;
    const demand = selected.filter((person) => person.willingness >= p).length;
    return { price: p, demand, revenue: p * demand };
  });
  const optimum = series.reduce((a, b) => (a.revenue > b.revenue ? a : b));
  const buyers = selected.filter((p) => p.willingness >= price).length;
  const revenue = price * buyers;
  const maxRevenue = Math.max(...series.map((s) => s.revenue), 1);
  const path = series
    .map(
      (s, i) =>
        `${i ? "L" : "M"} ${40 + i * 23.7} ${280 - (s.revenue / maxRevenue) * 230}`,
    )
    .join(" ");
  return (
    <div>
      <div className="rw-page-heading">
        <div>
          <span className="rw-eyebrow">THE VALUE OF THE RIGHT PRICE</span>
          <h1>Pricing intelligence</h1>
          <p>
            Explore price sensitivity, willingness to pay, and the shape of
            demand.
          </p>
        </div>
        <button className="rw-button primary" onClick={onResearch}>
          Run pricing research
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="rw-banner subtle">
        <span className="rw-dot" />
        <strong>Synthetic pricing model</strong>
        <span>
          Illustrative willingness-to-pay data. These are not measured human
          conversion or revenue forecasts.
        </span>
      </div>
      <div className="rw-metric-grid four">
        <Metric
          label="Price being explored"
          value={`$${price}`}
          note="Per month · adjustable below"
        />
        <Metric
          label="Modeled willingness to pay"
          value={`${((buyers / Math.max(1, selected.length)) * 100).toFixed(1)}%`}
          note={`${buyers.toLocaleString()} fictional buyers`}
        />
        <Metric
          label="Illustrative monthly revenue"
          value={`$${Math.round(revenue / 1000)}k`}
          note="All matching synthetic profiles"
        />
        <Metric
          label="Model revenue peak"
          value={`$${optimum.price}`}
          note="Computed from this sample dataset"
        />
      </div>
      <div className="rw-pricing-layout">
        <section className="rw-panel">
          <div className="rw-panel-title">
            <TrendingUp size={16} />
            <h2>Revenue sensitivity</h2>
            <span className="rw-tag">
              {selected.length.toLocaleString()} SAMPLE PROFILES
            </span>
          </div>
          <svg
            className="price-chart"
            viewBox="0 0 780 330"
            role="img"
            aria-label="Illustrative revenue sensitivity by monthly price"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1="40"
                  x2="745"
                  y1={50 + i * 57.5}
                  y2={50 + i * 57.5}
                  className="chart-gridline"
                />
                <text x="33" y={54 + i * 57.5} textAnchor="end">
                  {100 - i * 25}%
                </text>
              </g>
            ))}
            <path d={`${path} L727 280 L40 280Z`} fill="#18784e0b" />
            <path
              d={path}
              fill="none"
              stroke="var(--rw-green)"
              strokeWidth="2.5"
            />
            {series.map((s, i) => (
              <circle
                key={s.price}
                cx={40 + i * 23.7}
                cy={280 - (s.revenue / maxRevenue) * 230}
                r={s.price === optimum.price ? 5 : 3}
                fill={s.price === optimum.price ? "var(--rw-green)" : "white"}
                stroke="var(--rw-green)"
                strokeWidth="1.5"
              >
                <title>
                  ${s.price}/mo · {s.demand.toLocaleString()} fictional buyers ·
                  ${s.revenue.toLocaleString()} modeled revenue
                </title>
              </circle>
            ))}
            {[0, 5, 10, 15, 20, 25, 29].map((i) => (
              <text key={i} x={40 + i * 23.7} y="310" textAnchor="middle">
                ${series[i].price}
              </text>
            ))}
          </svg>
          <p className="rw-fineprint">
            Relative to the highest modeled revenue in this synthetic cohort.
            Hover a point to inspect its values.
          </p>
        </section>
        <section className="rw-panel price-controls">
          <div className="rw-panel-title">
            <DollarSign size={16} />
            <h2>Explore a price point</h2>
          </div>
          <div className="price-big">
            ${price}
            <span>/ month</span>
          </div>
          <input
            aria-label="Monthly price"
            type="range"
            min="5"
            max="150"
            step="1"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <div className="range-endpoints">
            <span>$5</span>
            <span>$150</span>
          </div>
          <label>
            Audience segment
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {["All regions", "North America", "Europe", "Asia Pacific"].map(
                (r) => (
                  <option key={r}>{r}</option>
                ),
              )}
            </select>
          </label>
          <div className="price-breakdown">
            <span>
              Would consider at this price
              <strong>{buyers.toLocaleString()}</strong>
            </span>
            <span>
              Below modeled willingness
              <strong>{(selected.length - buyers).toLocaleString()}</strong>
            </span>
            <span>
              Total cohort<strong>{selected.length.toLocaleString()}</strong>
            </span>
          </div>
          <p className="rw-fineprint">
            Connect a cloud Bot study to investigate product-specific price
            anchors and comparable real market evidence.
          </p>
        </section>
      </div>
    </div>
  );
}
