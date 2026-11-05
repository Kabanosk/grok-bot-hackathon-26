import type { Persona, Reaction, ResearchReport, Study } from "./contracts";

export type SyntheticPerson = Persona & {
  region: string;
  income: string;
  occupation: string;
  willingness: number;
  adoption: number;
};
export const incomeBands = [
  "Under $25k",
  "$25–50k",
  "$50–75k",
  "$75–100k",
  "$100–150k",
  "$150k+",
];
const firstNames = [
  "Alex",
  "Maya",
  "James",
  "Sofia",
  "Riya",
  "Daniel",
  "Emma",
  "Noah",
  "Olivia",
  "Liam",
  "Amara",
  "Lucas",
  "Zara",
  "Leo",
  "Ava",
  "Ethan",
  "Isla",
  "Arjun",
  "Nina",
  "Oscar",
  "Yuki",
  "Sam",
  "Elena",
  "Kai",
  "Grace",
  "Adam",
  "Chloe",
  "Ibrahim",
  "Mila",
  "Theo",
  "Freya",
  "Hugo",
];
const lastNames = [
  "Rivera",
  "Chen",
  "Okafor",
  "Martins",
  "Patel",
  "Kim",
  "Wilson",
  "Garcia",
  "Anderson",
  "Taylor",
  "Singh",
  "Nguyen",
  "Williams",
  "Brown",
  "Davis",
  "Thomas",
  "Moore",
  "Jackson",
  "Lee",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Walker",
  "Hall",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Green",
  "Adams",
];
const cities = [
  "New York, US",
  "London, UK",
  "Berlin, DE",
  "Toronto, CA",
  "Austin, US",
  "Paris, FR",
  "Amsterdam, NL",
  "Warsaw, PL",
  "San Francisco, US",
  "Sydney, AU",
  "Singapore, SG",
  "Stockholm, SE",
];
const regions = [
  "North America",
  "Europe",
  "Europe",
  "North America",
  "North America",
  "Europe",
  "Europe",
  "Europe",
  "North America",
  "Asia Pacific",
  "Asia Pacific",
  "Europe",
];
const occupations = [
  "Startup founder",
  "Product manager",
  "Software engineer",
  "Designer",
  "Marketing manager",
  "Business owner",
  "Consultant",
  "Student",
  "Operations lead",
  "Researcher",
  "Sales manager",
  "Finance specialist",
];
export function hash(text: string): number {
  let value = 2166136261;
  for (const c of text) {
    value ^= c.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
function random(seed: number) {
  return (hash(String(seed)) % 10000) / 10000;
}

export function makePopulation(size = 12_000): SyntheticPerson[] {
  return Array.from({ length: size }, (_, i) => {
    const age = 20 + Math.floor(random(i * 13 + 7) * 48);
    const city = Math.floor(random(i * 3 + 5) * cities.length);
    const incomeIndex = Math.min(5, Math.floor(random(i * 11 + 2) * 6));
    const occupation =
      occupations[Math.floor(random(i * 17 + 3) * occupations.length)];
    const attitude = (["Early adopter", "Pragmatist", "Skeptic"] as const)[
      Math.floor(random(i * 23 + 8) * 3)
    ];
    return {
      id: `sample-${i + 1}`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
      age,
      role: occupation,
      occupation,
      location: cities[city],
      region: regions[city],
      income: incomeBands[incomeIndex],
      bio: `${age}-year-old ${occupation.toLowerCase()} based in ${cities[city].split(",")[0]}.`,
      motivation:
        attitude === "Early adopter"
          ? "Find a better approach and try new capabilities early."
          : attitude === "Pragmatist"
            ? "Save time with something reliable and easy to adopt."
            : "See credible evidence of value before making a commitment.",
      frustration:
        attitude === "Skeptic"
          ? "Opaque pricing and promises without proof."
          : attitude === "Pragmatist"
            ? "Extra setup and workflows that add effort."
            : "Slow workflows and products that constrain experimentation.",
      attitude,
      sourceIds: [],
      weight: 1,
      willingness: Math.round(
        8 +
          incomeIndex * 8 +
          random(i * 31 + 1) * 54 +
          (occupation === "Startup founder" ? 35 : 0),
      ),
      adoption: Math.round(
        25 +
          random(i * 37 + 4) * 55 +
          (attitude === "Early adopter"
            ? 12
            : attitude === "Skeptic"
              ? -10
              : 0),
      ),
    };
  });
}

export function distribution(
  people: SyntheticPerson[],
  field: "region" | "income" | "attitude" | "occupation",
) {
  const counts = new Map<string, number>();
  for (const person of people)
    counts.set(person[field], (counts.get(person[field]) ?? 0) + 1);
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count,
  );
}

export function sampleReaction(
  person: Persona,
  study: Study,
  question = study.question,
): Reaction {
  const factor = hash(`${study.product}:${question}:${person.id}`) % 100;
  const score = Math.min(
    95,
    Math.max(
      12,
      factor * 0.48 +
        (person.attitude === "Early adopter"
          ? 48
          : person.attitude === "Pragmatist"
            ? 35
            : 22),
    ),
  );
  const positive = score >= 68,
    negative = score < 42;
  const product = study.product || "this concept";
  const reaction = positive
    ? `I can see ${product} fitting into my workflow. As a ${person.role.toLowerCase()}, I'd want to try one concrete use case and see the outcome before expanding.`
    : negative
      ? `I'm not convinced ${product} would replace what I already use. I'd need a clearer reason to switch, transparent pricing, and evidence it solves my particular problem.`
      : `There is something useful in ${product}, but I have questions about the setup and ongoing cost. A guided example would help me judge it.`;
  return {
    reaction,
    sentiment: positive ? "positive" : negative ? "negative" : "mixed",
    score: Math.round(score),
    frictionPoints: [
      person.frustration,
      negative
        ? "The benefit of switching needs to be clearer."
        : "The first useful outcome should be easier to reach.",
    ],
    recommendation: positive
      ? "Offer a focused trial with a useful example."
      : "Make the value, setup and price easy to evaluate.",
    sourceIds: [],
    taskCompleted: null,
    observations: [],
  };
}

export function makeSyntheticReport(
  study: Study,
  people: SyntheticPerson[],
): ResearchReport {
  const source = people.length ? people : makePopulation(100);
  const stride = Math.max(1, Math.floor(source.length / study.participants));
  const personas = Array.from({ length: study.participants }, (_, i) => ({
    ...source[(i * stride) % source.length],
    id: `agent-${i + 1}`,
  }));
  const responses = personas.map((persona) => ({
    agentId: persona.id,
    reaction: sampleReaction(persona, study),
  }));
  return {
    id: `synthetic-${crypto.randomUUID()}`,
    study,
    personas,
    responses,
    failures: [],
    model: "Synthetic sandbox · deterministic sample data",
    completedAt: new Date().toISOString(),
    productContext: {
      fetched: false,
      title: study.product,
      excerpt:
        "Synthetic sandbox: no website was visited and no cloud Bot ran.",
      url: study.url,
    },
    marketEvidence: {
      segment: study.audience,
      benchmarks: [],
      gaps: [
        "No real market sources are used in the synthetic sandbox.",
        "Run a cloud Bot study to research product-specific benchmarks.",
      ],
    },
    synthesis: {
      headline: `A first look at ${study.product}.`,
      summary: `This synthetic study illustrates how ${study.participants} different perspectives can be organized into a decision brief. These responses do not validate market demand or predict real conversion.`,
      findings: [
        {
          title: "Make the value concrete",
          detail:
            "The sample responses reward a specific use case and an easy way to try it. In a real study, connect this theme to observed customer evidence.",
          severity: "High",
          agentIds: personas.slice(0, 3).map((p) => p.id),
        },
        {
          title: "Reduce the cost of getting started",
          detail:
            "Sample pragmatists ask for a guided first experience, transparent pricing and low setup effort.",
          severity: "Medium",
          agentIds: personas
            .filter((p) => p.attitude === "Pragmatist")
            .map((p) => p.id),
        },
        {
          title: "Keep skeptical perspectives visible",
          detail:
            "Averages can hide resistance. Inspect the negative responses and validate the reasons with actual target customers.",
          severity: "Medium",
          agentIds: responses
            .filter((r) => r.reaction.sentiment === "negative")
            .map((r) => r.agentId),
        },
      ],
      nextSteps: [
        "Import customer research or feedback.",
        "Connect the Grok Bot coordinator to research current market evidence.",
        "Compare model predictions with labeled real outcomes before choosing decision thresholds.",
      ],
      limitations: [
        "Entirely synthetic data, not real people or observed customer behavior.",
        "Appeal scores are illustrative and are not purchase or checkout rates.",
        "No measured predictive accuracy, false-positive rate or false-negative rate.",
      ],
    },
  };
}
