"use client";

import React, { useEffect, useRef } from 'react';
import {
  useWheelSpin,
  segPath,
  Confetti,
  WHEEL_KEYFRAMES,
  WheelSegment,
} from './wheel-core';

const PARIS = {
  cream:    '#f5ebd6',
  ivory:    '#fbf5e6',
  parchment:'#ede0c4',
  bordeaux: '#7a1f2b',
  brick:    '#9a2a3a',
  brass:    '#b88a3a',
  brassDk:  '#7a5a1a',
  gold:     '#e4c172',
  ink:      '#2c1a14',
};

export const PARIS_SEGMENTS: WheelSegment[] = [
  { id: 'espresso',  label: 'ESPRESSO',  icon: 'cup',     color: PARIS.bordeaux, text: PARIS.gold,     type: 'prize',   prize: 'Espresso ikram' },
  { id: 'lose1',     label: 'DOMMAGE',   icon: 'fleur',   color: PARIS.ivory,    text: PARIS.bordeaux, type: 'lose',    prize: null },
  { id: 'macaron',   label: 'MACARON',   icon: 'macaron', color: PARIS.bordeaux, text: PARIS.gold,     type: 'prize',   prize: 'İkili macaron' },
  { id: 'tart',      label: 'TARTE',     icon: 'tart',    color: PARIS.ivory,    text: PARIS.bordeaux, type: 'prize',   prize: 'Tarte au citron' },
  { id: 'croissant', label: 'CROISSANT', icon: 'croiss',  color: PARIS.bordeaux, text: PARIS.gold,     type: 'prize',   prize: 'Tereyağlı kruvasan' },
  { id: 'lose2',     label: 'DOMMAGE',   icon: 'fleur',   color: PARIS.ivory,    text: PARIS.bordeaux, type: 'lose',    prize: null },
  { id: 'wine',      label: 'VIN',       icon: 'glass',   color: PARIS.bordeaux, text: PARIS.gold,     type: 'prize',   prize: 'Kadeh kırmızı şarap' },
  { id: 'jackpot',   label: 'GRAND PRIX',icon: 'crown',   color: PARIS.ink,      text: PARIS.gold,     type: 'jackpot', prize: 'İki kişilik bistro menüsü' },
];

function ParisIcon({ name, color }: { name: string; color: string }) {
  if (name === 'cup') return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M5 9 L18 9 L17 17 Q17 19 14 19 L9 19 Q6 19 6 17 Z" fill={color} stroke={color} strokeWidth="0.6"/>
      <path d="M18 11 Q22 11 22 14 Q22 17 18 17" fill="none" stroke={color} strokeWidth="1.4"/>
      <path d="M9 4 Q8 5 9 7 M13 4 Q12 5 13 7" stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'macaron') return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M3 10 Q3 6 12 6 Q21 6 21 10 Q21 11 19 11 L5 11 Q3 11 3 10 Z" fill={color}/>
      <rect x="3" y="11" width="18" height="3" fill={color} opacity="0.55"/>
      <path d="M3 14 Q3 18 12 18 Q21 18 21 14 Q21 13 19 13 L5 13 Q3 13 3 14 Z" fill={color}/>
    </svg>
  );
  if (name === 'tart') return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <ellipse cx="12" cy="14" rx="9" ry="3.5" fill={color}/>
      <path d="M3 14 Q3 10 12 10 Q21 10 21 14" fill="none" stroke={color} strokeWidth="1.6"/>
      <path d="M4 12 L20 12" stroke={color} strokeWidth="0.6" strokeDasharray="1.5 1.5"/>
      <circle cx="9" cy="9.5" r="1" fill={color}/>
      <circle cx="13" cy="9" r="1" fill={color}/>
      <circle cx="16" cy="9.5" r="1" fill={color}/>
    </svg>
  );
  if (name === 'croiss') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M5 17 Q4 11 9 8 Q14 5 19 8 Q23 11 22 17 Q18 21 14 21 Q9 21 5 17 Z" fill={color}/>
      <path d="M9 13 L12 11 M13 15 L17 12 M11 17 L15 15" stroke={PARIS.ivory} strokeWidth="0.8" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
  if (name === 'glass') return (
    <svg width="22" height="26" viewBox="0 0 22 26">
      <path d="M5 3 L17 3 L16 12 Q16 16 11 16 Q6 16 6 12 Z" fill={color}/>
      <path d="M11 16 L11 22 M7 22 L15 22" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M7 5 L15 5" stroke={PARIS.ivory} strokeWidth="0.8" opacity="0.6"/>
    </svg>
  );
  if (name === 'fleur') return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <path d="M11 3 Q9 6 11 11 Q13 6 11 3 Z" fill={color}/>
      <path d="M11 11 Q6 10 4 14 Q9 14 11 11 Z" fill={color}/>
      <path d="M11 11 Q16 10 18 14 Q13 14 11 11 Z" fill={color}/>
      <path d="M9 12 L13 12 L13 14 L9 14 Z" fill={color}/>
      <path d="M11 14 L11 19" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'crown') return (
    <svg width="26" height="22" viewBox="0 0 26 22">
      <path d="M3 18 L4 7 L8 12 L13 4 L18 12 L22 7 L23 18 Z" fill={color} stroke={color} strokeWidth="0.6"/>
      <path d="M3 18 L23 18" stroke={PARIS.ink} strokeWidth="1.2"/>
      <circle cx="4" cy="6" r="1.2" fill={color}/>
      <circle cx="13" cy="3" r="1.4" fill={color}/>
      <circle cx="22" cy="6" r="1.2" fill={color}/>
    </svg>
  );
  return null;
}

function RoseMedallion({ size = 70 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      <defs>
        <radialGradient id="medallion-brass" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#f0d896"/>
          <stop offset="55%" stopColor={PARIS.brass}/>
          <stop offset="100%" stopColor={PARIS.brassDk}/>
        </radialGradient>
      </defs>
      <circle cx="35" cy="35" r="33" fill="url(#medallion-brass)" stroke={PARIS.brassDk} strokeWidth="1"/>
      <circle cx="35" cy="35" r="33" fill="none" stroke={PARIS.gold} strokeWidth="0.6" opacity="0.7"/>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45) * Math.PI / 180;
        const x1 = 35 + Math.cos(a) * 8;
        const y1 = 35 + Math.sin(a) * 8;
        const x2 = 35 + Math.cos(a) * 26;
        const y2 = 35 + Math.sin(a) * 26;
        return (
          <g key={i}>
            <ellipse cx={(x1+x2)/2} cy={(y1+y2)/2}
              rx="3.5" ry="9"
              fill={PARIS.bordeaux}
              transform={`rotate(${i*45 + 90} ${(x1+x2)/2} ${(y1+y2)/2})`}
              opacity="0.85"/>
          </g>
        );
      })}
      <circle cx="35" cy="35" r="8" fill={PARIS.bordeaux} stroke={PARIS.gold} strokeWidth="1"/>
      <circle cx="35" cy="35" r="3.2" fill={PARIS.gold}/>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * 22.5) * Math.PI / 180;
        return <circle key={i} cx={35 + Math.cos(a) * 30} cy={35 + Math.sin(a) * 30}
                       r="1.1" fill={PARIS.brassDk}/>;
      })}
    </svg>
  );
}

function BrassPointer({ spinning }: { spinning: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -14, left: '50%',
      transform: 'translateX(-50%)',
      width: 32, height: 64, zIndex: 6,
      transformOrigin: '50% 14px',
      animation: spinning ? 'pointer-flap 0.13s linear infinite' : 'none',
      filter: 'drop-shadow(0 4px 6px rgba(44,26,20,0.4))',
    }}>
      <svg width="32" height="64" viewBox="0 0 32 64">
        <defs>
          <linearGradient id="brass-arrow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0d896"/>
            <stop offset="50%" stopColor={PARIS.brass}/>
            <stop offset="100%" stopColor={PARIS.brassDk}/>
          </linearGradient>
        </defs>
        <circle cx="16" cy="9" r="7" fill="url(#brass-arrow)" stroke={PARIS.brassDk} strokeWidth="1"/>
        <path d="M16 4 Q14 7 16 11 Q18 7 16 4 Z M11 8 Q14 7 16 9 Q14 11 11 12 Z M21 8 Q18 7 16 9 Q18 11 21 12 Z"
              fill={PARIS.brassDk}/>
        <path d="M14 16 L18 16 L19 50 L16 56 L13 50 Z"
          fill="url(#brass-arrow)" stroke={PARIS.brassDk} strokeWidth="0.8" strokeLinejoin="round"/>
        <path d="M16 18 L16 50" stroke={PARIS.gold} strokeWidth="0.6" opacity="0.7"/>
        <path d="M11 48 L16 58 L21 48 L17 50 L16 54 L15 50 Z"
              fill={PARIS.brassDk}/>
      </svg>
    </div>
  );
}

function rimScrollwork(cx: number, cy: number, R: number) {
  const n = 16;
  return Array.from({ length: n }).map((_, i) => {
    const a = (i * 360 / n - 90) * Math.PI / 180;
    const rx = cx + Math.cos(a) * (R + 6);
    const ry = cy + Math.sin(a) * (R + 6);
    const rot = (i * 360 / n);
    return (
      <g key={'sc'+i} transform={`translate(${rx} ${ry}) rotate(${rot})`}>
        <circle cx="0" cy="0" r="1.6" fill={PARIS.brassDk}/>
        <circle cx="0" cy="0" r="0.7" fill={PARIS.gold}/>
      </g>
    );
  });
}

function ParisWheel({
  rotation,
  winnerIdx,
  phase,
}: {
  rotation: number;
  winnerIdx: number | null;
  phase: string;
}) {
  const R = 136, PAD = 22;
  const cx = R + PAD, cy = R + PAD;
  const size = (R + PAD) * 2;
  const n = PARIS_SEGMENTS.length;
  const arc = 360 / n;

  const xy = (theta: number, r: number): [number, number] => {
    const rad = (theta - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <svg width={size} height={size}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '50% 50%',
        filter: phase === 'won'
          ? 'drop-shadow(0 10px 24px rgba(228,193,114,0.45))'
          : 'drop-shadow(0 16px 32px rgba(44,26,20,0.32))',
        transition: 'filter .35s ease',
      }}>
      <defs>
        <radialGradient id="paris-rim" cx="50%" cy="50%" r="50%">
          <stop offset="82%" stopColor={PARIS.brassDk}/>
          <stop offset="88%" stopColor={PARIS.brass}/>
          <stop offset="94%" stopColor="#f0d896"/>
          <stop offset="100%" stopColor={PARIS.brassDk}/>
        </radialGradient>
        <radialGradient id="paris-face" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PARIS.ivory}/>
          <stop offset="100%" stopColor={PARIS.cream}/>
        </radialGradient>
        <radialGradient id="paris-sheen" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)"/>
          <stop offset="55%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="paris-winner" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(228,193,114,0.45)"/>
          <stop offset="100%" stopColor="rgba(228,193,114,0)"/>
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={R + 16} fill={PARIS.brassDk}/>
      <circle cx={cx} cy={cy} r={R + 12} fill="url(#paris-rim)"/>
      <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke={PARIS.gold} strokeWidth="0.8" opacity="0.7"/>
      {rimScrollwork(cx, cy, R)}
      <circle cx={cx} cy={cy} r={R + 2} fill="none" stroke={PARIS.brassDk} strokeWidth="1.4"/>

      <circle cx={cx} cy={cy} r={R} fill="url(#paris-face)"/>

      {PARIS_SEGMENTS.map((seg, i) => {
        const isWinner = phase === 'won' && winnerIdx === i;
        const isLoser  = phase === 'won' && winnerIdx !== i;
        const path = segPath(cx, cy, R, i, n);
        return (
          <g key={i}
            style={{
              opacity: isLoser ? 0.45 : 1,
              transition: 'opacity .55s ease',
              filter: isWinner ? 'brightness(1.06) saturate(1.05)' : 'none',
            }}>
            <path d={path.d} fill={seg.color}/>
            <path d={path.d} fill="url(#paris-sheen)" opacity="0.5"/>
            {isWinner && <path d={path.d} fill="url(#paris-winner)"/>}
          </g>
        );
      })}

      {Array.from({ length: n }).map((_, i) => {
        const a = i * arc - arc / 2;
        const [x, y] = xy(a, R);
        const [xm, ym] = xy(a, R * 0.18);
        return (
          <g key={'sp'+i}>
            <line x1={xm} y1={ym} x2={x} y2={y}
                  stroke={PARIS.brassDk} strokeWidth="2.2"/>
            <line x1={xm} y1={ym} x2={x} y2={y}
                  stroke={PARIS.gold} strokeWidth="0.7" opacity="0.9"/>
            <circle cx={cx + (x - cx) * 0.93} cy={cy + (y - cy) * 0.93}
                    r="2" fill={PARIS.brassDk}/>
            <circle cx={cx + (x - cx) * 0.93} cy={cy + (y - cy) * 0.93}
                    r="0.9" fill={PARIS.gold}/>
          </g>
        );
      })}

      {PARIS_SEGMENTS.map((seg, i) => {
        const aMid = i * arc;
        const rLbl = R * 0.74;
        const rGly = R * 0.40;
        const [lx, ly] = xy(aMid, rLbl);
        const [gx, gy] = xy(aMid, rGly);
        const isLoser = phase === 'won' && winnerIdx !== i;
        const twoLine = seg.label.includes(' ');
        return (
          <g key={'l'+i} style={{ opacity: isLoser ? 0.45 : 1, transition: 'opacity .55s' }}>
            <g transform={`rotate(${aMid} ${gx} ${gy}) translate(${gx-12} ${gy-12})`}>
              <ParisIcon name={seg.icon ?? ''} color={seg.text ?? PARIS.ink}/>
            </g>
            <g transform={`rotate(${aMid} ${lx} ${ly})`}>
              {twoLine ? (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fill={seg.text}
                  fontFamily="'Cinzel', 'Playfair Display', serif"
                  fontSize={11}
                  fontWeight="700"
                  letterSpacing="0.8"
                  style={{ pointerEvents: 'none' }}>
                  {seg.label.split(' ').map((w, j) => (
                    <tspan key={j} x={lx} dy={j === 0 ? '-0.45em' : '1.1em'}>{w}</tspan>
                  ))}
                </text>
              ) : (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fill={seg.text}
                  fontFamily="'Cinzel', 'Playfair Display', serif"
                  fontSize={seg.label.length >= 8 ? 10.5 : 12}
                  fontWeight="700"
                  letterSpacing={seg.label.length >= 8 ? 0.6 : 1.1}
                  style={{ pointerEvents: 'none' }}>
                  {seg.label}
                </text>
              )}
            </g>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={40} fill={PARIS.brassDk}/>
      <g transform={`translate(${cx - 35} ${cy - 35})`}>
        <RoseMedallion size={70}/>
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

function ParisDrawer({
  seg,
  result,
  locale,
  onReset,
  onShowCoupon,
}: {
  seg: WheelSegment;
  result?: WheelPlayProps['result'];
  locale: "tr" | "en";
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
      background: `linear-gradient(180deg, ${PARIS.cream}00 0%, ${PARIS.cream} 28%, ${PARIS.cream} 100%)`,
      zIndex: 60,
      animation: 'drawer-up .55s cubic-bezier(.2,1.1,.3,1) both',
    }}>
      {isWin ? (
        <div style={{
          padding: '24px 22px', borderRadius: 6,
          background: isJackpot ? PARIS.ink : PARIS.ivory,
          border: `2px solid ${PARIS.brassDk}`,
          boxShadow: `inset 0 0 0 4px ${PARIS.cream}, 0 8px 22px rgba(44,26,20,0.22)`,
          color: isJackpot ? PARIS.gold : PARIS.ink,
          textAlign: 'center',
          position: 'relative',
        }}>
          {[
            { t: 8, l: 8 }, { t: 8, r: 8 }, { b: 8, l: 8 }, { b: 8, r: 8 },
          ].map((p, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 14 14"
              style={{ position: 'absolute', top: p.t, bottom: p.b, left: p.l, right: p.r }}>
              <path d="M7 1 Q5 4 7 7 Q9 4 7 1 Z M1 7 Q4 5 7 7 Q4 9 1 7 Z M13 7 Q10 5 7 7 Q10 9 13 7 Z M7 13 Q5 10 7 7 Q9 10 7 13 Z"
                    fill={isJackpot ? PARIS.gold : PARIS.brassDk}/>
            </svg>
          ))}
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
            color: isJackpot ? PARIS.gold : PARIS.brassDk,
            letterSpacing: '0.32em', textTransform: 'uppercase',
          }}>
            {isJackpot ? '— Grand Prix —' : '— Félicitations —'}
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900,
            margin: '6px 8px 4px', lineHeight: 1.15, fontStyle: 'italic',
            animation: 'spring-rise 0.7s cubic-bezier(.3,1.6,.4,1) both',
            color: isJackpot ? PARIS.gold : PARIS.bordeaux,
          }}>{displayPrize}</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 12,
            opacity: 0.7, fontStyle: 'italic', marginTop: 2,
          }}>
            {locale === "en" ? 'show coupon to staff · merci' : 'kuponu garsona gösterin · merci'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={onShowCoupon} style={{
              flex: 1, padding: '12px 0', borderRadius: 4,
              background: isJackpot ? PARIS.gold : PARIS.bordeaux,
              color: isJackpot ? PARIS.ink : PARIS.gold,
              border: `1.5px solid ${PARIS.brassDk}`,
              fontFamily: "'Cinzel', serif",
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>{locale === "en" ? 'Coupon' : 'Kupon'}</button>
            <button onClick={onReset} style={{
              padding: '12px 18px', borderRadius: 4,
              border: `1.5px solid ${isJackpot ? PARIS.gold : PARIS.brassDk}`,
              background: 'transparent',
              color: isJackpot ? PARIS.gold : PARIS.ink,
              fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>{locale === "en" ? 'Close' : 'Fermer'}</button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '22px 22px', borderRadius: 6,
          background: PARIS.ivory,
          border: `2px solid ${PARIS.brassDk}`,
          boxShadow: `inset 0 0 0 4px ${PARIS.cream}`,
          color: PARIS.ink, textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
                        color: PARIS.brassDk, letterSpacing: '0.32em',
                        textTransform: 'uppercase' }}>— Dommage —</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900,
            margin: '6px 0 4px', fontStyle: 'italic',
            color: PARIS.bordeaux,
          }}>{locale === "en" ? 'next time' : 'la prochaine fois'}</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 13,
            color: PARIS.ink, opacity: 0.7, fontStyle: 'italic',
          }}>
            {locale === "en" ? 'each order earns a spin · au revoir' : 'her sipariş bir jeton · au revoir'}
          </div>
          <button onClick={onReset} style={{
            marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 4,
            border: `1.5px solid ${PARIS.brassDk}`, background: PARIS.bordeaux,
            color: PARIS.gold, fontFamily: "'Cinzel', serif",
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>{locale === "en" ? 'Menu' : 'Menü'}</button>
        </div>
      )}
    </div>
  );
}

export default function WheelParis({
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
    segments: PARIS_SEGMENTS,
    outcome: derivedOutcome,
  });
  const won = phase === 'won' && winnerIdx != null && PARIS_SEGMENTS[winnerIdx].type !== 'lose';
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

  const damaskUrl = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'>
       <g fill='none' stroke='${PARIS.brass}' stroke-width='0.6' opacity='0.18'>
         <path d='M30 6 Q22 18 30 30 Q38 18 30 6 Z'/>
         <path d='M30 54 Q22 42 30 30 Q38 42 30 54 Z'/>
         <path d='M6 30 Q18 22 30 30 Q18 38 6 30 Z'/>
         <path d='M54 30 Q42 22 30 30 Q42 38 54 30 Z'/>
         <circle cx='30' cy='30' r='1.5' fill='${PARIS.brass}'/>
       </g>
     </svg>`
  );

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: PARIS.cream,
      backgroundImage: `url("${damaskUrl}")`,
      backgroundSize: '60px 60px',
      overflow: 'hidden',
      color: PARIS.ink,
    }}>
      <style>{WHEEL_KEYFRAMES}</style>

      {/* Top awning */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        background: `repeating-linear-gradient(90deg,
          ${PARIS.bordeaux} 0px, ${PARIS.bordeaux} 22px,
          ${PARIS.ivory} 22px, ${PARIS.ivory} 44px)`,
        borderBottom: `3px solid ${PARIS.brassDk}`,
        zIndex: 2,
      }}/>
      <svg viewBox="0 0 400 18" preserveAspectRatio="none"
        style={{ position: 'absolute', top: 44, left: 0, right: 0, width: '100%', height: 18, zIndex: 2 }}>
        <path d="M0 0 L400 0 L400 4 Q380 18 360 4 Q340 18 320 4 Q300 18 280 4 Q260 18 240 4 Q220 18 200 4 Q180 18 160 4 Q140 18 120 4 Q100 18 80 4 Q60 18 40 4 Q20 18 0 4 Z"
              fill={PARIS.bordeaux}/>
      </svg>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '66px 18px 0', position: 'relative', zIndex: 5,
      }}>
        <button onClick={onBack ?? (() => {})} style={{
          appearance: 'none', border: `1.5px solid ${PARIS.brassDk}`,
          background: PARIS.ivory, color: PARIS.ink,
          width: 34, height: 34, borderRadius: '50%',
          fontSize: 18, cursor: 'pointer', fontWeight: 600,
        }}>‹</button>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
          color: PARIS.ink, letterSpacing: '0.02em', fontStyle: 'italic',
        }}>{venueName ?? 'Café Lumière'}</div>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
          color: PARIS.bordeaux, padding: '6px 10px', borderRadius: 4,
          background: PARIS.ivory, border: `1px solid ${PARIS.brassDk}`,
          fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
        }}>{tokens} {locale === "en" ? 'token' : 'jeton'}</div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: 18, position: 'relative', zIndex: 5 }}>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
          color: PARIS.brassDk, letterSpacing: '0.36em',
          textTransform: 'uppercase',
        }}>— ÉTABLI 1928 —</div>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900,
          color: PARIS.bordeaux, lineHeight: 1, marginTop: 4, fontStyle: 'italic',
          letterSpacing: '-0.01em',
        }}>La Roue</div>
        <div style={{
          marginTop: 4, fontSize: 11, color: PARIS.ink, opacity: 0.7,
          fontWeight: 500, letterSpacing: '0.22em',
          fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
        }}>De la chance</div>
      </div>

      {/* Wheel */}
      <div style={{
        position: 'relative',
        marginTop: 12,
        display: 'flex', justifyContent: 'center',
        zIndex: 3,
      }}>
        <div style={{ position: 'relative', width: 316, height: 316 }}>
          <BrassPointer spinning={spinningInternal}/>
          <ParisWheel rotation={rotation} winnerIdx={winnerIdx} phase={phase}/>

          {won && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {Array.from({ length: 18 }).map((_, i) => {
                const a = (i / 18) * Math.PI * 2;
                const dist = 100 + Math.random() * 50;
                const px = Math.cos(a) * dist + 'px';
                const py = Math.sin(a) * dist + 'px';
                const pr = (Math.random() * 540 - 270) + 'deg';
                return (
                  <svg key={i} width="20" height="20" viewBox="0 0 20 20"
                    style={{
                      position: 'absolute',
                      '--px': px, '--py': py, '--pr': pr,
                      animation: `petal-fall 1.7s ${i * 0.04}s ease-out forwards`,
                    } as React.CSSProperties}>
                    <path d="M10 1 L11.5 8.5 L18 10 L11.5 11.5 L10 19 L8.5 11.5 L2 10 L8.5 8.5 Z"
                          fill={PARIS.gold} stroke={PARIS.brassDk} strokeWidth="0.5"/>
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
        alignItems: 'center', gap: 8,
        zIndex: 5,
      }}>
        <button
          onClick={() => {
            if (onSpin) onSpin();
            else spin({ turns: 5, dur: 5400, easing: 'organic' });
          }}
          disabled={externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won'}
          style={{
            appearance: 'none',
            padding: '14px 38px',
            borderRadius: 4,
            background: `linear-gradient(180deg, ${PARIS.bordeaux} 0%, ${PARIS.brick} 50%, ${PARIS.bordeaux} 100%)`,
            color: PARIS.gold,
            border: `2px solid ${PARIS.brassDk}`,
            fontFamily: "'Cinzel', serif",
            fontSize: 14, fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            cursor: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 'default' : 'pointer',
            boxShadow: `inset 0 1px 0 ${PARIS.gold}55, 0 6px 16px rgba(44,26,20,0.3)`,
            opacity: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 0.55 : 1,
            position: 'relative',
          }}>
          {externalSpinning
            ? (locale === "en" ? 'Scanning…' : 'Taranıyor…')
            : phase === 'spinning'
            ? (locale === "en" ? '· spinning ·' : '· tournant ·')
            : (locale === "en" ? 'Spin' : 'Tournez')}
        </button>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 13, color: PARIS.ink, opacity: 0.75,
          fontStyle: 'italic', letterSpacing: '0.04em',
        }}>
          {locale === "en" ? 'show receipt · spin the wheel' : 'fişinizi gösterin · çarkı çevirin'}
        </div>
      </div>

      <Confetti run={won} colors={[PARIS.gold, PARIS.bordeaux, PARIS.brass, PARIS.ivory, PARIS.brick]}/>

      {phase === 'won' && winnerIdx != null && (
        <ParisDrawer
          seg={PARIS_SEGMENTS[winnerIdx]}
          result={result}
          locale={locale}
          onReset={handleReset}
          onShowCoupon={onShowCoupon}
        />
      )}
    </div>
  );
}
