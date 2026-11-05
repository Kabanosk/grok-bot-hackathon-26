export type Objective =
  | "Usability test"
  | "Concept validation"
  | "Pricing research";
export type Audience =
  | "Startup founders"
  | "Product teams"
  | "Everyday consumers";
export type StudyConfig = {
  product: string;
  url: string;
  description: string;
  objective: Objective;
  audience: Audience;
  participants: number;
};
export type Finding = {
  title: string;
  detail: string;
  severity: "High" | "Medium" | "Low";
};
export type Report = {
  config: StudyConfig;
  score: number;
  findings: Finding[];
  completedAt: string;
};

export const defaultConfig: StudyConfig = {
  product: "Orbit",
  url: "https://example.com",
  description:
    "A workspace that helps small teams organize projects and collaborate.",
  objective: "Usability test",
  audience: "Startup founders",
  participants: 48,
};

const findingsByObjective: Record<Objective, Finding[]> = {
  "Usability test": [
    {
      title: "Make the first step unmistakable",
      detail:
        "Sample personas hesitate between creating a project and inviting a teammate. Give the primary action more emphasis.",
      severity: "High",
    },
    {
      title: "Show value before asking for setup",
      detail:
        "A populated example project could help new users understand the workflow before completing onboarding.",
      severity: "Medium",
    },
    {
      title: "Explain what happens after the trial",
      detail:
        "A short note beside the trial button could answer questions about billing and cancellation.",
      severity: "Low",
    },
  ],
  "Concept validation": [
    {
      title: "Lead with the problem you solve",
      detail:
        "The sample audience responds better to a concrete customer outcome than a broad list of capabilities.",
      severity: "High",
    },
    {
      title: "Make the difference tangible",
      detail:
        "An example that compares the current workflow with your approach could make the concept easier to evaluate.",
      severity: "Medium",
    },
    {
      title: "Choose one initial use case",
      detail:
        "The concept spans several needs. A focused starting point could help customers recognize themselves.",
      severity: "Low",
    },
  ],
  "Pricing research": [
    {
      title: "Clarify what each plan includes",
      detail:
        "Sample personas want to understand usage limits and included features before comparing prices.",
      severity: "High",
    },
    {
      title: "Connect the price to a useful outcome",
      detail:
        "Explain the time or effort a typical customer could save. Validate those estimates with actual customers.",
      severity: "Medium",
    },
    {
      title: "Offer a low-commitment first step",
      detail:
        "A short trial or sample project could help customers assess value before choosing a paid plan.",
      severity: "Low",
    },
  ],
};

// Deterministic sample output for the frontend demo. No model or product URL is called.
export function createDemoReport(config: StudyConfig): Report {
  const audienceOffset: Record<Audience, number> = {
    "Startup founders": 0,
    "Product teams": 3,
    "Everyday consumers": -4,
  };
  const objectiveOffset: Record<Objective, number> = {
    "Usability test": 0,
    "Concept validation": -2,
    "Pricing research": -6,
  };
  return {
    config: { ...config },
    score:
      84 + audienceOffset[config.audience] + objectiveOffset[config.objective],
    findings: findingsByObjective[config.objective].map((finding) => ({
      ...finding,
    })),
    completedAt: new Date().toISOString(),
  };
}

export const sampleProfiles: Record<
  Audience,
  { initials: string; name: string; role: string; tone: string }[]
> = {
  "Startup founders": [
    {
      initials: "AL",
      name: "Alex L.",
      role: "Early-stage founder",
      tone: "amber",
    },
    {
      initials: "SK",
      name: "Sarah K.",
      role: "Bootstrapped founder",
      tone: "sage",
    },
    {
      initials: "JM",
      name: "James M.",
      role: "Technical co-founder",
      tone: "rose",
    },
    { initials: "RN", name: "Riya N.", role: "Solo founder", tone: "stone" },
  ],
  "Product teams": [
    {
      initials: "ML",
      name: "Morgan L.",
      role: "Product manager",
      tone: "amber",
    },
    {
      initials: "JT",
      name: "Jamie T.",
      role: "Product designer",
      tone: "sage",
    },
    { initials: "AK", name: "Avery K.", role: "UX researcher", tone: "rose" },
    {
      initials: "DS",
      name: "Drew S.",
      role: "Engineering lead",
      tone: "stone",
    },
  ],
  "Everyday consumers": [
    {
      initials: "CP",
      name: "Casey P.",
      role: "Frequent online shopper",
      tone: "amber",
    },
    {
      initials: "RL",
      name: "Robin L.",
      role: "Budget-conscious buyer",
      tone: "sage",
    },
    {
      initials: "TS",
      name: "Taylor S.",
      role: "Mobile-first customer",
      tone: "rose",
    },
    {
      initials: "QN",
      name: "Quinn N.",
      role: "Occasional subscriber",
      tone: "stone",
    },
  ],
};
