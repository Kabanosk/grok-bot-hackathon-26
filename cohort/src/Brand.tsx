export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={`logo ${small ? "logo-small" : ""}`}>
      <svg viewBox="0 0 32 36" fill="none" aria-hidden="true">
        <path d="m16 1 13 7.5L16 16 3 8.5Z" fill="currentColor" />
        <path d="m1 13 12 7v15L1 28Z" fill="currentColor" opacity=".7" />
        <path d="m31 13-12 7v15l12-7Z" fill="currentColor" opacity=".9" />
      </svg>
      <span>
        cohort<span className="logo-period">.</span>
      </span>
    </span>
  );
}

export function Swarm({
  compact = false,
  running = false,
}: {
  compact?: boolean;
  running?: boolean;
}) {
  const dots = Array.from({ length: 48 }, (_, i) => {
    const angle = i * 2.399963;
    const radius = 18 + Math.sqrt(i / 48) * 121;
    return {
      x: 220 + Math.cos(angle) * radius * 1.29,
      y: 123 + Math.sin(angle) * radius * 0.64,
      size: i % 9 === 0 ? 4 : 2.4,
      index: i,
    };
  });
  return (
    <svg
      className={`swarm ${compact ? "swarm-compact" : ""} ${running ? "is-running" : ""}`}
      viewBox="0 0 440 245"
      role="img"
      aria-label="Illustration of 48 simulated customer agents connected in a swarm"
    >
      <defs>
        <radialGradient id={compact ? "glow-small" : "glow"}>
          <stop offset="0%" stopColor="var(--accent)" stopOpacity=".11" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="220"
        cy="123"
        rx="205"
        ry="119"
        fill={`url(#${compact ? "glow-small" : "glow"})`}
      />
      <g stroke="currentColor" fill="none" className="swarm-orbits">
        <ellipse cx="220" cy="123" rx="174" ry="75" />
        <ellipse
          cx="220"
          cy="123"
          rx="131"
          ry="75"
          transform="rotate(-25 220 123)"
        />
        <ellipse
          cx="220"
          cy="123"
          rx="131"
          ry="75"
          transform="rotate(25 220 123)"
        />
        <ellipse cx="220" cy="123" rx="78" ry="90" />
        <path d="M46 123h348M220 33v180" />
      </g>
      <g className="swarm-links" stroke="var(--accent)">
        {dots
          .filter((_, i) => i % 3 === 0)
          .map((d) => (
            <path key={d.index} d={`M220 123  ${d.x} ${d.y}`} />
          ))}
      </g>
      {dots.map((d) => (
        <g
          key={d.index}
          className="swarm-dot"
          style={{ animationDelay: `${d.index * -0.17}s` }}
        >
          <circle
            cx={d.x}
            cy={d.y}
            r={d.size + 4}
            fill="var(--accent)"
            opacity=".07"
          />
          <circle
            cx={d.x}
            cy={d.y}
            r={d.size}
            fill="var(--accent)"
            opacity={d.index % 3 === 0 ? 0.95 : 0.5}
          />
        </g>
      ))}
      <circle
        cx="220"
        cy="123"
        r="23"
        fill="var(--surface-raised)"
        stroke="var(--border-strong)"
      />
      <path
        d="m220 109 12 7-12 7-12-7Zm-11 12 9 5v12l-9-5Zm22 0-9 5v12l9-5Z"
        fill="var(--accent)"
      />
      {!compact && (
        <>
          <rect
            x="295"
            y="47"
            width="107"
            height="29"
            rx="6"
            fill="var(--bg)"
            stroke="var(--border)"
          />
          <circle cx="308" cy="61.5" r="3" fill="var(--accent)" />
          <text
            x="318"
            y="65"
            fill="var(--muted)"
            fontSize="9.5"
            fontFamily="inherit"
          >
            48 unique perspectives
          </text>
          <rect
            x="27"
            y="170"
            width="113"
            height="29"
            rx="6"
            fill="var(--bg)"
            stroke="var(--border)"
          />
          <circle cx="40" cy="184.5" r="3" fill="var(--accent)" />
          <text
            x="50"
            y="188"
            fill="var(--muted)"
            fontSize="9.5"
            fontFamily="inherit"
          >
            One collective insight
          </text>
        </>
      )}
    </svg>
  );
}
