#!/usr/bin/env node
// Cohort CLI — how Grok Bot ("Cohort Master") drives the live market panel.
// Usage:
//   node cohort/bin/cohort.mjs reset '{"product":"...","market":"Poland","description":"...","objective":"Pricing research"}'
//   node cohort/bin/cohort.mjs segments '[{"id":"s1","name":"...","share":12,"description":"..."}]'
//   node cohort/bin/cohort.mjs personas @personas.json        (@file reads JSON from a file)
//   node cohort/bin/cohort.mjs reactions '[...]' | debate '[...]' | report '{...}'
//   node cohort/bin/cohort.mjs log "Cohort Master: recruited 32 personas"
//   node cohort/bin/cohort.mjs load cohort/server/seed-poland.json   (load a full cohort, demo fallback)
//   node cohort/bin/cohort.mjs status
// Env: COHORT_URL (default http://127.0.0.1:5173)
import { readFileSync } from "node:fs";

const base = (process.env.COHORT_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const [kind, ...rest] = process.argv.slice(2);
const arg = rest.join(" ");

function payload() {
  if (kind === "log") return JSON.stringify({ text: arg });
  if (kind === "load") return readFileSync(arg.replace(/^@/, ""), "utf8");
  if (!arg) return "{}";
  return arg.startsWith("@") ? readFileSync(arg.slice(1), "utf8") : arg;
}

if (!kind || kind === "help" || kind === "--help") {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).join("\n"));
  process.exit(0);
}

try {
  if (kind === "status") {
    const s = await (await fetch(`${base}/api/market`)).json();
    console.log(JSON.stringify({ study: s.study, stats: s.stats }, null, 2));
  } else {
    const body = payload();
    JSON.parse(body); // fail fast on invalid JSON
    const res = await fetch(`${base}/api/market/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || res.statusText);
    console.log(`ok ${kind}: ${out.stats.personas} personas, ${out.stats.answered} answered, weighted score ${out.stats.weightedScore ?? "-"}`);
  }
} catch (e) {
  console.error(`cohort ${kind} failed: ${e.message}`);
  process.exit(1);
}
