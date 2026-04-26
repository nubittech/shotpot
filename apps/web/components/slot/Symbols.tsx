"use client";

import type { ReactElement } from "react";

export type SymTone = "warm" | "neon" | "deco";

interface SymProps { tone?: SymTone; size?: number; }

const PAL = {
  warm: { line: "#3a2410", fill: "#fff4d6", accent: "#c8841d" },
  neon: { line: "#0a0014", fill: "#fbeaff", accent: "#ff2d8a" },
  deco: { line: "#1a1208", fill: "#f7e6b3", accent: "#caa14a" },
};

export function SymBeer({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={`beer-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd966" />
          <stop offset="1" stopColor="#c8841d" />
        </linearGradient>
      </defs>
      <path d="M22 22 L62 22 L60 80 L24 80 Z" fill="#f0c25a" stroke={p.line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M25 32 L59 32 L57.3 78 L26.7 78 Z" fill={`url(#beer-${tone})`} />
      <ellipse cx="34" cy="22" rx="8" ry="6" fill="#fffaf0" stroke={p.line} strokeWidth="2.2" />
      <ellipse cx="46" cy="20" rx="9" ry="7" fill="#fffaf0" stroke={p.line} strokeWidth="2.2" />
      <ellipse cx="56" cy="22" rx="7" ry="5.5" fill="#fffaf0" stroke={p.line} strokeWidth="2.2" />
      <path d="M62 32 Q80 36 80 50 Q80 66 62 70" fill="none" stroke={p.line} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 38 L30 70" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SymMartini({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={`mart-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a8e0ff" />
          <stop offset="1" stopColor="#5a8cff" />
        </linearGradient>
      </defs>
      <path d="M14 24 L82 24 L48 58 Z" fill="#e9f6ff" stroke={p.line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 28 L74 28 L48 54 Z" fill={`url(#mart-${tone})`} />
      <path d="M28 30 L42 44" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
      <rect x="46" y="58" width="4" height="20" fill={p.line} />
      <ellipse cx="48" cy="80" rx="18" ry="3.5" fill={p.line} />
      <circle cx="48" cy="40" r="5" fill="#9a4d2a" stroke={p.line} strokeWidth="2" />
      <line x1="48" y1="40" x2="64" y2="22" stroke={p.line} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SymShot({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={`shot-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd28b" />
          <stop offset="1" stopColor="#b65a14" />
        </linearGradient>
      </defs>
      <path d="M24 20 L72 20 L66 78 L30 78 Z" fill="rgba(255,255,255,0.18)" stroke={p.line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 38 L68 38 L65.2 76 L30.8 76 Z" fill={`url(#shot-${tone})`} />
      <ellipse cx="48" cy="38" rx="20" ry="3" fill="#fff7d6" opacity="0.7" />
      <path d="M34 44 L34 70" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="68" cy="22" r="6" fill="#ffe066" stroke={p.line} strokeWidth="2" />
    </svg>
  );
}

export function SymCocktail({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={`coc-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ff9ec7" />
          <stop offset="1" stopColor="#d94a78" />
        </linearGradient>
      </defs>
      <path d="M28 24 Q24 44 30 60 Q34 72 32 80 L64 80 Q62 72 66 60 Q72 44 68 24 Z" fill="rgba(255,255,255,0.18)" stroke={p.line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 36 Q26 50 32 62 Q35 70 33 78 L63 78 Q61 70 64 62 Q70 50 66 36 Z" fill={`url(#coc-${tone})`} />
      <rect x="36" y="38" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.7)" stroke={p.line} strokeWidth="1.5" />
      <rect x="50" y="44" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.7)" stroke={p.line} strokeWidth="1.5" />
      <line x1="56" y1="14" x2="42" y2="44" stroke="#ff5050" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 14 L84 14 L74 22 Z" fill="#ff5050" stroke={p.line} strokeWidth="1.5" />
      <path d="M64 14 L74 14 L72 22 Z" fill="#ffd54a" stroke={p.line} strokeWidth="1.5" />
      <circle cx="50" cy="32" r="4" fill="#c81e35" stroke={p.line} strokeWidth="1.5" />
    </svg>
  );
}

export function SymWine({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={`wine-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a3122c" />
          <stop offset="1" stopColor="#5a0010" />
        </linearGradient>
      </defs>
      <path d="M26 14 Q22 38 36 50 Q42 54 42 60 L54 60 Q54 54 60 50 Q74 38 70 14 Z" fill="rgba(255,255,255,0.15)" stroke={p.line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 22 Q26 40 38 50 Q42 52 42 58 L54 58 Q54 52 58 50 Q70 40 68 22 Z" fill={`url(#wine-${tone})`} />
      <path d="M30 22 Q48 27 66 22" stroke="rgba(255,200,200,0.6)" strokeWidth="1.8" fill="none" />
      <path d="M34 26 Q34 40 44 48" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="46" y="60" width="4" height="14" fill={p.line} />
      <ellipse cx="48" cy="78" rx="18" ry="3.5" fill={p.line} />
    </svg>
  );
}

export function SymSeven({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  const grads: Record<SymTone, [string, string]> = {
    warm: ["#ff6b35", "#c81e35"],
    neon: ["#ff2d8a", "#7e1cf5"],
    deco: ["#f5d27a", "#caa14a"],
  };
  const [c1, c2] = grads[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={`seven-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <text x="48" y="74" textAnchor="middle" fontFamily="'Bowlby One SC','Bebas Neue',sans-serif" fontSize="76" fontWeight="900" fill="rgba(0,0,0,0.35)" transform="translate(2,2)">7</text>
      <text x="48" y="74" textAnchor="middle" fontFamily="'Bowlby One SC','Bebas Neue',sans-serif" fontSize="76" fontWeight="900" fill={`url(#seven-${tone})`} stroke={p.line} strokeWidth="2.5" paintOrder="stroke">7</text>
      <circle cx="68" cy="22" r="2" fill="#fff" opacity="0.9" />
      <circle cx="76" cy="34" r="1.4" fill="#fff" opacity="0.9" />
      <circle cx="22" cy="50" r="1.6" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function SymBar({ tone = "warm", size = 96 }: SymProps) {
  const p = PAL[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <rect x="10" y="34" width="76" height="28" rx="4" fill={p.accent} stroke={p.line} strokeWidth="3" />
      <rect x="14" y="38" width="68" height="20" rx="2" fill="none" stroke={p.line} strokeWidth="1.2" opacity="0.5" />
      <text x="48" y="56" textAnchor="middle" fontFamily="'Bowlby One SC',sans-serif" fontSize="22" fontWeight="900" fill="#fff8e0" stroke={p.line} strokeWidth="1" paintOrder="stroke">BAR</text>
    </svg>
  );
}

export type SymId = "beer" | "wine" | "shot" | "martini" | "cocktail" | "bar" | "seven";

export const SYMBOL_REGISTRY: Record<SymId, { render: (props: SymProps) => ReactElement; payout: string }> = {
  beer:     { render: (p) => <SymBeer {...p} />,     payout: "Bira bizden" },
  wine:     { render: (p) => <SymWine {...p} />,     payout: "Şarap bizden" },
  shot:     { render: (p) => <SymShot {...p} />,     payout: "Shot bizden" },
  martini:  { render: (p) => <SymMartini {...p} />,  payout: "Signature martini" },
  cocktail: { render: (p) => <SymCocktail {...p} />, payout: "Ev kokteyliniz" },
  bar:      { render: (p) => <SymBar {...p} />,      payout: "Hesaptan %15 indirim" },
  seven:    { render: (p) => <SymSeven {...p} />,    payout: "JACKPOT — açık büfe" },
};
