/**
 * Shotpot brand mark — a full shot glass with a jackpot spark.
 * "Shot" (the drink) + "pot" (jackpot). Self-contained SVG, no deps.
 *
 * <ShotpotLogo />            → icon badge only
 * <ShotpotLogo withWordmark />→ horizontal lockup (icon + "Shotpot")
 */

export function ShotpotLogo({
  size = 34,
  withWordmark = false,
  wordmarkColor = "#fff8e8",
  title = "Shotpot",
}: {
  size?: number;
  withWordmark?: boolean;
  wordmarkColor?: string;
  title?: string;
}) {
  const uid = `sp${size}${withWordmark ? "w" : ""}`;
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}-badge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4d98f" />
          <stop offset="0.5" stopColor="#c89a4a" />
          <stop offset="1" stopColor="#7a5826" />
        </linearGradient>
        <linearGradient id={`${uid}-liquid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa657" />
          <stop offset="1" stopColor="#c81e35" />
        </linearGradient>
      </defs>

      {/* Badge */}
      <rect x="1" y="1" width="46" height="46" rx="12" fill={`url(#${uid}-badge)`} />
      <rect
        x="1.75" y="1.75" width="44.5" height="44.5" rx="11.25"
        fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9"
      />

      {/* Jackpot spark */}
      <path
        d="M35.7 8.6 L36.85 11.65 L39.9 12.8 L36.85 13.95 L35.7 17 L34.55 13.95 L31.5 12.8 L34.55 11.65 Z"
        fill="#fff4d4"
      />

      {/* Shot glass — full of liquid */}
      <path
        d="M14.6 17 L33.4 17 L30 35.4 Q29.7 36.6 28.4 36.6 L19.6 36.6 Q18.3 36.6 18 35.4 Z"
        fill={`url(#${uid}-liquid)`}
        stroke="#2a1408"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Glass shine */}
      <path
        d="M20.1 20 L18.7 32.8"
        stroke="rgba(255,244,212,0.5)"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Liquid surface at the rim */}
      <ellipse cx="24" cy="17" rx="9.4" ry="2.7" fill="#ffb673" stroke="#fff4d4" strokeWidth="1.6" />
      <ellipse cx="24" cy="16.5" rx="6.4" ry="1.5" fill="#ffe6c8" opacity="0.75" />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.32 }}>
      {mark}
      <span
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 900,
          fontSize: size * 0.62,
          letterSpacing: "-0.01em",
          color: wordmarkColor,
        }}
      >
        Shot<span style={{ color: "#e8c876" }}>pot</span>
      </span>
    </span>
  );
}
