import { expect, test } from "@playwright/test";

const body = {
  product: "Orbit",
  url: "",
  description: "A workspace for small teams.",
  objective: "Usability test",
  audience: "Startup founders",
  participants: 48,
};

test("mock swarm streams personas, reactions, a debate and a report", async ({ request }) => {
  test.skip(!!process.env.XAI_API_KEY, "mock-mode check");
  const started = Date.now();
  const res = await request.post("/api/study", { data: body });
  expect(res.ok()).toBe(true);
  const events = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
  const count = (t: string) => events.filter((e) => e.type === t).length;
  expect(count("persona")).toBe(8);
  expect(count("reaction")).toBe(8);
  expect(count("debate")).toBe(8);
  expect(events.some((e) => e.type === "debate" && e.changed)).toBe(true);
  const report = events.find((e) => e.type === "report").report;
  expect(report.voices).toHaveLength(8);
  expect(report.breakdown.yes + report.breakdown.maybe + report.breakdown.no).toBe(8);
  expect(Date.now() - started).toBeLessThan(5000);
});

test("rejects an invalid study", async ({ request }) => {
  const res = await request.post("/api/study", { data: { ...body, participants: 7 } });
  expect(res.status()).toBe(400);
});
