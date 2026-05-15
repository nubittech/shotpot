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

export const BOHO_SEGMENTS: WheelSegment[] = [
  { id: 'coffee',    label: 'Kahve',    icon: 'coffee',    color: '#c17f5a', text: '#3a2410', type: 'prize',   prize: 'İkram filtre kahve' },
  { id: 'lose1',     label: 'olmadı',   icon: 'x',         color: '#d4b896', text: '#6b4423', type: 'lose',    prize: null },
  { id: 'tea',       label: 'Çay',      icon: 'leaf',      color: '#7a9e7e', text: '#3a2410', type: 'prize',   prize: 'Demli ev çayı' },
  { id: 'pastry',    label: 'Kruvasan', icon: 'croissant', color: '#d4a0a0', text: '#3a2410', type: 'prize',   prize: 'Taze kruvasan' },
  { id: 'cake',      label: 'Pasta',    icon: 'cake',      color: '#a0704a', text: '#f5efe0', type: 'prize',   prize: 'Günün pastası' },
  { id: 'lose2',     label: 'olmadı',   icon: 'x',         color: '#d4b896', text: '#6b4423', type: 'lose',    prize: null },
  { id: 'breakfast', label: 'Kahvaltı', icon: 'plate',     color: '#8a9a5b', text: '#3a2410', type: 'prize',   prize: 'İkram kahvaltı tabağı' },
  { id: 'jackpot',   label: 'Sürprìz', icon: 'star',      color: '#c17f5a', text: '#f5efe0', type: 'jackpot', prize: 'Şefin sürpriz menüsü' },
];

// Line-art SVG icons (no fills mostly — drawn like sketches)
function BohoIcon({ name, color = '#3a2410' }: { name: string; color?: string }) {
  if (name === 'coffee') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M5 9 L19 9 L18 18 Q18 21 14 21 L10 21 Q6 21 6 18 Z"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M19 11 Q23 11 23 15 Q23 18 19 18" fill="none" stroke={color} strokeWidth="1.5"/>
      {/* steam */}
      <path d="M9 4 Q8 5 9 7 Q10 5 9 4" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M13 4 Q12 5 13 7 Q14 5 13 4" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'leaf') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M5 21 Q4 11 13 6 Q22 11 21 21 Q13 23 5 21 Z"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 21 L21 6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9 18 L14 13 M11 20 L17 14" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'croissant') return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <path d="M6 18 Q4 12 8 8 Q14 4 20 8 Q24 12 22 18 Q18 22 14 22 Q10 22 6 18 Z"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 14 L13 12 M14 17 L18 14 M11 18 L15 16"
        stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'cake') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M4 21 L4 14 Q4 12 6 12 L20 12 Q22 12 22 14 L22 21 Z"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M4 17 Q9 15 13 17 Q17 19 22 17" stroke={color} strokeWidth="1.2" fill="none"/>
      <path d="M13 12 L13 7 M13 7 Q11 6 11 4 M13 7 Q15 6 15 4"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'plate') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="9" fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx="13" cy="13" r="6.5" fill="none" stroke={color} strokeWidth="1.1"/>
      <circle cx="10" cy="12" r="1.5" fill={color}/>
      <circle cx="15" cy="14" r="1.5" fill={color}/>
      <path d="M11 16 Q13 17 15 16" stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'star') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M13 4 L15 11 L22 11 L17 15 L19 22 L13 18 L7 22 L9 15 L4 11 L11 11 Z"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M13 9 L13 15 M10 13 L16 13"
        stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'x') return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <path d="M5 5 Q11 9 17 17 M17 5 Q11 9 5 17"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  );
  return null;
}

// Botanical sprig — center hub illustration
function Botanical({ size = 56, color = '#3a2410' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      {/* main stem */}
      <path d="M28 8 Q26 28 28 48" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* leaf pairs */}
      <g fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round">
        <path d="M28 16 Q20 14 16 20 Q22 22 28 18"/>
        <path d="M28 16 Q36 14 40 20 Q34 22 28 18"/>
        <path d="M28 26 Q22 24 18 30 Q24 32 28 28"/>
        <path d="M28 26 Q34 24 38 30 Q32 32 28 28"/>
        <path d="M28 36 Q24 35 21 40 Q26 41 28 38"/>
        <path d="M28 36 Q32 35 35 40 Q30 41 28 38"/>
      </g>
      {/* small bud at top */}
      <circle cx="28" cy="7" r="2" fill={color}/>
    </svg>
  );
}

function TwinePointer({ spinning }: { spinning: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -10, left: '50%',
      transform: 'translateX(-50%)',
      width: 30, height: 56, zIndex: 6,
      transformOrigin: '50% 14px',
      animation: spinning ? 'pointer-flap 0.13s linear infinite' : 'none',
      filter: 'drop-shadow(0 4px 4px rgba(58,36,16,0.3))',
    }}>
      <svg width="30" height="56" viewBox="0 0 30 56">
        {/* mount knot */}
        <circle cx="15" cy="10" r="7" fill="#d4b896" stroke="#6b4423" strokeWidth="1.5"/>
        <path d="M11 8 Q15 13 19 8 M11 12 Q15 7 19 12"
          stroke="#6b4423" strokeWidth="1" fill="none" strokeLinecap="round"/>
        {/* shaft with rope texture */}
        <path d="M14 18 Q12 30 15 50 Q18 30 16 18 Z"
          fill="#c17f5a" stroke="#6b4423" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M14 22 L16 22 M13 28 L17 28 M14 34 L16 34 M13 40 L17 40"
          stroke="#6b4423" strokeWidth="0.9" strokeLinecap="round"/>
        {/* tip */}
        <path d="M11 46 L15 54 L19 46" stroke="#6b4423" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// Hand-drawn wobble circle path — generates a near-circle with subtle noise
function wobblePath(cx: number, cy: number, R: number, jitter = 1.4, points = 60): string {
  let d = '';
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = R + Math.sin(a * 3 + 0.6) * jitter * 0.4 + Math.cos(a * 5) * jitter * 0.6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d += (i === 0 ? 'M ' : 'L ') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
  }
  return d + 'Z';
}

function BohoWheel({
  rotation,
  winnerIdx,
  phase,
}: {
  rotation: number;
  winnerIdx: number | null;
  phase: string;
}) {
  const R = 136, PAD = 18;
  const cx = R + PAD, cy = R + PAD;
  const size = (R + PAD) * 2;
  const n = BOHO_SEGMENTS.length;
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
          ? 'drop-shadow(0 8px 24px rgba(193,127,90,0.35))'
          : 'drop-shadow(0 14px 28px rgba(58,36,16,0.18))',
        transition: 'filter .35s ease',
      }}>
      <defs>
        <radialGradient id="wood-rim-boho" cx="50%" cy="50%" r="50%">
          <stop offset="84%" stopColor="#6b4423"/>
          <stop offset="92%" stopColor="#8b5e3c"/>
          <stop offset="100%" stopColor="#4a2d14"/>
        </radialGradient>
        <radialGradient id="boho-sheen" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/>
          <stop offset="60%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="boho-winner" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(245,239,224,0.6)"/>
          <stop offset="100%" stopColor="rgba(245,239,224,0)"/>
        </radialGradient>
      </defs>

      {/* Natural wood rim — hand-drawn outer edge */}
      <path d={wobblePath(cx, cy, R + 10, 2)} fill="url(#wood-rim-boho)"/>
      <path d={wobblePath(cx, cy, R + 10, 2)} fill="none" stroke="#3a2410" strokeWidth="1.2"
        strokeDasharray="3 1.5" opacity="0.4"/>
      {/* wood grain rings */}
      <path d={wobblePath(cx, cy, R + 6, 1.5)} fill="none" stroke="#3a2410" strokeWidth="0.6" opacity="0.3"/>
      <path d={wobblePath(cx, cy, R + 2, 1.2)} fill="none" stroke="#3a2410" strokeWidth="0.5" opacity="0.25"/>

      {/* Wheel face — slightly wobbly */}
      <path d={wobblePath(cx, cy, R, 1.5)} fill="#f5efe0"/>

      {/* Segments */}
      {BOHO_SEGMENTS.map((seg, i) => {
        const isWinner = phase === 'won' && winnerIdx === i;
        const isLoser  = phase === 'won' && winnerIdx !== i;
        const path = segPath(cx, cy, R, i, n);
        return (
          <g key={i}
            style={{
              opacity: isLoser ? 0.5 : 1,
              transition: 'opacity .55s ease',
              filter: isWinner ? 'brightness(1.08) saturate(1.1)' : 'none',
            }}>
            <path d={path.d} fill={seg.color}/>
            <path d={path.d} fill="url(#boho-sheen)" opacity="0.6"/>
            {isWinner && <path d={path.d} fill="url(#boho-winner)"/>}
          </g>
        );
      })}

      {/* Segment dividers — hand-drawn dashed off-white */}
      {Array.from({ length: n }).map((_, i) => {
        const a = i * arc - arc / 2;
        const [x, y] = xy(a, R);
        return <line key={'sp'+i} x1={cx} y1={cy} x2={x} y2={y}
                     stroke="#f5efe0" strokeWidth="1.2"
                     strokeDasharray="4 2.5" opacity="0.85"/>;
      })}

      {/* Icons + labels */}
      {BOHO_SEGMENTS.map((seg, i) => {
        const aMid = i * arc;
        const rLbl = R * 0.72;
        const rGly = R * 0.42;
        const [lx, ly] = xy(aMid, rLbl);
        const [gx, gy] = xy(aMid, rGly);
        const isLoser = phase === 'won' && winnerIdx !== i;
        return (
          <g key={'l'+i} style={{ opacity: isLoser ? 0.45 : 1, transition: 'opacity .55s' }}>
            <g transform={`rotate(${aMid} ${gx} ${gy}) translate(${gx-13} ${gy-13})`}>
              <BohoIcon name={seg.icon ?? ''} color={seg.text}/>
            </g>
            <g transform={`rotate(${aMid} ${lx} ${ly})`}>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill={seg.text}
                fontFamily="'Caveat', 'Pacifico', cursive"
                fontSize={seg.type === 'jackpot' ? 19 : 18}
                fontWeight="700"
                style={{ pointerEvents: 'none' }}>
                {seg.label}
              </text>
            </g>
          </g>
        );
      })}

      {/* Center hub — pressed botanical */}
      <circle cx={cx} cy={cy} r={36} fill="#f5efe0" stroke="#6b4423" strokeWidth="1.5"
        strokeDasharray="2 1.5"/>
      <g transform={`translate(${cx - 28} ${cy - 28})`}>
        <Botanical size={56} color="#6b4423"/>
      </g>
    </svg>
  );
}

interface WheelPlayProps {
  venueName?: string;
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

function BohoDrawer({
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
      background: 'linear-gradient(180deg, rgba(245,239,224,0) 0%, #f5efe0 28%, #f5efe0 100%)',
      zIndex: 60,
      animation: 'drawer-up .55s cubic-bezier(.2,1.1,.3,1) both',
    }}>
      {isWin ? (
        <div style={{
          padding: '22px 22px 22px', borderRadius: 18,
          background: isJackpot ? '#c17f5a' : '#fffaf0',
          border: '2px dashed #6b4423',
          boxShadow: '3px 3px 0px #8b5e3c',
          color: isJackpot ? '#f5efe0' : '#3a2410',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 700,
                        color: isJackpot ? '#f5efe0' : '#c17f5a',
                        opacity: isJackpot ? 0.95 : 1 }}>
            {isJackpot ? '✦ sürpriz ✦' : 'kazandın!'}
          </div>
          <div style={{
            fontFamily: "'Caveat', cursive", fontSize: 32, fontWeight: 700,
            margin: '4px 0 6px', lineHeight: 1.1,
            animation: 'spring-rise 0.7s cubic-bezier(.3,1.6,.4,1) both',
          }}>{displayPrize}</div>
          <div style={{
            fontFamily: "'Caveat', cursive", fontSize: 16,
            opacity: 0.75, fontStyle: 'italic',
          }}>
            cüzdana eklendi · garsona göster
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={onShowCoupon} style={{
              flex: 1, padding: '12px 0', borderRadius: 999,
              background: isJackpot ? '#f5efe0' : '#3a2410',
              color: isJackpot ? '#3a2410' : '#f5efe0',
              border: 'none', fontFamily: "'Caveat', cursive",
              fontSize: 18, fontWeight: 700, cursor: 'pointer',
            }}>kuponu aç</button>
            <button onClick={onReset} style={{
              padding: '12px 18px', borderRadius: 999,
              border: `2px solid ${isJackpot ? '#f5efe0' : '#3a2410'}`,
              background: 'transparent',
              color: isJackpot ? '#f5efe0' : '#3a2410',
              fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 700,
              cursor: 'pointer',
            }}>kapat</button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px 20px 22px', borderRadius: 18,
          background: '#fffaf0',
          border: '2px dashed rgba(107,68,35,0.4)',
          color: '#3a2410', textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 700,
                        color: '#c17f5a' }}>—  bu sefer değil  —</div>
          <div style={{
            fontFamily: "'Caveat', cursive", fontSize: 26, fontWeight: 700,
            margin: '6px 0 4px',
          }}>yarın bir kahve daha?</div>
          <div style={{
            fontFamily: "'Caveat', cursive", fontSize: 16,
            color: '#6b4423', fontStyle: 'italic',
          }}>
            her fiş bir çevirme · sonraki turda
          </div>
          <button onClick={onReset} style={{
            marginTop: 14, width: '100%', padding: '12px 0', borderRadius: 999,
            border: '2px solid #3a2410', background: 'transparent',
            color: '#3a2410', fontFamily: "'Caveat', cursive",
            fontSize: 18, fontWeight: 700, cursor: 'pointer',
          }}>menüye dön</button>
        </div>
      )}
    </div>
  );
}

export default function WheelBoho({
  venueName,
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
    segments: BOHO_SEGMENTS,
    outcome: derivedOutcome,
  });
  const won = phase === 'won' && winnerIdx != null && BOHO_SEGMENTS[winnerIdx].type !== 'lose';
  const spinningInternal = phase === 'spinning';

  const resultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (result && result !== resultRef.current && phase === 'idle') {
      resultRef.current = result;
      spin({ turns: 5, dur: 5400, easing: 'organic' });
    }
  }, [result, phase, spin]);

  function handleReset() {
    reset();
    if (onReset) onReset();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#f5efe0',
      overflow: 'hidden',
      color: '#3a2410',
    }}>
      <style>{WHEEL_KEYFRAMES}</style>
      <NoiseOverlay opacity={0.15} mix="multiply"/>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '66px 18px 0', position: 'relative', zIndex: 5,
      }}>
        <button onClick={onBack ?? (() => {})} style={{
          appearance: 'none', border: '1.5px solid rgba(58,36,16,0.3)',
          background: 'transparent', color: '#3a2410',
          width: 34, height: 34, borderRadius: '50%',
          fontSize: 18, cursor: 'pointer', fontWeight: 600,
        }}>‹</button>
        <div style={{
          fontFamily: "'Caveat', cursive", fontSize: 22, fontWeight: 700,
          color: '#3a2410',
        }}>{venueName ?? 'Bahçe Kafé'}</div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          color: '#3a2410', padding: '6px 10px', borderRadius: 999,
          background: 'transparent', border: '1.5px dashed rgba(58,36,16,0.4)',
          fontFamily: "'Caveat', cursive",
        }}>{tokens} çevirme</div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: 18, position: 'relative', zIndex: 5 }}>
        <div style={{
          fontFamily: "'Caveat', cursive", fontSize: 38, fontWeight: 700,
          color: '#3a2410', lineHeight: 1,
        }}>çark</div>
        <div style={{
          marginTop: -2, fontSize: 12, color: '#6b4423',
          fontWeight: 500, letterSpacing: '0.08em',
          fontStyle: 'italic',
        }}>—  küçük ikramlar bekliyor  —</div>
      </div>

      {/* Wheel */}
      <div style={{
        position: 'relative',
        marginTop: 12,
        display: 'flex', justifyContent: 'center',
        zIndex: 3,
      }}>
        <div style={{ position: 'relative', width: 308, height: 308 }}>
          <TwinePointer spinning={spinningInternal}/>
          <BohoWheel rotation={rotation} winnerIdx={winnerIdx} phase={phase}/>

          {/* Petal burst on win */}
          {won && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {Array.from({ length: 14 }).map((_, i) => {
                const a = (i / 14) * Math.PI * 2;
                const dist = 110 + Math.random() * 40;
                const px = Math.cos(a) * dist + 'px';
                const py = Math.sin(a) * dist + 'px';
                const pr = (Math.random() * 540 - 270) + 'deg';
                const colors = ['#c17f5a', '#7a9e7e', '#d4a0a0', '#8a9a5b', '#a0704a'];
                const c = colors[i % colors.length];
                return (
                  <svg key={i} width="22" height="22" viewBox="0 0 22 22"
                    style={{
                      position: 'absolute',
                      '--px': px, '--py': py, '--pr': pr,
                      animation: `petal-fall 1.6s ${i * 0.04}s ease-out forwards`,
                    } as React.CSSProperties}>
                    <path d="M11 2 Q6 8 7 14 Q11 18 15 14 Q16 8 11 2 Z"
                      fill={c} opacity="0.85" stroke="#3a2410" strokeWidth="0.6"/>
                  </svg>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 124,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6,
        zIndex: 5,
      }}>
        {tokens > 0 && (
          <div style={{ fontSize: 12, color: '#6b4423', fontWeight: 600, marginBottom: 4, fontFamily: "'Caveat', cursive" }}>
            {tokens} çevirme hakkın var
          </div>
        )}
        <button
          onClick={() => {
            if (onSpin) {
              onSpin(); // triggers API call; spin animation fires via useEffect when result arrives
            } else {
              spin({ turns: 5, dur: 5400, easing: 'organic' }); // demo mode
            }
          }}
          disabled={externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won'}
          style={{
            appearance: 'none',
            padding: '14px 36px',
            borderRadius: 999,
            background: '#c17f5a',
            color: '#f5efe0',
            border: '2px solid #8b5e3c',
            fontFamily: "'Caveat', cursive",
            fontSize: 22, fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 'default' : 'pointer',
            boxShadow: '3px 3px 0px #8b5e3c, 0 6px 14px rgba(58,36,16,0.18)',
            opacity: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 0.55 : 1,
            transform: 'translateY(0)',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          }}>
          {externalSpinning ? 'Taranıyor…' : phase === 'spinning' ? 'dönüyor…' : 'Çevir! ✦'}
        </button>
        <div style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 16, color: '#6b4423',
          fontStyle: 'italic',
        }}>
          fişini göster · çarkı çevir
        </div>
      </div>

      <Confetti run={won} colors={['#c17f5a', '#7a9e7e', '#d4a0a0', '#8a9a5b', '#a0704a', '#f5efe0']}/>

      {phase === 'won' && winnerIdx != null && (
        <BohoDrawer
          seg={BOHO_SEGMENTS[winnerIdx]}
          result={result}
          onReset={handleReset}
          onShowCoupon={onShowCoupon}
        />
      )}
    </div>
  );
}
