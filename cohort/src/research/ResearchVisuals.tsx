import { useId } from "react";
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  MessageSquare,
  Users,
} from "lucide-react";
import type { AgentRun, Persona, Reaction } from "./contracts";

export function Avatar({
  persona,
  size = "",
}: {
  persona: Persona;
  size?: string;
}) {
  return (
    <span
      className={`person-avatar ${persona.attitude === "Skeptic" ? "rose" : persona.attitude === "Pragmatist" ? "sage" : "amber"} ${size}`}
    >
      {persona.name
        .split(" ")
        .slice(0, 2)
        .map((s) => s[0])
        .join("")}
    </span>
  );
}

export function PopulationCloud({
  personas,
  agents = [],
  activeId,
  onSelect,
}: {
  personas: Persona[];
  agents?: AgentRun[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const glowId = useId();
  const points = personas.map((persona, i) => {
    const angle = i * 2.399963 + 0.45;
    const radius = 18 + Math.sqrt((i + 1) / personas.length) * 25;
    return {
      persona,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius * 0.83,
    };
  });
  return (
    <div className="population-cloud">
      <svg viewBox="0 0 600 390" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0" stopColor="#c9a263" stopOpacity=".13" />
            <stop offset="1" stopColor="#c9a263" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="195" rx="290" ry="190" fill={`url(#${glowId})`} />
        <g className="cloud-grid">
          <ellipse cx="300" cy="195" rx="240" ry="133" />
          <ellipse cx="300" cy="195" rx="160" ry="133" />
          <ellipse cx="300" cy="195" rx="80" ry="133" />
          <ellipse cx="300" cy="195" rx="240" ry="75" />
          <path d="M60 195h480M300 62v266" />
        </g>
        {points.map(({ persona, x, y }) => (
          <line
            key={persona.id}
            className={
              agents.find((a) => a.persona.id === persona.id)?.status ===
              "complete"
                ? "cloud-connection complete"
                : "cloud-connection"
            }
            x1="300"
            y1="195"
            x2={x * 6}
            y2={y * 3.9}
          />
        ))}
      </svg>
      <div className="cloud-center">
        <strong>{personas.length}</strong>
        <span>PERSONAS</span>
      </div>
      {points.map(({ persona, x, y }) => {
        const agent = agents.find((a) => a.persona.id === persona.id);
        return (
          <button
            key={persona.id}
            title={`${persona.name} · ${persona.role}`}
            onClick={() => onSelect(persona.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={`cloud-person ${activeId === persona.id ? "selected" : ""} ${agent?.status ?? ""}`}
            aria-label={`View ${persona.name}, ${persona.role}`}
          >
            <Avatar persona={persona} />
            <span className="cloud-person-label">
              {persona.name.split(" ")[0]}
              {agent?.status === "complete" && <Check size={10} />}
              {agent?.status === "running" && (
                <LoaderCircle size={10} className="spinning" />
              )}
            </span>
          </button>
        );
      })}
      <span className="cloud-corner top">
        <span className="status-dot" />
        {personas.length} unique perspectives
      </span>
      <span className="cloud-corner bottom">
        <Users size={12} />
        Independent by design
      </span>
    </div>
  );
}

export function PersonaCard({
  persona,
  selected = false,
  reaction,
  onSelect,
}: {
  persona: Persona;
  selected?: boolean;
  reaction?: Reaction;
  onSelect: () => void;
}) {
  return (
    <button
      className={`research-persona-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div>
        <Avatar persona={persona} />
        <span
          className={`attitude ${persona.attitude.toLowerCase().replace(" ", "-")}`}
        >
          {persona.attitude}
        </span>
      </div>
      <h3>
        {persona.name}
        <span>{persona.age}</span>
      </h3>
      <p>
        {persona.role} <span>·</span> {persona.location}
      </p>
      <div className="persona-bio">{persona.bio}</div>
      <div className="persona-card-footer">
        {reaction ? (
          <span className={`sentiment ${reaction.sentiment}`}>
            {reaction.sentiment}
          </span>
        ) : (
          <span>
            {persona.sourceIds.length
              ? `${persona.sourceIds.length} research sources`
              : "AI-generated persona"}
          </span>
        )}
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}

export function AgentCard({
  agent,
  onSelect,
}: {
  agent: AgentRun;
  onSelect: () => void;
}) {
  return (
    <button className={`live-agent-card ${agent.status}`} onClick={onSelect}>
      <div className="agent-card-heading">
        <Avatar persona={agent.persona} />
        <span>
          <strong>{agent.persona.name}</strong>
          <small>{agent.persona.role}</small>
        </span>
        <span className={`agent-status ${agent.status}`}>
          {agent.status === "running" ? (
            <>
              <LoaderCircle size={11} className="spinning" />
              Working
            </>
          ) : agent.status === "complete" ? (
            <>
              <Check size={11} />
              Complete
            </>
          ) : agent.status === "error" ? (
            "Interrupted"
          ) : (
            "Queued"
          )}
        </span>
      </div>
      <p className={agent.preview ? "" : "agent-waiting"}>
        {agent.error ??
          agent.reaction?.reaction ??
          (agent.preview || "Waiting for an independent perspective…")}
      </p>
      {agent.reaction && (
        <div className="agent-card-bottom">
          <span className={`sentiment ${agent.reaction.sentiment}`}>
            {agent.reaction.sentiment}
          </span>
          <span>
            <MessageSquare size={11} />
            Explore response
          </span>
        </div>
      )}
    </button>
  );
}
