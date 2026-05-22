"use client";

import React, { useEffect, useRef } from 'react';
import {
  useWheelSpin,
  segPath,
  Confetti,
  WHEEL_KEYFRAMES,
  WheelSegment,
} from './wheel-core';

export const MEDIT_SEGMENTS: WheelSegment[] = [
  { id: 'wine',     label: 'ŞARAP',   labelEn: 'WINE',     motif: 'wave', color: '#1a6b8a', text: '#ffffff', type: 'prize',   prize: 'Kadeh ev şarabı' },
  { id: 'lose1',    label: 'OLMADI',  labelEn: 'NO LUCK',  motif: 'tile', color: '#ffffff', text: '#0d2b4a', type: 'lose',    prize: null,    isWhite: true },
  { id: 'spritz',   label: 'SPRITZ',  labelEn: 'SPRITZ',   motif: 'sun',  color: '#e8c87a', text: '#0d2b4a', type: 'prize',   prize: 'Aperol Spritz' },
  { id: 'meze',     label: 'MEZE',    labelEn: 'MEZZE',    motif: 'star', color: '#c85a2a', text: '#ffffff', type: 'prize',   prize: 'İkram meze tabağı' },
  { id: 'olive',    label: 'ZEYTİN',  labelEn: 'OLIVES',   motif: 'leaf', color: '#7ac8b4', text: '#0d2b4a', type: 'prize',   prize: 'Marine zeytin' },
  { id: 'lose2',    label: 'OLMADI',  labelEn: 'NO LUCK',  motif: 'tile', color: '#ffffff', text: '#0d2b4a', type: 'lose',    prize: null,    isWhite: true },
  { id: 'cocktail', label: 'KOKTEYL', labelEn: 'COCKTAIL', motif: 'wave', color: '#4db8d4', text: '#ffffff', type: 'prize',   prize: 'Ev kokteyli' },
  { id: 'jackpot',  label: 'JACKPOT', labelEn: 'JACKPOT',  motif: 'sun',  color: '#0d2b4a', text: '#e8c87a', type: 'jackpot', prize: 'Sahil masası — bütün gece' },
];

// Tile motifs — geometric ceramic-style SVGs, no emoji.
function TileMotif({ name, color = '#0d2b4a' }: { name: string; color?: string }) {
  if (name === 'wave') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M2 10 Q7 6 13 10 T24 10 M2 16 Q7 12 13 16 T24 16"
        stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'sun') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="4" fill={color}/>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = i * 45 * Math.PI / 180;
        return <line key={i} x1={13 + Math.cos(a)*6} y1={13 + Math.sin(a)*6}
                       x2={13 + Math.cos(a)*10} y2={13 + Math.sin(a)*10}
                       stroke={color} strokeWidth="1.6" strokeLinecap="round"/>;
      })}
    </svg>
  );
  if (name === 'star') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M13 4 L15 11 L22 11 L17 15 L19 22 L13 18 L7 22 L9 15 L4 11 L11 11 Z"
        fill={color} stroke={color} strokeWidth="0.8" strokeLinejoin="round"/>
    </svg>
  );
  if (name === 'leaf') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M6 18 Q5 8 13 6 Q21 8 20 18 Q13 22 6 18 Z" fill={color} opacity="0.85"/>
      <path d="M6 18 L20 6" stroke={color === '#ffffff' ? '#0d2b4a' : color} strokeWidth="1.2"/>
    </svg>
  );
  if (name === 'tile') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      {/* Greek-key fragment */}
      <path d="M4 4 L22 4 L22 22 L4 22 Z M8 8 L18 8 L18 14 L12 14 L12 18 L8 18 Z"
        fill="none" stroke={color} strokeWidth="1.4"/>
    </svg>
  );
  return null;
}

// Bougainvillea SVG cluster — placed at corners
function Bougainvillea({ size = 50, hue = 'pink' }: { size?: number; hue?: string }) {
  const flower = hue === 'pink' ? '#e85a8a' : hue === 'magenta' ? '#c8409a' : '#ff7a9a';
  return (
    <svg width={size} height={size} viewBox="0 0 50 50">
      <g>
        {/* leaves */}
        <path d="M8 38 Q4 28 14 24 Q16 32 14 38 Z" fill="#1a8a5e" opacity="0.85"/>
        <path d="M38 12 Q42 4 32 6 Q26 14 30 18 Z" fill="#2aa078" opacity="0.85"/>
        {/* flower clusters */}
        <g fill={flower}>
          <path d="M22 14 Q18 10 14 14 Q12 18 16 20 Q20 22 22 18 Z"/>
          <path d="M28 18 Q32 14 36 18 Q38 22 34 24 Q30 26 28 22 Z"/>
          <path d="M20 26 Q16 22 12 26 Q10 30 14 32 Q18 34 20 30 Z"/>
        </g>
        <g fill="#fff3d4">
          <circle cx="18" cy="17" r="1.2"/>
          <circle cx="32" cy="21" r="1.2"/>
          <circle cx="16" cy="29" r="1.2"/>
        </g>
      </g>
    </svg>
  );
}

function MeditPointer({ spinning }: { spinning: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -6, left: '50%',
      transform: 'translateX(-50%)',
      width: 38, height: 48, zIndex: 6,
      transformOrigin: '50% 12px',
      animation: spinning ? 'pointer-flap 0.13s linear infinite' : 'none',
      filter: 'drop-shadow(0 6px 8px rgba(26,107,138,0.25))',
    }}>
      <svg width="38" height="48" viewBox="0 0 38 48">
        {/* Ceramic triangle — white with blue stripe */}
        <path d="M6 10 L32 10 L19 44 Z" fill="#ffffff" stroke="#1a6b8a" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M11 18 L27 18" stroke="#1a6b8a" strokeWidth="2.2" strokeLinecap="round"/>
        {/* Tiny mount dot */}
        <circle cx="19" cy="10" r="4" fill="#1a6b8a" stroke="#0d2b4a" strokeWidth="0.8"/>
        <circle cx="19" cy="10" r="1.5" fill="#fff"/>
      </svg>
    </div>
  );
}

// Scalloped rim — small shells/arcs around outer edge
function ScallopRim({ cx, cy, R }: { cx: number; cy: number; R: number }) {
  const n = 36;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = i * (360 / n);
        const rad = (a - 90) * Math.PI / 180;
        const x = cx + (R + 9) * Math.cos(rad);
        const y = cy + (R + 9) * Math.sin(rad);
        return <circle key={i} cx={x} cy={y} r="5" fill="#ffffff" stroke="#1a6b8a" strokeWidth="0.7"/>;
      })}
    </g>
  );
}

function MeditWheel({
  rotation,
  winnerIdx,
  phase,
  locale = 'tr',
}: {
  rotation: number;
  winnerIdx: number | null;
  phase: string;
  locale?: 'tr' | 'en';
}) {
  const R = 138, PAD = 18;
  const cx = R + PAD, cy = R + PAD;
  const size = (R + PAD) * 2;
  const n = MEDIT_SEGMENTS.length;
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
          ? 'drop-shadow(0 12px 28px rgba(26,107,138,0.35))'
          : 'drop-shadow(0 18px 40px rgba(26,107,138,0.18))',
        transition: 'filter .35s ease',
      }}>
      <defs>
        <radialGradient id="ceramic-rim" cx="50%" cy="50%" r="50%">
          <stop offset="84%" stopColor="#ffffff"/>
          <stop offset="92%" stopColor="#f5f8fa"/>
          <stop offset="100%" stopColor="#dde6ea"/>
        </radialGradient>
        <radialGradient id="ceramic-sheen" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)"/>
          <stop offset="50%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(232,200,122,0.9)"/>
          <stop offset="100%" stopColor="rgba(232,200,122,0)"/>
        </radialGradient>
      </defs>

      {/* Outer scallop rim */}
      <ScallopRim cx={cx} cy={cy} R={R}/>

      {/* Glazed ceramic rim */}
      <circle cx={cx} cy={cy} r={R + 8} fill="url(#ceramic-rim)" stroke="#1a6b8a" strokeWidth="1.5"/>

      {/* Hand-painted Greek key border — repeated meander along the rim band */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = i * 15;
        const [px, py] = xy(a, R + 3.5);
        return (
          <g key={'gk'+i} transform={`rotate(${a} ${px} ${py})`}>
            <path d={`M ${px-5} ${py-1.5} L ${px-5} ${py+1.5} L ${px+5} ${py+1.5} L ${px+5} ${py-1.5} L ${px+2} ${py-1.5} L ${px+2} ${py-0.5} L ${px-2} ${py-0.5} L ${px-2} ${py-1.5} Z`}
              fill="none" stroke="#1a6b8a" strokeWidth="0.9"/>
          </g>
        );
      })}

      {/* Segments */}
      {MEDIT_SEGMENTS.map((seg, i) => {
        const isWinner = phase === 'won' && winnerIdx === i;
        const isLoser  = phase === 'won' && winnerIdx !== i;
        const path = segPath(cx, cy, R, i, n);
        return (
          <g key={i}
            style={{
              opacity: isLoser ? 0.4 : 1,
              transition: 'opacity .55s ease',
              filter: isWinner ? 'brightness(1.05) saturate(1.15)' : 'none',
            }}>
            <path d={path.d} fill={seg.color}/>
            <path d={path.d} fill="url(#ceramic-sheen)"/>
            {isWinner && <path d={path.d} fill="url(#sun-glow)"/>}
            {/* Segment hairline border for tile feel */}
            <path d={path.d} fill="none" stroke="rgba(13,43,74,0.4)" strokeWidth="0.6"/>
          </g>
        );
      })}

      {/* Motif + labels */}
      {MEDIT_SEGMENTS.map((seg, i) => {
        const aMid = i * arc;
        const rLbl = R * 0.68;
        const rGly = R * 0.4;
        const [lx, ly] = xy(aMid, rLbl);
        const [gx, gy] = xy(aMid, rGly);
        const isLoser = phase === 'won' && winnerIdx !== i;
        const motifColor = seg.isWhite ? '#1a6b8a' : '#ffffff';
        return (
          <g key={'l'+i} style={{ opacity: isLoser ? 0.5 : 1, transition: 'opacity .55s' }}>
            <g transform={`rotate(${aMid} ${gx} ${gy}) translate(${gx-13} ${gy-13})`}>
              <TileMotif name={seg.motif ?? ''} color={motifColor}/>
            </g>
            <g transform={`rotate(${aMid} ${lx} ${ly})`}>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill={seg.text}
                fontFamily="'Nunito', sans-serif"
                fontSize={seg.type === 'jackpot' ? 13 : 12.5}
                fontWeight="800"
                letterSpacing="0.08em"
                style={{ pointerEvents: 'none' }}>
                {locale === 'en' ? (seg.labelEn ?? seg.label) : seg.label}
              </text>
            </g>
          </g>
        );
      })}

      {/* Spoke separators in painted blue */}
      {Array.from({ length: n }).map((_, i) => {
        const a = i * arc - arc / 2;
        const [x, y] = xy(a, R);
        return <line key={'sp'+i} x1={cx} y1={cy} x2={x} y2={y}
                     stroke="rgba(13,43,74,0.3)" strokeWidth="0.8"/>;
      })}

      {/* Center hub — Mediterranean sun */}
      <circle cx={cx} cy={cy} r={36} fill="#ffffff" stroke="#1a6b8a" strokeWidth="2"/>
      <g>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = i * (360 / 16);
          const [rx1, ry1] = xy(a, 16);
          const [rx2, ry2] = xy(a, 30);
          return <line key={'sr'+i} x1={rx1} y1={ry1} x2={rx2} y2={ry2}
                       stroke="#c85a2a" strokeWidth="2" strokeLinecap="round"/>;
        })}
      </g>
      <circle cx={cx} cy={cy} r={13} fill="#e8c87a" stroke="#c85a2a" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={5} fill="#c85a2a"/>
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

function MeditDrawer({
  seg,
  result,
  onReset,
  onShowCoupon,
  locale = 'tr',
}: {
  seg: WheelSegment;
  result?: WheelPlayProps['result'];
  onReset: () => void;
  onShowCoupon?: () => void;
  locale?: 'tr' | 'en';
}) {
  const isEn = locale === 'en';
  const tr = {
    win: 'KAZANDIN!',
    saved: 'Kupon cüzdanına eklendi · Yazlık masa',
    open: 'Kuponu aç',
    close: 'Kapat',
    notNow: 'BU SEFER DEĞİL',
    headline: 'Yaz daha bitmedi.',
    sub: 'Her fiş bir spin · yarın akşam tekrar',
    back: 'Menüye dön',
  };
  const en = {
    win: 'YOU WON!',
    saved: 'Added to coupon wallet · Summer table',
    open: 'Open coupon',
    close: 'Close',
    notNow: 'NOT THIS TIME',
    headline: 'Summer is not over yet.',
    sub: 'Each receipt is a spin · try again tomorrow',
    back: 'Back to menu',
  };
  const t = isEn ? en : tr;
  const isWin = seg.type !== 'lose';
  const isJackpot = seg.type === 'jackpot';
  const displayPrize = result?.rewardLabel ?? seg.prize ?? '';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '24px 22px 32px',
      background: 'linear-gradient(180deg, rgba(240,244,248,0) 0%, #f0f4f8 32%, #f0f4f8 100%)',
      zIndex: 60,
      animation: 'drawer-up .55s cubic-bezier(.2,1.1,.3,1) both',
    }}>
      {isWin ? (
        <div style={{
          padding: '20px 20px 22px', borderRadius: 18,
          background: isJackpot ? '#0d2b4a' : '#ffffff',
          border: `2px solid ${isJackpot ? '#e8c87a' : '#1a6b8a'}`,
          boxShadow: '0 12px 30px rgba(13,43,74,0.18)',
          color: isJackpot ? '#e8c87a' : '#0d2b4a',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 900,
                        letterSpacing: '0.22em', color: isJackpot ? '#e8c87a' : '#1a6b8a' }}>
            {isJackpot ? '☀ JACKPOT ☀' : t.win}
          </div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 900,
            margin: '8px 0 6px', letterSpacing: '-0.005em',
          }}>{displayPrize}</div>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: isJackpot ? 'rgba(232,200,122,0.75)' : '#1a6b8a',
          }}>
            {t.saved}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={onShowCoupon} style={{
              flex: 1, padding: '12px 0', borderRadius: 999,
              background: isJackpot ? '#e8c87a' : '#1a6b8a',
              color: isJackpot ? '#0d2b4a' : '#ffffff',
              border: 'none', fontFamily: "'Nunito', sans-serif", fontWeight: 800,
              fontSize: 13, cursor: 'pointer',
            }}>{t.open}</button>
            <button onClick={onReset} style={{
              padding: '12px 18px', borderRadius: 999,
              border: `2px solid ${isJackpot ? '#e8c87a' : '#1a6b8a'}`,
              background: 'transparent',
              color: isJackpot ? '#e8c87a' : '#1a6b8a',
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
            }}>{t.close}</button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px 20px 22px', borderRadius: 18,
          background: '#ffffff',
          border: '1px solid rgba(26,107,138,0.2)',
          color: '#0d2b4a', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', color: '#c85a2a' }}>
            {t.notNow}
          </div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800,
            margin: '8px 0 4px',
          }}>{t.headline}</div>
          <div style={{ fontSize: 12, color: '#1a6b8a', fontWeight: 600 }}>
            {t.sub}
          </div>
          <button onClick={onReset} style={{
            marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 999,
            border: '2px solid #1a6b8a', background: 'transparent',
            color: '#1a6b8a', fontFamily: "'Nunito', sans-serif",
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
          }}>{t.back}</button>
        </div>
      )}
    </div>
  );
}

export default function WheelMedit({
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
    segments: MEDIT_SEGMENTS,
    outcome: derivedOutcome,
  });
  const won = phase === 'won' && winnerIdx != null && MEDIT_SEGMENTS[winnerIdx].type !== 'lose';
  const spinningInternal = phase === 'spinning';

  const resultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (result && result !== resultRef.current && phase === 'idle') {
      resultRef.current = result;
      spin({ turns: 5, dur: 4400, easing: 'cubic' });
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
        radial-gradient(60% 40% at 50% 0%, rgba(77,184,212,0.18), transparent 70%),
        radial-gradient(50% 30% at 50% 100%, rgba(232,200,122,0.16), transparent 70%),
        linear-gradient(180deg, #f0f4f8 0%, #e1ecf2 100%)`,
      overflow: 'hidden',
      color: '#0d2b4a',
    }}>
      <style>{WHEEL_KEYFRAMES}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '66px 18px 0', position: 'relative', zIndex: 5,
      }}>
        <button onClick={onBack ?? (() => {})} style={{
          appearance: 'none', border: '1px solid rgba(26,107,138,0.25)',
          background: '#fff', color: '#1a6b8a',
          width: 34, height: 34, borderRadius: '50%',
          fontSize: 18, cursor: 'pointer', fontWeight: 600,
        }}>‹</button>
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 900,
          color: '#0d2b4a', letterSpacing: '0.22em',
        }}>{venueName ? venueName.toUpperCase() : 'SANTORINI · BAR'}</div>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
          color: '#1a6b8a', padding: '6px 12px', borderRadius: 999,
          background: '#fff', border: '1px solid rgba(26,107,138,0.3)',
        }}>{tokens} SPIN</div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: 22, position: 'relative', zIndex: 5 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900,
          color: '#0d2b4a', letterSpacing: '0.04em',
        }}>ŞANS ÇARKI</div>
        <div style={{
          marginTop: 4, fontSize: 12, color: '#1a6b8a',
          fontWeight: 700, letterSpacing: '0.16em',
        }}>☀ TONIGHT ON THE ROOFTOP</div>
      </div>

      {/* Wheel + bougainvillea corners */}
      <div style={{
        position: 'relative',
        marginTop: 12,
        display: 'flex', justifyContent: 'center',
        zIndex: 3,
      }}>
        <div style={{ position: 'relative', width: 312, height: 312 }}>
          <div style={{ position: 'absolute', top: -10, left: -14, zIndex: 2 }}>
            <Bougainvillea size={56} hue="magenta"/>
          </div>
          <div style={{ position: 'absolute', top: -8, right: -10, zIndex: 2, transform: 'scaleX(-1)' }}>
            <Bougainvillea size={50} hue="pink"/>
          </div>
          <div style={{ position: 'absolute', bottom: -10, left: -8, zIndex: 2, transform: 'rotate(180deg)' }}>
            <Bougainvillea size={48} hue="pink"/>
          </div>
          <div style={{ position: 'absolute', bottom: -12, right: -14, zIndex: 2, transform: 'rotate(180deg) scaleX(-1)' }}>
            <Bougainvillea size={54} hue="magenta"/>
          </div>
          <MeditPointer spinning={spinningInternal}/>
          <MeditWheel rotation={rotation} winnerIdx={winnerIdx} phase={phase} locale={locale}/>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 124,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        zIndex: 5,
      }}>
        {tokens > 0 && (
          <div style={{ fontSize: 12, color: '#1a6b8a', fontWeight: 600, letterSpacing: '0.08em' }}>
            {tokens} spin hakkın var
          </div>
        )}
        <button
          onClick={() => {
            if (onSpin) {
              onSpin();
            } else {
              spin({ turns: 5, dur: 4400, easing: 'cubic' });
            }
          }}
          disabled={externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won'}
          style={{
            appearance: 'none',
            padding: '14px 36px',
            borderRadius: 999,
            background: 'linear-gradient(160deg, #4db8d4 0%, #1a6b8a 100%)',
            color: '#ffffff',
            border: 'none',
            fontFamily: "'Nunito', sans-serif",
            fontSize: 18, fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 'default' : 'pointer',
            boxShadow: '0 8px 24px rgba(26,107,138,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
            opacity: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 0.55 : 1,
            transition: 'transform 0.15s ease',
          }}>
          {externalSpinning
            ? (locale === "en" ? 'Scanning…' : 'Taranıyor…')
            : phase === 'spinning'
            ? (locale === "en" ? 'Spinning…' : 'Çevriliyor…')
            : (locale === "en" ? 'Spin! ☀' : 'Çevir! ☀')}
        </button>
        <div style={{
          fontSize: 12, color: '#1a6b8a', fontWeight: 600,
        }}>
          Fişini göster · yaz şansını dene
        </div>
      </div>

      {/* Sun burst on win */}
      {won && (
        <div style={{
          position: 'absolute', top: '46%', left: '50%',
          width: 360, height: 360, transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(232,200,122,0.6), rgba(232,200,122,0) 70%)',
          animation: 'sun-burst 0.9s ease-out forwards',
          pointerEvents: 'none', zIndex: 1,
        }}/>
      )}

      <Confetti run={won} colors={['#4db8d4', '#ffffff', '#c85a2a', '#e8c87a', '#1a6b8a', '#7ac8b4']}/>

      {phase === 'won' && winnerIdx != null && (
        <MeditDrawer
          seg={MEDIT_SEGMENTS[winnerIdx]}
          result={result}
          onReset={handleReset}
          onShowCoupon={onShowCoupon}
          locale={locale}
        />
      )}
    </div>
  );
}
