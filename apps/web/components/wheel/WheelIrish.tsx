"use client";

import React, { useEffect, useRef } from 'react';
import {
  useWheelSpin,
  segPath,
  Confetti,
  NoiseOverlay,
  WHEEL_KEYFRAMES,
  WheelSegment,
} from './wheel-core';

export const IRISH_SEGMENTS: WheelSegment[] = [
  { id: 'beer1',   label: 'BİRA',    icon: 'beer',    color: '#1a4d2e', type: 'prize',   prize: 'Bedava pint' },
  { id: 'lose1',   label: 'OLMADI',  icon: 'x',       color: '#2d1a0a', type: 'lose',    prize: null },
  { id: 'whiskey', label: 'VİSKİ',   icon: 'whiskey', color: '#8b5e1a', type: 'prize',   prize: '15 yıl single malt' },
  { id: 'music',   label: 'MÜZİK',   icon: 'note',    color: '#0d1a3d', type: 'prize',   prize: 'Canlı seans bileti' },
  { id: 'luck',    label: 'ŞANS',    icon: 'clover',  color: '#6b1414', type: 'prize',   prize: '%30 indirim' },
  { id: 'lose2',   label: 'OLMADI',  icon: 'x',       color: '#2d1a0a', type: 'lose',    prize: null },
  { id: 'beer2',   label: 'BİRA',    icon: 'beer',    color: '#1a4d2e', type: 'prize',   prize: 'Bedava pint' },
  { id: 'jackpot', label: 'JACKPOT', icon: 'shamrock', color: '#c8922a', type: 'jackpot', prize: 'Açık masa — bütün gece' },
];

// Tiny SVG glyphs sized to fit ~28×28 inside a segment.
function IrishGlyph({ name, color }: { name: string; color?: string }) {
  const c = color || '#f0e8d0';
  if (name === 'beer') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M7 7 L17 7 L16.5 22 L7.5 22 Z" fill={c} stroke="#0d1a0e" strokeWidth="1.4" strokeLinejoin="round"/>
      <ellipse cx="12" cy="7" rx="5" ry="2" fill="#f0e8d0" stroke="#0d1a0e" strokeWidth="1"/>
      <path d="M17 10 Q22 11 22 14 Q22 18 17 19" fill="none" stroke="#0d1a0e" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'whiskey') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M6 8 L20 8 L18 22 L8 22 Z" fill={c} stroke="#0d1a0e" strokeWidth="1.4" strokeLinejoin="round"/>
      <ellipse cx="13" cy="13" rx="5" ry="1.4" fill="#f0e8d0" opacity="0.6"/>
    </svg>
  );
  if (name === 'note') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M9 18 V5 L20 4 V17" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="7" cy="18" rx="3" ry="2.2" fill={c}/>
      <ellipse cx="18" cy="17" rx="3" ry="2.2" fill={c}/>
    </svg>
  );
  if (name === 'clover' || name === 'shamrock') return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <g fill={c} stroke="#0d1a0e" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M14 12 Q9 5 7 9 Q5 13 11 14"/>
        <path d="M14 12 Q19 5 21 9 Q23 13 17 14"/>
        <path d="M14 14 Q9 21 12 23 Q15 24 14 17"/>
        <path d="M14 14 Q19 21 16 23 Q13 24 14 17"/>
      </g>
      <path d="M14 17 L14 24" stroke="#0d1a0e" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'x') return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <path d="M5 5 L17 17 M17 5 L5 17" stroke={c} strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

// Celtic-knot triquetra for center hub.
function Triquetra({ size = 56, color = '#c8922a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
        {/* Three interlaced arcs forming triquetra */}
        <path d="M28 12 Q42 22 36 38 Q28 44 20 38 Q14 22 28 12 Z"/>
        <path d="M28 12 Q14 22 20 38 Q28 44 36 38 Q42 22 28 12 Z" opacity="0.9"/>
        <circle cx="28" cy="28" r="11" />
      </g>
      <circle cx="28" cy="28" r="3.2" fill={color}/>
    </svg>
  );
}

function IrishPointer({ spinning }: { spinning: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -10, left: '50%',
      transform: 'translateX(-50%)',
      width: 44, height: 64, zIndex: 6,
      transformOrigin: '50% 14px',
      animation: spinning ? 'pointer-flap 0.13s linear infinite' : 'none',
      filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.55))',
    }}>
      <svg width="44" height="64" viewBox="0 0 44 64">
        <defs>
          <linearGradient id="iron-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#6a6a6a"/>
            <stop offset="0.4" stopColor="#2a2a2a"/>
            <stop offset="1" stopColor="#0a0a0a"/>
          </linearGradient>
        </defs>
        {/* Top mount disc — iron with brass rivet */}
        <circle cx="22" cy="14" r="11" fill="url(#iron-grad)" stroke="#0a0a0a" strokeWidth="1.5"/>
        <circle cx="22" cy="14" r="3.5" fill="#c8922a"/>
        {/* Arrow body — ornate, with shoulders */}
        <path d="M12 23 Q14 22 22 22 Q30 22 32 23 L26 50 Q22 56 18 50 Z"
          fill="url(#iron-grad)" stroke="#0a0a0a" strokeWidth="1.5" strokeLinejoin="round"/>
        {/* Shamrock tip */}
        <g transform="translate(22 55)">
          <g fill="#1a4d2e" stroke="#0a0a0a" strokeWidth="1">
            <ellipse cx="-4" cy="-1" rx="3" ry="2.5"/>
            <ellipse cx="4" cy="-1" rx="3" ry="2.5"/>
            <ellipse cx="0" cy="4" rx="3" ry="2.5"/>
          </g>
          <path d="M0 4 L0 9" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round"/>
        </g>
        {/* Iron highlight stripe */}
        <path d="M18 26 L22 48" stroke="rgba(180,180,180,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function IrishWheel({
  rotation,
  winnerIdx,
  phase,
}: {
  rotation: number;
  winnerIdx: number | null;
  phase: string;
}) {
  const R = 138, PAD = 16;
  const cx = R + PAD, cy = R + PAD;
  const size = (R + PAD) * 2;
  const n = IRISH_SEGMENTS.length;
  const arc = 360 / n;

  const xy = (theta: number, r: number): [number, number] => {
    const rad = ((theta - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <svg width={size} height={size}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '50% 50%',
        filter: phase === 'won'
          ? 'drop-shadow(0 0 24px rgba(200,146,42,0.7))'
          : 'drop-shadow(0 16px 36px rgba(0,0,0,0.75))',
        transition: 'filter .35s ease',
      }}>
      <defs>
        {/* Dark oak rim with carved grooves */}
        <radialGradient id="oak-rim" cx="50%" cy="50%" r="50%">
          <stop offset="86%" stopColor="#1a0e03"/>
          <stop offset="90%" stopColor="#3d2006"/>
          <stop offset="94%" stopColor="#5a3010"/>
          <stop offset="98%" stopColor="#3d2006"/>
          <stop offset="100%" stopColor="#1a0e03"/>
        </radialGradient>
        {/* Aged brass inner ring */}
        <linearGradient id="brass-ring" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c8922a"/>
          <stop offset="0.5" stopColor="#8b5e1a"/>
          <stop offset="1" stopColor="#c8922a"/>
        </linearGradient>
        {/* Per-segment radial sheen (stained glass) */}
        <radialGradient id="glass-sheen" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.32)"/>
          <stop offset="60%" stopColor="rgba(255,255,255,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)"/>
        </radialGradient>
        <radialGradient id="winner-glow-irish" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(255,220,140,0.85)"/>
          <stop offset="65%" stopColor="rgba(200,146,42,0.4)"/>
          <stop offset="100%" stopColor="rgba(200,146,42,0)"/>
        </radialGradient>
      </defs>

      {/* Outer oak rim */}
      <circle cx={cx} cy={cy} r={R + 14} fill="url(#oak-rim)"/>
      {/* Carved grooves — radial dashed lines etched into oak */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = i * 10;
        const [x1, y1] = xy(a, R + 4);
        const [x2, y2] = xy(a, R + 13);
        return <line key={'gr'+i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.55)" strokeWidth="0.7"/>;
      })}
      {/* Brass ring */}
      <circle cx={cx} cy={cy} r={R + 3} fill="none" stroke="url(#brass-ring)" strokeWidth="7"/>
      {/* Brass rivets every 45° */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = i * 45 + arc / 2; // place between segments
        const [bx, by] = xy(a, R + 3);
        return (
          <g key={'rv'+i}>
            <circle cx={bx} cy={by} r="3.5" fill="#5a3010"/>
            <circle cx={bx - 0.6} cy={by - 0.6} r="1.5" fill="#fff4d4" opacity="0.7"/>
          </g>
        );
      })}

      {/* Segments */}
      {IRISH_SEGMENTS.map((seg, i) => {
        const isWinner = phase === 'won' && winnerIdx === i;
        const isLoser  = phase === 'won' && winnerIdx !== i;
        const path = segPath(cx, cy, R, i, n);
        return (
          <g key={i}
            style={{
              opacity: isLoser ? 0.3 : 1,
              transition: 'opacity .55s ease',
              filter: isWinner ? 'brightness(1.2) saturate(1.2)' : 'none',
            }}>
            <path d={path.d} fill={seg.color} stroke="#0d1a0e" strokeWidth="1.2"/>
            {/* Stained-glass sheen */}
            <path d={path.d} fill="url(#glass-sheen)"/>
            {/* Winner glow */}
            {isWinner && <path d={path.d} fill="url(#winner-glow-irish)"/>}
          </g>
        );
      })}

      {/* Labels and glyphs — rotated radially */}
      {IRISH_SEGMENTS.map((seg, i) => {
        const aMid = i * arc;
        const rLbl = R * 0.7;
        const rGly = R * 0.42;
        const [lx, ly] = xy(aMid, rLbl);
        const [gx, gy] = xy(aMid, rGly);
        const isLoser = phase === 'won' && winnerIdx !== i;
        return (
          <g key={'lbl'+i} style={{
            opacity: isLoser ? 0.45 : 1,
            transition: 'opacity .55s ease',
          }}>
            <g transform={`rotate(${aMid} ${gx} ${gy}) translate(${gx-14} ${gy-14})`}>
              <IrishGlyph name={seg.icon ?? ''} color="#f0e8d0"/>
            </g>
            <g transform={`rotate(${aMid} ${lx} ${ly})`}>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill="#f0e8d0"
                fontFamily="'Cinzel', 'Playfair Display', serif"
                fontSize={seg.type === 'jackpot' ? 13 : 12}
                fontWeight={seg.type === 'jackpot' ? 900 : 700}
                letterSpacing="0.12em"
                style={{ pointerEvents: 'none' }}>
                {seg.label}
              </text>
            </g>
          </g>
        );
      })}

      {/* Spoke dividers — darker for carved feel */}
      {Array.from({ length: n }).map((_, i) => {
        const a = i * arc - arc / 2;
        const [x, y] = xy(a, R);
        return <line key={'sp'+i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.5)" strokeWidth="0.6"/>;
      })}

      {/* Center hub — Celtic triquetra on dark brass */}
      <circle cx={cx} cy={cy} r={38} fill="#1a0e03" stroke="#c8922a" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r={32} fill="#2d1a0a" stroke="rgba(200,146,42,0.4)" strokeWidth="1"/>
      <g transform={`translate(${cx - 28} ${cy - 28})`}>
        <Triquetra size={56} color="#c8922a"/>
      </g>
    </svg>
  );
}

interface WheelPlayProps {
  venueName?: string;
  locale?: "tr" | "en";
  canSpin?: boolean;
  spinning?: boolean;
  tokens?: number;
  result?: { win: boolean; isJackpot: boolean; rewardLabel: string; couponCode: string } | null;
  outcome?: 'win' | 'lose';
  onSpin?: () => void;
  onShowCoupon?: () => void;
  onBack?: () => void;
  onReset?: () => void;
}

function IrishDrawer({
  seg,
  result,
  onReset,
  onShowCoupon,
}: {
  seg: WheelSegment;
  result?: WheelPlayProps['result'];
  onReset: () => void;
  onShowCoupon?: () => void;
}) {
  const isWin = seg.type !== 'lose';
  const isJackpot = seg.type === 'jackpot';
  const displayPrize = result?.rewardLabel ?? seg.prize ?? '';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '24px 22px 32px',
      background: 'linear-gradient(180deg, rgba(13,26,14,0) 0%, rgba(6,15,8,0.95) 28%, rgba(6,15,8,1) 100%)',
      zIndex: 60,
      animation: 'drawer-up .55s cubic-bezier(.2,1.1,.3,1) both',
    }}>
      {isWin ? (
        <div style={{
          padding: '20px 20px 22px', borderRadius: 8,
          background: isJackpot
            ? 'linear-gradient(160deg, #8b1a1a 0%, #6b1414 60%, #2d0808 100%)'
            : 'linear-gradient(160deg, #1a4d2e 0%, #0d2614 100%)',
          border: '2px solid #c8922a',
          boxShadow: '0 0 24px rgba(200,146,42,0.4), 0 10px 24px rgba(0,0,0,0.6)',
          color: '#f0e8d0', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.26em', color: '#c8922a', opacity: 0.9 }}>
            {isJackpot ? '✦ JACKPOT ✦' : 'YOU WON'}
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 900,
            margin: '8px 0 6px', letterSpacing: '0.04em',
            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
          }}>{displayPrize}</div>
          <div style={{ fontSize: 12, color: 'rgba(240,232,208,0.7)', fontWeight: 500 }}>
            Kupon cüzdanına eklendi · Garsona göster
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={onShowCoupon} style={{
              flex: 1, padding: '12px 0', borderRadius: 4,
              background: '#c8922a', color: '#0d1a0e',
              border: 'none', fontFamily: "'Cinzel', serif", fontWeight: 700,
              fontSize: 13, letterSpacing: '0.18em', cursor: 'pointer',
            }}>KUPONU AÇ</button>
            <button onClick={onReset} style={{
              padding: '12px 18px', borderRadius: 4,
              border: '2px solid #c8922a', background: 'transparent',
              color: '#c8922a', fontFamily: "'Cinzel', serif",
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>Kapat</button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px 20px 22px', borderRadius: 8,
          background: 'linear-gradient(160deg, rgba(45,26,10,0.92), rgba(20,12,4,0.95))',
          border: '1px solid rgba(200,146,42,0.3)',
          color: '#c8922a', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.26em', opacity: 0.6 }}>NOT THIS TIME</div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700,
            margin: '8px 0 4px', color: '#f0e8d0',
          }}>Sláinte! Sonraki turda.</div>
          <div style={{ fontSize: 12, color: 'rgba(240,232,208,0.65)', lineHeight: 1.55 }}>
            Her fiş bir spin · yarın akşam tekrar
          </div>
          <button onClick={onReset} style={{
            marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 4,
            border: '2px solid #c8922a', background: 'transparent',
            color: '#c8922a', fontFamily: "'Cinzel', serif", fontSize: 13,
            fontWeight: 700, letterSpacing: '0.18em', cursor: 'pointer',
          }}>MENÜYE DÖN</button>
        </div>
      )}
    </div>
  );
}

export default function WheelIrish({
  venueName,
  locale = "tr",
  canSpin = true,
  spinning: externalSpinning = false,
  tokens = 1,
  result = null,
  outcome: externalOutcome,
  onSpin,
  onBack,
  onReset,
  onShowCoupon,
}: WheelPlayProps) {
  const derivedOutcome = result ? (result.win ? 'win' : 'lose') : (externalOutcome ?? 'win');
  const { rotation, phase, winnerIdx, spin, reset } = useWheelSpin({
    segments: IRISH_SEGMENTS,
    outcome: derivedOutcome,
  });
  const won = phase === 'won' && winnerIdx != null && IRISH_SEGMENTS[winnerIdx].type !== 'lose';
  const spinningInternal = phase === 'spinning';

  const resultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (result && result !== resultRef.current && phase === 'idle') {
      resultRef.current = result;
      spin({ turns: 7, dur: 5800, easing: 'quintic' });
    }
  }, [result, phase, spin]);

  function handleReset() {
    reset();
    if (onReset) onReset();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `
        radial-gradient(60% 50% at 50% 30%, rgba(200,146,42,0.1), transparent 70%),
        radial-gradient(70% 50% at 50% 95%, rgba(26,77,46,0.4), transparent 70%),
        linear-gradient(180deg, #0d1a0e 0%, #060f08 100%)`,
      overflow: 'hidden',
    }}>
      <style>{WHEEL_KEYFRAMES}</style>
      <NoiseOverlay opacity={0.12} mix="overlay"/>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '66px 18px 0', position: 'relative', zIndex: 5,
      }}>
        <button onClick={onBack ?? (() => {})} style={{
          appearance: 'none', border: '1px solid rgba(200,146,42,0.3)',
          background: 'rgba(200,146,42,0.06)',
          color: '#c8922a', width: 34, height: 34, borderRadius: '50%',
          fontSize: 18, cursor: 'pointer', fontWeight: 600,
        }}>‹</button>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700,
          color: '#c8922a', letterSpacing: '0.18em',
        }}>{venueName ? venueName.toUpperCase() : "O'MALLEY'S"}</div>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          color: '#c8922a', padding: '6px 10px', borderRadius: 2,
          background: 'transparent', border: '1px solid rgba(200,146,42,0.4)',
        }}>{tokens} SPIN</div>
      </div>

      {/* Arched title */}
      <div style={{ textAlign: 'center', marginTop: 28, position: 'relative', zIndex: 5 }}>
        <svg width="280" height="50" viewBox="0 0 280 50" style={{ overflow: 'visible' }}>
          <defs>
            <path id="arc-irish" d="M 20 44 Q 140 0 260 44" fill="none"/>
          </defs>
          <text fill="#c8922a" fontFamily="'Cinzel', serif" fontSize="22" fontWeight="700" letterSpacing="0.28em">
            <textPath href="#arc-irish" startOffset="50%" textAnchor="middle">
              ✦ LUCKY SPIN ✦
            </textPath>
          </text>
        </svg>
      </div>

      {/* Wheel + corner shamrocks */}
      <div style={{
        position: 'relative',
        marginTop: 6,
        display: 'flex', justifyContent: 'center',
        zIndex: 3,
      }}>
        <div style={{ position: 'relative', width: 308, height: 308 }}>
          {/* Corner shamrocks N/S/E/W */}
          {(['top', 'right', 'bottom', 'left'] as const).map((pos) => (
            <div key={pos} style={{
              position: 'absolute',
              ...(pos === 'top' ? { top: -22 } : pos === 'bottom' ? { bottom: -22 } : { top: '50%' }),
              ...(pos === 'left' ? { left: -22 } : pos === 'right' ? { right: -22 } : { left: '50%' }),
              transform: (pos === 'left' || pos === 'right')
                ? 'translateY(-50%)'
                : 'translateX(-50%)',
              opacity: 0.5, zIndex: 1,
            }}>
              <IrishGlyph name="shamrock" color="#1a4d2e"/>
            </div>
          ))}
          <IrishPointer spinning={spinningInternal}/>
          <IrishWheel rotation={rotation} winnerIdx={winnerIdx} phase={phase}/>
        </div>
      </div>

      {/* Spin CTA */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 120,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10,
        zIndex: 5,
      }}>
        {tokens > 0 && (
          <div style={{ fontSize: 12, color: '#c8922a', fontWeight: 600, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>
            {tokens} spin hakkın var
          </div>
        )}
        <button
          onClick={() => {
            if (onSpin) {
              onSpin();
            } else {
              spin({ turns: 7, dur: 5800, easing: 'quintic' });
            }
          }}
          disabled={externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won'}
          style={{
            appearance: 'none',
            padding: '14px 36px',
            borderRadius: 8,
            background: '#1a4d2e',
            color: '#f0e8d0',
            border: '2px solid #c8922a',
            fontFamily: "'Cinzel', serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.18em',
            cursor: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 'default' : 'pointer',
            boxShadow: '0 0 14px rgba(200,146,42,0.35), inset 0 1px 0 rgba(240,232,208,0.18)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            opacity: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 0.55 : 1,
          }}>
          {externalSpinning
            ? (locale === "en" ? 'SCANNING…' : 'TARANIYÖR…')
            : phase === 'spinning'
            ? (locale === "en" ? 'SPINNING…' : 'ÇEVRİLİYOR…')
            : (locale === "en" ? 'SPIN ☘' : 'ÇEVİR ☘')}
        </button>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 11,
          color: 'rgba(240,232,208,0.55)',
          letterSpacing: '0.18em', fontStyle: 'italic',
        }}>
          fişini göster · talihin parlasın
        </div>
      </div>

      {/* Win rays */}
      {won && (
        <div style={{
          position: 'absolute', top: '46%', left: '50%',
          width: 600, height: 600, transform: 'translate(-50%, -50%)',
          background: 'conic-gradient(from 0deg, rgba(200,146,42,0.18) 0deg, transparent 20deg, rgba(200,146,42,0.18) 45deg, transparent 65deg, rgba(200,146,42,0.18) 90deg, transparent 110deg, rgba(200,146,42,0.18) 135deg, transparent 155deg, rgba(200,146,42,0.18) 180deg, transparent 200deg, rgba(200,146,42,0.18) 225deg, transparent 245deg, rgba(200,146,42,0.18) 270deg, transparent 290deg, rgba(200,146,42,0.18) 315deg, transparent 335deg)',
          animation: 'win-rays 16s linear infinite',
          pointerEvents: 'none', zIndex: 1,
        }}/>
      )}

      {/* Bouncing shamrock on win */}
      {won && (
        <div style={{
          position: 'absolute', top: 142, left: '50%',
          transform: 'translateX(-50%)',
          animation: 'shamrock-drop 0.7s cubic-bezier(.3,1.6,.4,1) both',
          zIndex: 70,
        }}>
          <svg width="56" height="56" viewBox="0 0 56 56"
            style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))' }}>
            <g fill="#c8922a" stroke="#0d1a0e" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M28 24 Q18 10 14 18 Q10 26 22 28"/>
              <path d="M28 24 Q38 10 42 18 Q46 26 34 28"/>
              <path d="M28 28 Q18 42 22 46 Q28 48 28 34"/>
              <path d="M28 28 Q38 42 34 46 Q28 48 28 34"/>
            </g>
            <path d="M28 34 L28 50" stroke="#0d1a0e" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      <Confetti run={won} colors={['#c8922a', '#8b1a1a', '#1a4d2e', '#f0e8d0', '#8b5e1a']}/>

      {/* Result drawer */}
      {phase === 'won' && winnerIdx != null && (
        <IrishDrawer
          seg={IRISH_SEGMENTS[winnerIdx]}
          result={result}
          onReset={handleReset}
          onShowCoupon={onShowCoupon}
        />
      )}
    </div>
  );
}
