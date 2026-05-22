"use client";

import React, { useEffect, useRef } from 'react';
import {
  useWheelSpin,
  segPath,
  Confetti,
  WHEEL_KEYFRAMES,
  WheelSegment,
} from './wheel-core';

const PAS = {
  blush:    '#fbeef0',
  pink:     '#f4b9c5',
  pinkDeep: '#e088a0',
  cream:    '#fff7e9',
  ivory:    '#fbf3df',
  mint:     '#c9e5d5',
  butter:   '#f7d68a',
  cocoa:    '#b07b56',
  cocoaDk:  '#5a3a2a',
  raspberry:'#b03a5b',
  gold:     '#d9a84a',
  goldLt:   '#f0c878',
};

export const CHALK_SEGMENTS: WheelSegment[] = [
  { id: 'cake',     label: 'Pasta',     labelEn: 'Cake',      icon: 'cake',     color: PAS.pink,      text: PAS.cocoaDk, type: 'prize',   prize: 'Günün dilim pastası' },
  { id: 'lose1',    label: 'olmadı',    labelEn: 'no luck',   icon: 'sprinkle', color: PAS.cream,     text: PAS.cocoa,   type: 'lose',    prize: null },
  { id: 'macaron',  label: 'Macaron',   labelEn: 'Macaron',   icon: 'macaron',  color: PAS.mint,      text: PAS.cocoaDk, type: 'prize',   prize: 'İkili macaron' },
  { id: 'cookie',   label: 'Kurabiye',  labelEn: 'Cookie',    icon: 'cookie',   color: PAS.butter,    text: PAS.cocoaDk, type: 'prize',   prize: 'Tereyağlı kurabiye' },
  { id: 'tart',     label: 'Tart',      labelEn: 'Tart',      icon: 'tart',     color: PAS.pink,      text: PAS.cocoaDk, type: 'prize',   prize: 'Meyveli tart' },
  { id: 'lose2',    label: 'olmadı',    labelEn: 'no luck',   icon: 'sprinkle', color: PAS.cream,     text: PAS.cocoa,   type: 'lose',    prize: null },
  { id: 'choc',     label: 'Çikolata',  labelEn: 'Chocolate', icon: 'choc',     color: PAS.cocoa,     text: PAS.cream,   type: 'prize',   prize: 'El yapımı çikolata' },
  { id: 'jackpot',  label: 'Sürpriz',   labelEn: 'Surprise',  icon: 'whisk',    color: PAS.raspberry, text: PAS.goldLt,  type: 'jackpot', prize: 'Pastacının özel kutusu' },
];

function PasIcon({ name, color }: { name: string; color: string }) {
  if (name === 'cake') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <rect x="5" y="14" width="16" height="7" rx="1.5" fill={color} stroke={color} strokeWidth="0.6"/>
      <rect x="7" y="9" width="12" height="5" rx="1.2" fill={color}/>
      <path d="M5 16 Q9 14 13 16 Q17 18 21 16" stroke={PAS.cream} strokeWidth="1" fill="none" opacity="0.7"/>
      <path d="M13 9 L13 5 M13 5 Q11 4 11 3 M13 5 Q15 4 15 3"
            stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <circle cx="13" cy="3" r="1" fill={color}/>
    </svg>
  );
  if (name === 'macaron') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M3 11 Q3 7 13 7 Q23 7 23 11 Q23 12 21 12 L5 12 Q3 12 3 11 Z" fill={color}/>
      <rect x="3" y="12" width="20" height="3" rx="0.5" fill={color} opacity="0.55"/>
      <path d="M3 15 Q3 19 13 19 Q23 19 23 15 Q23 14 21 14 L5 14 Q3 14 3 15 Z" fill={color}/>
    </svg>
  );
  if (name === 'cookie') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M4 12 Q4 5 13 5 Q22 5 22 12 Q22 21 13 21 Q4 21 4 12 Z" fill={color}/>
      <circle cx="9"  cy="10" r="1.4" fill={PAS.cocoaDk} opacity="0.7"/>
      <circle cx="15" cy="9"  r="1.2" fill={PAS.cocoaDk} opacity="0.7"/>
      <circle cx="16" cy="14" r="1.5" fill={PAS.cocoaDk} opacity="0.7"/>
      <circle cx="10" cy="15" r="1.2" fill={PAS.cocoaDk} opacity="0.7"/>
      <circle cx="13" cy="12" r="1"   fill={PAS.cocoaDk} opacity="0.6"/>
    </svg>
  );
  if (name === 'tart') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <ellipse cx="13" cy="16" rx="9" ry="3.5" fill={color}/>
      <path d="M4 16 Q4 11 13 11 Q22 11 22 16" fill="none" stroke={color} strokeWidth="1.6"/>
      <path d="M5 14 L21 14" stroke={PAS.cream} strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.8"/>
      <circle cx="9"  cy="11" r="1.3" fill={PAS.pinkDeep}/>
      <circle cx="13" cy="10" r="1.3" fill={PAS.raspberry} opacity="0.85"/>
      <circle cx="16" cy="11" r="1.2" fill={PAS.gold}/>
      <path d="M11 10 Q12 9 13 10" stroke={PAS.mint} strokeWidth="1" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'choc') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <rect x="5" y="7" width="16" height="14" rx="1.5" fill={color}/>
      <path d="M9 7 L9 21 M13 7 L13 21 M17 7 L17 21 M5 11 L21 11 M5 15 L21 15 M5 18 L21 18"
            stroke={PAS.cream} strokeWidth="0.8" opacity="0.55"/>
      <path d="M5 7 L21 7" stroke={PAS.cream} strokeWidth="0.6" opacity="0.7"/>
    </svg>
  );
  if (name === 'whisk') return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <path d="M13 3 L13 11" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 11 Q9 19 13 22 Q17 19 17 11" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11 11 Q11 18 13 22 M15 11 Q15 18 13 22" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M9 11 L17 11" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'sprinkle') return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none">
        <line x1="5" y1="6" x2="8" y2="9"/>
        <line x1="15" y1="5" x2="13" y2="8"/>
        <line x1="6" y1="15" x2="9" y2="14"/>
        <line x1="16" y1="14" x2="14" y2="17"/>
        <line x1="11" y1="11" x2="13" y2="11"/>
      </g>
    </svg>
  );
  return null;
}

function CakeMedallion({ size = 70 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      <defs>
        <radialGradient id="pas-plate" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="80%" stopColor={PAS.cream}/>
          <stop offset="100%" stopColor={PAS.ivory}/>
        </radialGradient>
      </defs>
      <circle cx="35" cy="35" r="32" fill="url(#pas-plate)" stroke={PAS.gold} strokeWidth="1.2"/>
      <circle cx="35" cy="35" r="28" fill="none" stroke={PAS.gold} strokeWidth="0.5" opacity="0.7"/>
      <rect x="18" y="38" width="34" height="14" rx="2" fill={PAS.pink}/>
      <path d="M18 41 Q22 39 26 41 Q30 43 34 41 Q38 39 42 41 Q46 43 50 41 Q52 40 52 41"
            stroke={PAS.cream} strokeWidth="1.4" fill="none" opacity="0.8"/>
      <rect x="23" y="28" width="24" height="10" rx="1.5" fill={PAS.mint}/>
      <path d="M23 30 Q27 28 31 30 Q35 32 39 30 Q43 28 47 30"
            stroke={PAS.cream} strokeWidth="1.1" fill="none" opacity="0.8"/>
      <rect x="28" y="20" width="14" height="8" rx="1.2" fill={PAS.butter}/>
      <path d="M28 22 Q31 20 34 22 Q37 24 40 22 Q41 21 42 22"
            stroke={PAS.cream} strokeWidth="0.9" fill="none" opacity="0.85"/>
      <rect x="34" y="15" width="2" height="5" fill={PAS.raspberry}/>
      <path d="M35 13 Q33 14 35 16 Q37 14 35 13 Z" fill={PAS.gold}/>
      <circle cx="22" cy="43" r="1.4" fill={PAS.raspberry}/>
      <circle cx="48" cy="43" r="1.4" fill={PAS.raspberry}/>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * 15) * Math.PI / 180;
        return <circle key={i} cx={35 + Math.cos(a) * 30} cy={35 + Math.sin(a) * 30}
                       r="0.6" fill={PAS.gold} opacity="0.7"/>;
      })}
    </svg>
  );
}

function PipingPointer({ spinning }: { spinning: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -12, left: '50%',
      transform: 'translateX(-50%)',
      width: 32, height: 60, zIndex: 6,
      transformOrigin: '50% 12px',
      animation: spinning ? 'pointer-flap 0.13s linear infinite' : 'none',
      filter: 'drop-shadow(0 4px 6px rgba(176,58,91,0.35))',
    }}>
      <svg width="32" height="60" viewBox="0 0 32 60">
        <defs>
          <linearGradient id="pipe-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PAS.pinkDeep}/>
            <stop offset="100%" stopColor={PAS.raspberry}/>
          </linearGradient>
          <linearGradient id="pipe-tip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PAS.goldLt}/>
            <stop offset="100%" stopColor={PAS.gold}/>
          </linearGradient>
        </defs>
        <path d="M8 4 L24 4 Q26 4 26 7 L22 36 Q22 40 18 40 L14 40 Q10 40 10 36 L6 7 Q6 4 8 4 Z"
          fill="url(#pipe-body)" stroke={PAS.raspberry} strokeWidth="1" strokeLinejoin="round"/>
        <path d="M8 4 Q16 1 24 4" stroke={PAS.raspberry} strokeWidth="1.2" fill="none"/>
        <path d="M11 6 Q16 4 21 6" stroke={PAS.cream} strokeWidth="0.6" fill="none" opacity="0.7"/>
        <rect x="11" y="40" width="10" height="4" fill="url(#pipe-tip)" stroke={PAS.gold} strokeWidth="0.6"/>
        <path d="M11 44 L21 44 L18 54 L16 50 L14 54 Z"
          fill="url(#pipe-tip)" stroke={PAS.gold} strokeWidth="0.7" strokeLinejoin="round"/>
        <path d="M15 54 Q16 58 17 54 Q16.5 56 15 54 Z" fill={PAS.cream}/>
      </svg>
    </div>
  );
}

function PasWheel({
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
  const R = 136, PAD = 22;
  const cx = R + PAD, cy = R + PAD;
  const size = (R + PAD) * 2;
  const n = CHALK_SEGMENTS.length;
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
          ? 'drop-shadow(0 10px 24px rgba(244,185,197,0.55))'
          : 'drop-shadow(0 14px 28px rgba(176,123,86,0.22))',
        transition: 'filter .35s ease',
      }}>
      <defs>
        <radialGradient id="pas-rim" cx="50%" cy="50%" r="50%">
          <stop offset="84%" stopColor="#ffffff"/>
          <stop offset="92%" stopColor={PAS.cream}/>
          <stop offset="100%" stopColor={PAS.ivory}/>
        </radialGradient>
        <radialGradient id="pas-face" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor={PAS.cream}/>
        </radialGradient>
        <radialGradient id="pas-sheen" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)"/>
          <stop offset="55%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="pas-winner" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={R + 14} fill={PAS.cream}/>
      <circle cx={cx} cy={cy} r={R + 14} fill="url(#pas-rim)"/>
      <circle cx={cx} cy={cy} r={R + 9} fill="none" stroke={PAS.gold} strokeWidth="1" opacity="0.85"/>
      <circle cx={cx} cy={cy} r={R + 6} fill="none" stroke={PAS.gold} strokeWidth="0.4" opacity="0.5"/>
      {Array.from({ length: 32 }).map((_, i) => {
        const a = (i * 360 / 32 - 90) * Math.PI / 180;
        const px = cx + Math.cos(a) * (R + 12);
        const py = cy + Math.sin(a) * (R + 12);
        return <circle key={'pb'+i} cx={px} cy={py} r="1.1" fill={PAS.gold} opacity="0.7"/>;
      })}
      <circle cx={cx} cy={cy} r={R + 2} fill="none" stroke={PAS.ivory} strokeWidth="1.5"/>

      <circle cx={cx} cy={cy} r={R} fill="url(#pas-face)"/>

      {CHALK_SEGMENTS.map((seg, i) => {
        const isWinner = phase === 'won' && winnerIdx === i;
        const isLoser  = phase === 'won' && winnerIdx !== i;
        const path = segPath(cx, cy, R, i, n);
        return (
          <g key={i}
            style={{
              opacity: isLoser ? 0.45 : 1,
              transition: 'opacity .55s ease',
              filter: isWinner ? 'brightness(1.05) saturate(1.08)' : 'none',
            }}>
            <path d={path.d} fill={seg.color}/>
            <path d={path.d} fill="url(#pas-sheen)" opacity="0.7"/>
            {isWinner && <path d={path.d} fill="url(#pas-winner)"/>}
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
                  stroke={PAS.cream} strokeWidth="2.4"/>
            <line x1={xm} y1={ym} x2={x} y2={y}
                  stroke={PAS.gold} strokeWidth="0.7"
                  strokeDasharray="2 2" opacity="0.8"/>
            <circle cx={cx + (x - cx) * 0.93} cy={cy + (y - cy) * 0.93}
                    r="1.6" fill={PAS.gold}/>
          </g>
        );
      })}

      {CHALK_SEGMENTS.map((seg, i) => {
        const aMid = i * arc;
        const rLbl = R * 0.74;
        const rGly = R * 0.42;
        const [lx, ly] = xy(aMid, rLbl);
        const [gx, gy] = xy(aMid, rGly);
        const isLoser = phase === 'won' && winnerIdx !== i;
        return (
          <g key={'l'+i} style={{ opacity: isLoser ? 0.45 : 1, transition: 'opacity .55s' }}>
            <g transform={`rotate(${aMid} ${gx} ${gy}) translate(${gx-13} ${gy-13})`}>
              <PasIcon name={seg.icon ?? ''} color={seg.text ?? PAS.cocoaDk}/>
            </g>
            <g transform={`rotate(${aMid} ${lx} ${ly})`}>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill={seg.text}
                fontFamily="'Nunito', 'Inter', sans-serif"
                fontSize={seg.label.length >= 8 ? 13 : 15}
                fontWeight="800"
                letterSpacing="0.3"
                style={{ pointerEvents: 'none' }}>
                {locale === 'en' ? (seg.labelEn ?? seg.label) : seg.label}
              </text>
            </g>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={40} fill="#ffffff" stroke={PAS.gold} strokeWidth="1"/>
      <g transform={`translate(${cx - 35} ${cy - 35})`}>
        <CakeMedallion size={70}/>
      </g>
    </svg>
  );
}

function pastryBgUrl() {
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
       <g fill='${PAS.pink}' opacity='0.28'>
         <circle cx='10' cy='10' r='1.3'/>
         <circle cx='30' cy='30' r='1.3'/>
       </g>
       <g fill='${PAS.gold}' opacity='0.25'>
         <circle cx='30' cy='10' r='0.9'/>
         <circle cx='10' cy='30' r='0.9'/>
       </g>
     </svg>`
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

function ChalkDrawer({
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
      background: `linear-gradient(180deg, ${PAS.blush}00 0%, ${PAS.blush} 28%, ${PAS.blush} 100%)`,
      zIndex: 60,
      animation: 'drawer-up .55s cubic-bezier(.2,1.1,.3,1) both',
    }}>
      {isWin ? (
        <div style={{
          padding: '24px 22px', borderRadius: 22,
          background: isJackpot ? PAS.raspberry : '#ffffff',
          border: `2px solid ${isJackpot ? PAS.gold : PAS.pinkDeep}`,
          boxShadow: `0 10px 26px rgba(176,58,91,0.22)`,
          color: isJackpot ? PAS.cream : PAS.cocoaDk,
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800,
            color: isJackpot ? PAS.goldLt : PAS.raspberry,
            letterSpacing: '0.28em', textTransform: 'uppercase',
          }}>
            {isJackpot
              ? (locale === "en" ? '— pastry chef\'s special box —' : '— pastacının özel kutusu —')
              : (locale === "en" ? '— what a sweet day —' : '— ne tatlı bir gün —')}
          </div>
          <div style={{
            fontFamily: "'Caveat', 'Pacifico', cursive", fontSize: 34, fontWeight: 700,
            margin: '6px 8px 4px', lineHeight: 1.1,
            animation: 'spring-rise 0.7s cubic-bezier(.3,1.6,.4,1) both',
            color: isJackpot ? PAS.goldLt : PAS.raspberry,
          }}>{displayPrize}</div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 13,
            opacity: 0.85, fontWeight: 600,
          }}>
            {locale === "en" ? 'show coupon at the counter · enjoy' : 'kuponu kasada göster · keyifle ye'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={onShowCoupon} style={{
              flex: 1, padding: '13px 0', borderRadius: 999,
              background: isJackpot ? PAS.goldLt : PAS.raspberry,
              color: isJackpot ? PAS.cocoaDk : '#ffffff',
              border: 'none', fontFamily: "'Nunito', sans-serif",
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>{locale === "en" ? 'Open coupon' : 'Kuponu aç'}</button>
            <button onClick={onReset} style={{
              padding: '13px 18px', borderRadius: 999,
              border: `2px solid ${isJackpot ? PAS.goldLt : PAS.pinkDeep}`,
              background: 'transparent',
              color: isJackpot ? PAS.goldLt : PAS.raspberry,
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>{locale === "en" ? 'Close' : 'Kapat'}</button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '22px 22px', borderRadius: 22,
          background: '#ffffff',
          border: `2px solid ${PAS.pinkDeep}`,
          color: PAS.cocoaDk, textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800,
                        color: PAS.cocoa, letterSpacing: '0.28em',
                        textTransform: 'uppercase' }}>
            {locale === "en" ? '— not this time —' : '— bu sefer olmadı —'}
          </div>
          <div style={{
            fontFamily: "'Caveat', 'Pacifico', cursive", fontSize: 28, fontWeight: 700,
            margin: '6px 0 4px', color: PAS.raspberry,
          }}>{locale === "en" ? 'fresh treats tomorrow' : 'yarın taze bir tatlı'}</div>
          <div style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 13,
            color: PAS.cocoa, fontWeight: 600,
          }}>
            {locale === "en" ? 'each order earns one spin' : 'her sipariş bir çevirme hakkı'}
          </div>
          <button onClick={onReset} style={{
            marginTop: 16, width: '100%', padding: '13px 0', borderRadius: 999,
            border: 'none',
            background: PAS.raspberry,
            color: '#ffffff', fontFamily: "'Nunito', sans-serif",
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            boxShadow: `0 4px 0 ${PAS.cocoaDk}33`,
          }}>{locale === "en" ? 'Back to menu' : 'Menüye dön'}</button>
        </div>
      )}
    </div>
  );
}

export default function WheelChalk({
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
    segments: CHALK_SEGMENTS,
    outcome: derivedOutcome,
  });
  const won = phase === 'won' && winnerIdx != null && CHALK_SEGMENTS[winnerIdx].type !== 'lose';
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
      background: PAS.blush,
      backgroundImage: `url("${pastryBgUrl()}")`,
      backgroundSize: '40px 40px',
      overflow: 'hidden',
      color: PAS.cocoaDk,
    }}>
      <style>{WHEEL_KEYFRAMES}</style>

      {/* Scalloped top valance */}
      <svg viewBox="0 0 400 36" preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 36, zIndex: 2 }}>
        <path d="M0 0 L400 0 L400 18 Q380 36 360 18 Q340 36 320 18 Q300 36 280 18 Q260 36 240 18 Q220 36 200 18 Q180 36 160 18 Q140 36 120 18 Q100 36 80 18 Q60 36 40 18 Q20 36 0 18 Z"
              fill={PAS.pink}/>
        <path d="M0 18 Q20 36 40 18 Q60 36 80 18 Q100 36 120 18 Q140 36 160 18 Q180 36 200 18 Q220 36 240 18 Q260 36 280 18 Q300 36 320 18 Q340 36 360 18 Q380 36 400 18"
              fill="none" stroke={PAS.gold} strokeWidth="1" opacity="0.85"/>
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={20 + i * 40} cy="22" r="1.4" fill={PAS.gold}/>
        ))}
      </svg>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '66px 18px 0', position: 'relative', zIndex: 5,
      }}>
        <button onClick={onBack ?? (() => {})} style={{
          appearance: 'none', border: `1.5px solid ${PAS.pinkDeep}`,
          background: '#ffffff', color: PAS.raspberry,
          width: 34, height: 34, borderRadius: '50%',
          fontSize: 18, cursor: 'pointer', fontWeight: 700,
        }}>‹</button>
        <div style={{
          fontFamily: "'Caveat', 'Pacifico', cursive", fontSize: 24, fontWeight: 700,
          color: PAS.raspberry, letterSpacing: '0.01em',
        }}>{venueName ?? 'Tatlı Atölye'}</div>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          color: PAS.raspberry, padding: '6px 10px', borderRadius: 999,
          background: '#ffffff', border: `1.5px solid ${PAS.pinkDeep}`,
          fontFamily: "'Nunito', sans-serif",
        }}>{tokens} {locale === "en" ? 'SPIN' : 'ÇEVİRME'}</div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: 14, position: 'relative', zIndex: 5 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800,
          color: PAS.cocoa, letterSpacing: '0.36em',
          textTransform: 'uppercase',
        }}>{locale === "en" ? 'handmade · fresh baked' : 'el yapımı · taze fırın'}</div>
        <div style={{
          fontFamily: "'Caveat', 'Pacifico', cursive", fontSize: 40, fontWeight: 700,
          color: PAS.raspberry, lineHeight: 1.05, marginTop: 4,
        }}>{locale === "en" ? 'sweet luck' : 'tatlı şans'}</div>
        <div style={{
          marginTop: 2, fontSize: 12, color: PAS.cocoa,
          fontWeight: 600, letterSpacing: '0.04em',
          fontFamily: "'Nunito', sans-serif", fontStyle: 'italic',
        }}>{locale === "en" ? 'spin — win a treat' : 'çevir — bir tatlı kazan'}</div>
      </div>

      {/* Wheel */}
      <div style={{
        position: 'relative',
        marginTop: 10,
        display: 'flex', justifyContent: 'center',
        zIndex: 3,
      }}>
        <div style={{ position: 'relative', width: 316, height: 316 }}>
          <PipingPointer spinning={spinningInternal}/>
          <PasWheel rotation={rotation} winnerIdx={winnerIdx} phase={phase} locale={locale}/>

          {won && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {Array.from({ length: 26 }).map((_, i) => {
                const a = (i / 26) * Math.PI * 2;
                const dist = 95 + Math.random() * 55;
                const px = Math.cos(a) * dist + 'px';
                const py = Math.sin(a) * dist + 'px';
                const pr = (Math.random() * 720 - 360) + 'deg';
                const colors = [PAS.pink, PAS.mint, PAS.butter, PAS.raspberry, PAS.gold, '#ffffff'];
                const c = colors[i % colors.length];
                const w = 4 + Math.random() * 2;
                const h = 9 + Math.random() * 4;
                return (
                  <span key={i}
                    style={{
                      position: 'absolute',
                      width: w, height: h,
                      borderRadius: 999,
                      background: c,
                      boxShadow: `0 0 0 0.5px ${PAS.cocoaDk}22`,
                      '--px': px, '--py': py, '--pr': pr,
                      animation: `petal-fall 1.7s ${i * 0.025}s ease-out forwards`,
                    } as React.CSSProperties}/>
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
            padding: '14px 40px',
            borderRadius: 999,
            background: `linear-gradient(180deg, ${PAS.pinkDeep} 0%, ${PAS.raspberry} 100%)`,
            color: '#ffffff',
            border: 'none',
            fontFamily: "'Nunito', sans-serif",
            fontSize: 16, fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 'default' : 'pointer',
            boxShadow: `0 4px 0 ${PAS.raspberry}, 0 10px 22px rgba(176,58,91,0.35), inset 0 1px 0 rgba(255,255,255,0.35)`,
            opacity: (externalSpinning || (!canSpin && !!onSpin) || phase === 'spinning' || phase === 'won') ? 0.6 : 1,
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          }}>
          {externalSpinning
            ? (locale === "en" ? 'Scanning…' : 'Taranıyor…')
            : phase === 'spinning'
            ? (locale === "en" ? 'spinning…' : 'dönüyor…')
            : (locale === "en" ? 'Spin' : 'Çevir')}
        </button>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 12, color: PAS.cocoa, fontWeight: 600,
          letterSpacing: '0.04em',
        }}>
          {locale === "en" ? 'show receipt · spin the wheel' : 'fişini göster · çarkı çevir'}
        </div>
      </div>

      <Confetti run={won} colors={[PAS.pink, PAS.mint, PAS.butter, PAS.raspberry, PAS.gold, '#ffffff']}/>

      {phase === 'won' && winnerIdx != null && (
        <ChalkDrawer
          seg={CHALK_SEGMENTS[winnerIdx]}
          result={result}
          locale={locale}
          onReset={handleReset}
          onShowCoupon={onShowCoupon}
        />
      )}
    </div>
  );
}
