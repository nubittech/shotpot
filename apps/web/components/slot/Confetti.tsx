"use client";

import { useMemo } from "react";

interface ConfettiProps {
  run: boolean;
  colors: string[];
}

export function Confetti({ run, colors }: ConfettiProps) {
  const pieces = useMemo(() => {
    if (!run) return [];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      tx: (Math.random() - 0.5) * 80 + "vw",
      rot: (Math.random() * 1080 - 540) + "deg",
      delay: Math.random() * 0.6,
      dur: 1.6 + Math.random() * 1.4,
      color: colors[i % colors.length],
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
    }));
  }, [run, colors]);

  if (!run) return null;

  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      pointerEvents: "none", zIndex: 80,
    }}>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: p.left + "%",
            top: 0,
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: 1.5,
            ["--tx" as string]: p.tx,
            ["--rot" as string]: p.rot,
            animation: `confetti-fall ${p.dur}s ${p.delay}s linear forwards`,
          }}
        />
      ))}
    </div>
  );
}
