import type {
  Connection,
  ResearchEvent,
  ResearchReport,
  Persona,
  Study,
} from "./contracts";

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    `/api/${path}`,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "The request could not be completed.");
  return data as T;
}

export function getConnection() {
  return api<Connection>("connection");
}

export async function streamResearch(
  path: string,
  body: unknown,
  onEvent: (event: ResearchEvent) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `The server returned ${response.status}.`);
  }
  if (!response.body)
    throw new Error("Your browser could not open the live response.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminal = false;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event: ResearchEvent = JSON.parse(line);
    if (event.type === "error") throw new Error(event.message);
    if (
      event.type === "report" ||
      event.type === "chat.complete" ||
      (path === "population" && event.type === "population")
    )
      terminal = true;
    onEvent(event);
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let boundary: number;
      while ((boundary = buffer.indexOf("\n")) >= 0) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 1);
      }
      if (done) break;
    }
    consume(buffer);
    if (!terminal)
      throw new Error(
        "The connection ended before the operation completed. Please try again.",
      );
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export function downloadReport(report: ResearchReport) {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            ...report,
            provenance:
              "Live xAI model responses from AI personas. These are simulated perspectives, not measured human behavior.",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `cohort-${report.study.product.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-research.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type SavedPopulation = {
  personas: Persona[];
  audience: string;
  sourceIds: string[];
};
export type WorkspaceData = {
  studies: ResearchReport[];
  sources: Study["sources"];
  population: SavedPopulation | null;
};
const storageKey = "cohort-workspace-v2";
export function loadWorkspace(): WorkspaceData {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved && Array.isArray(saved.studies) && Array.isArray(saved.sources))
      return { ...saved, population: saved.population ?? null };
  } catch {
    /* A private browser or damaged local save starts a fresh workspace. */
  }
  return { studies: [], sources: [], population: null };
}
export function saveWorkspace(data: WorkspaceData): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
