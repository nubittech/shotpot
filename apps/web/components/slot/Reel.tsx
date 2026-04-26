"use client";

import { STRIPS } from "./useSlotEngine";
import { SYMBOL_REGISTRY } from "./Symbols";
import type { SymTone } from "./Symbols";

interface ReelProps {
  reelIndex: number;
  position: number;
  height?: number;
  symbolHeight?: number;
  tone?: SymTone;
  symbolScale?: number;
}

export function Reel({
  reelIndex,
  position,
  height = 110,
  symbolHeight = 108,
  tone = "warm",
  symbolScale = 0.82,
}: ReelProps) {
  const strip = STRIPS[reelIndex];
  const len = strip.length;
  const offset = -((position % len) * symbolHeight);

  return (
    <div style={{ height, overflow: "hidden", position: "relative" }}>
      <div
        className="reel-shadow-inner"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}
      />
      <div style={{ transform: `translate3d(0,${offset}px,0)`, willChange: "transform" }}>
        {[...strip, ...strip, ...strip].map((sid, i) => {
          const sym = SYMBOL_REGISTRY[sid];
          return (
            <div
              key={i}
              style={{
                height: symbolHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ transform: `scale(${symbolScale})` }}>
                {sym.render({ tone })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
