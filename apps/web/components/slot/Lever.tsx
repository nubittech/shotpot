"use client";

import { useEffect, useRef, useState } from "react";

export interface LeverPalette {
  railHi: string;
  railLo: string;
  shaftLo: string;
  shaftHi: string;
  knobHi: string;
  knobMid: string;
  knobLo: string;
  knobRim: string;
  hint: string;
}

interface LeverProps {
  disabled?: boolean;
  onPull: () => void;
  palette: LeverPalette;
  height?: number;
}

export function Lever({ disabled = false, onPull, palette, height = 220 }: LeverProps) {
  const [drag, setDrag] = useState(0);
  const dragRef = useRef({ active: false, startY: 0 });
  const maxDrag = height - 60;
  const threshold = maxDrag * 0.55;

  const onStart = (clientY: number) => {
    if (disabled) return;
    dragRef.current = { active: true, startY: clientY };
  };

  const onMove = (clientY: number) => {
    if (!dragRef.current.active) return;
    setDrag(Math.max(0, Math.min(maxDrag, clientY - dragRef.current.startY)));
  };

  const onEnd = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (drag >= threshold) {
      setDrag(maxDrag);
      onPull();
      setTimeout(() => setDrag(0), 380);
    } else {
      setDrag(0);
    }
  };

  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientY);
    const mu = () => onEnd();
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientY);
    const tu = () => onEnd();
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("touchend", tu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", tu);
    };
  });

  const isActive = dragRef.current.active;

  return (
    <div
      className="no-select"
      style={{ position: "relative", width: 50, height, touchAction: "none" }}
    >
      {/* Rail */}
      <div style={{
        position: "absolute", left: 22, top: 14, bottom: 14, width: 6,
        borderRadius: 3,
        background: `linear-gradient(180deg,${palette.railHi},${palette.railLo})`,
        boxShadow: "inset 0 0 4px rgba(0,0,0,0.6)",
      }} />

      {/* Mount plate */}
      <div style={{
        position: "absolute", left: 12, top: 0, width: 26, height: 14, borderRadius: 4,
        background: `linear-gradient(180deg,${palette.railHi},${palette.railLo})`,
        boxShadow: "0 1px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
      }} />

      {/* Shaft */}
      <div style={{
        position: "absolute", left: 22, top: 14, width: 6,
        height: 36 + drag,
        background: `linear-gradient(90deg,${palette.shaftLo},${palette.shaftHi},${palette.shaftLo})`,
        borderRadius: 3,
        transition: isActive ? "none" : "height 0.35s cubic-bezier(.5,1.6,.4,1)",
      }} />

      {/* Knob */}
      <div
        style={{
          position: "absolute", left: 5, width: 40, height: 40, borderRadius: "50%",
          top: 36 + drag,
          background: `radial-gradient(circle at 35% 30%,${palette.knobHi} 0%,${palette.knobMid} 55%,${palette.knobLo} 100%)`,
          boxShadow: `0 4px 8px rgba(0,0,0,0.6),inset 0 -3px 4px rgba(0,0,0,0.4),inset 0 2px 2px rgba(255,255,255,0.5)`,
          cursor: disabled ? "default" : "grab",
          border: `1.5px solid ${palette.knobRim}`,
          transition: isActive ? "none" : "top 0.35s cubic-bezier(.5,1.6,.4,1)",
        }}
        onMouseDown={(e) => onStart(e.clientY)}
        onTouchStart={(e) => onStart(e.touches[0].clientY)}
      >
        <div style={{
          position: "absolute", top: 6, left: 8, width: 14, height: 8, borderRadius: "50%",
          background: "rgba(255,255,255,0.55)", filter: "blur(2px)",
        }} />
      </div>

      {/* Pull hint */}
      {!disabled && drag === 0 && (
        <div style={{
          position: "absolute", left: 52, top: 60,
          color: palette.hint,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
          animation: "pull-hint 1.6s ease-in-out infinite",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          PULL ↓
        </div>
      )}
    </div>
  );
}
