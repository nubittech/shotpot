/**
 * SnapJack brand mark — a prize wheel with a pointer and a spark.
 * Self-contained SVG, transparent background, no deps.
 *
 * <SnapJackLogo />               → wheel mark only
 * <SnapJackLogo withWordmark />  → horizontal lockup (mark + "SnapJack")
 */

const CX = 30;
const CY = 36;
const R_SEG = 19;

// 8 segments — cream / red alternating with one gold
const SEG_COLORS = [
  "#f4ece0", "#d83a30", "#f4ece0", "#d83a30",
  "#f4ece0", "#e2b24f", "#f4ece0", "#d83a30",
];

function wedgePath(i: number): string {
  const a1 = i * 45 - 22.5;
  const a2 = i * 45 + 22.5;
  const pt = (deg: number): [number, number] => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [CX + R_SEG * Math.cos(rad), CY + R_SEG * Math.sin(rad)];
  };
  const [x1, y1] = pt(a1);
  const [x2, y2] = pt(a2);
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R_SEG} ${R_SEG} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export function SnapJackLogo({
  size = 36,
  withWordmark = false,
  snapColor = "#f6f1e3",
  title = "SnapJack",
}: {
  size?: number;
  withWordmark?: boolean;
  snapColor?: string;
  title?: string;
}) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Spark lines (top-right) */}
      <g stroke="#e8c876" strokeWidth="2.4" strokeLinecap="round">
        <path d="M50 19 L57.5 14.5" />
        <path d="M50.5 25 L59 23.5" />
        <path d="M47.5 13.5 L52.5 6.5" />
      </g>

      {/* Outer rim */}
      <circle cx={CX} cy={CY} r="23.5" fill="#1a1208" />
      <circle cx={CX} cy={CY} r="23" fill="#e3b54e" />
      <circle cx={CX} cy={CY} r="19.6" fill="#1a1208" />

      {/* Wheel segments */}
      {SEG_COLORS.map((c, i) => (
        <path key={i} d={wedgePath(i)} fill={c} />
      ))}

      {/* Center hub */}
      <circle cx={CX} cy={CY} r="5.4" fill="#1a1208" />
      <circle cx={CX} cy={CY} r="3.4" fill="#e3b54e" />

      {/* Pointer pin at the top */}
      <path
        d="M24.4 8 A5.6 5.6 0 1 1 35.6 8 C35.6 12 30 16.5 30 16.5 C30 16.5 24.4 12 24.4 8 Z"
        fill="#e8c876"
        stroke="#1a1208"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx={CX} cy="8" r="2" fill="#1a1208" />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.26 }}>
      {mark}
      <span
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 900,
          fontSize: size * 0.6,
          letterSpacing: "-0.015em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: snapColor }}>Snap</span>
        <span style={{ color: "#d83a30" }}>Jack</span>
      </span>
    </span>
  );
}
