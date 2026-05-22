"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

export type WheelPhase = 'idle' | 'spinning' | 'won';
export type SegmentType = 'prize' | 'lose' | 'jackpot';

export interface WheelSegment {
  id: string;
  label: string;
  labelEn?: string;
  color: string;
  type: SegmentType;
  prize: string | null;
  icon?: string;
  text?: string;
  motif?: string;
  isWhite?: boolean;
}

export interface SpinOptions {
  turns?: number;
  dur?: number;
  easing?: 'quintic' | 'cubic' | 'organic';
}

export interface UseWheelSpinReturn {
  rotation: number;
  phase: WheelPhase;
  winnerIdx: number | null;
  spin: (opts?: SpinOptions) => void;
  reset: () => void;
}

export const WHEEL_KEYFRAMES = `
@keyframes confetti-fall {
  0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(var(--tx, 0), 110vh, 0) rotate(var(--rot, 720deg)); opacity: 0.95; }
}
@keyframes pulse-glow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
@keyframes win-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes drawer-up { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes shamrock-drop {
  0%   { transform: translateY(-120px) rotate(-30deg) scale(0.4); opacity: 0; }
  60%  { transform: translateY(20px)  rotate(15deg)  scale(1.1); opacity: 1; }
  100% { transform: translateY(0)     rotate(0deg)   scale(1);   opacity: 1; }
}
@keyframes pointer-flap {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  50%      { transform: translateX(-50%) rotate(-15deg); }
}
@keyframes petal-fall {
  0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
  100% { transform: translate(var(--px,0), var(--py,80px)) rotate(var(--pr,180deg)); opacity: 0; }
}
@keyframes spring-rise {
  0%   { transform: translateY(8px); opacity: 0; }
  60%  { transform: translateY(-3px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes sun-burst {
  0%   { transform: scale(0.4); opacity: 0.9; }
  100% { transform: scale(2.5); opacity: 0; }
}
`;

// useWheelSpin — drives rotation. Pass `segments` (array, length = n) and
// `outcome` ('win' | 'lose'). Returns rotation deg, phase, winnerIdx, spin().
export function useWheelSpin({
  segments,
  outcome = 'win',
}: {
  segments: WheelSegment[];
  outcome?: 'win' | 'lose';
}): UseWheelSpinReturn {
  const n = segments.length;
  const arc = 360 / n;
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<WheelPhase>('idle');
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const animRef = useRef<number | null>(null);

  const spin = useCallback(
    (opts: SpinOptions = {}) => {
      if (phase === 'spinning') return;
      const { turns = 6, dur = 5200, easing = 'quintic' } = opts;

      // Pick winning segment by outcome and segment.type
      const pool = segments
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => (outcome === 'win' ? s.type !== 'lose' : s.type === 'lose'));
      const pickedPool = pool.length ? pool : segments.map((s, i) => ({ s, i }));
      const picked = pickedPool[Math.floor(Math.random() * pickedPool.length)];
      const target = picked.i;

      // 0° = top, segments centered at i*arc. To land segment `target` at top
      // we want final rotation such that (rotation + target*arc) % 360 === 0,
      // i.e. rotation ≡ -target*arc (mod 360). Add `turns` full turns and a
      // tiny jitter so the pointer doesn't always land dead-center.
      const jitter = (Math.random() - 0.5) * (arc * 0.55);
      const finalRot =
        (Math.floor(rotation / 360) + turns) * 360 + (360 - target * arc) + jitter;

      const startRot = rotation;
      const start = performance.now();
      const ease =
        easing === 'quintic'
          ? (t: number) => 1 - Math.pow(1 - t, 5)
          : easing === 'cubic'
          ? (t: number) => 1 - Math.pow(1 - t, 3)
          : easing === 'organic'
          ? (t: number) => {
              const k = 1 - Math.pow(1 - t, 4);
              const sway = Math.sin(t * Math.PI * 6) * (1 - t) * (1 - t) * 0.4;
              return k + (sway / (finalRot - startRot)) * arc;
            }
          : (t: number) => t;

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const r = startRot + (finalRot - startRot) * ease(t);
        setRotation(r);
        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          setWinnerIdx(target);
          setTimeout(() => setPhase('won'), 280);
        }
      };

      setPhase('spinning');
      setWinnerIdx(null);
      animRef.current = requestAnimationFrame(tick);
    },
    [phase, rotation, segments, outcome, arc]
  );

  const reset = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setPhase('idle');
    setWinnerIdx(null);
  }, []);

  useEffect(
    () => () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    },
    []
  );

  return { rotation, phase, winnerIdx, spin, reset };
}

// segPath — helper to compute one segment path on a wheel.
// arc is "0° = top, clockwise" (matches our rotation convention).
export function segPath(
  cx: number,
  cy: number,
  R: number,
  idx: number,
  n: number
): { d: string; midAngle: number } {
  const arc = 360 / n;
  const a1 = idx * arc - arc / 2;
  const a2 = a1 + arc;
  const xy = (theta: number, r: number): [number, number] => {
    const rad = ((theta - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = xy(a1, R);
  const [x2, y2] = xy(a2, R);
  return {
    d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`,
    midAngle: idx * arc,
  };
}

// Confetti — pure presentational, supports a custom color palette per variant.
export function Confetti({ run, colors }: { run: boolean; colors: string[] }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      tx: (Math.random() - 0.5) * 70 + 'vw',
      rot: Math.random() * 1080 - 540 + 'deg',
      delay: Math.random() * 0.7,
      dur: 1.6 + Math.random() * 1.6,
      color: colors[i % colors.length],
      w: 6 + Math.random() * 7,
      h: 9 + Math.random() * 8,
      round: Math.random() > 0.7,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, colors]);

  if (!run) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 80,
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: 'absolute',
              left: p.left + '%',
              top: 0,
              width: p.w,
              height: p.h,
              background: p.color,
              borderRadius: p.round ? '50%' : 1.5,
              '--tx': p.tx,
              '--rot': p.rot,
              animation: `confetti-fall ${p.dur}s ${p.delay}s linear forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Linen / burlap noise overlay — reused by Boho and Irish variants for texture.
export function NoiseOverlay({
  opacity = 0.18,
  mix = 'overlay',
}: {
  opacity?: number;
  mix?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        mixBlendMode: mix as React.CSSProperties['mixBlendMode'],
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2' seed='5' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 0.95 0 0 0 0 0.85 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundSize: '220px 220px',
        zIndex: 1,
      }}
    />
  );
}
