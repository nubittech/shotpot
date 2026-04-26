"use client";

import { useEffect, useRef, useState } from "react";
import type { SymId } from "./Symbols";

export type Phase = "idle" | "spinning" | "settling" | "result-win" | "result-lose";

const STRIP_BASE: SymId[] = [
  "beer","wine","shot","cocktail","beer","martini",
  "wine","shot","bar","cocktail","beer","martini",
  "shot","wine","cocktail","beer","seven","martini",
  "shot","cocktail","wine","beer","bar","martini",
];

export const STRIPS: SymId[][] = [
  [...STRIP_BASE],
  STRIP_BASE.map((_, i, a) => a[(i + 7) % a.length]),
  STRIP_BASE.map((_, i, a) => a[(i + 13) % a.length]),
];

function outcomeToSym(outcome: string): SymId {
  const o = outcome.toLowerCase();
  if (o.includes("jackpot") || o.includes("seven") || o.includes("logo")) return "seven";
  if (o.includes("beer") || o.includes("bira") || o.includes("pint")) return "beer";
  if (o.includes("wine") || o.includes("şarap") || o.includes("red")) return "wine";
  if (o.includes("shot") || o.includes("latte") || o.includes("kahve")) return "shot";
  if (o.includes("martini")) return "martini";
  if (o.includes("bar") || o.includes("indirim")) return "bar";
  return "cocktail";
}

function pickLoseTargets(): [number, number, number] {
  for (let attempt = 0; attempt < 30; attempt++) {
    const r0 = Math.floor(Math.random() * STRIPS[0].length);
    const r1 = Math.floor(Math.random() * STRIPS[1].length);
    const r2 = Math.floor(Math.random() * STRIPS[2].length);
    if (!(STRIPS[0][r0] === STRIPS[1][r1] && STRIPS[1][r1] === STRIPS[2][r2])) {
      return [r0, r1, r2];
    }
  }
  return [0, 1, 2];
}

export function useSlotEngine({
  spinning,
  outcome,
}: {
  spinning: boolean;
  outcome: string | null;
}) {
  const [positions, setPositions] = useState<[number, number, number]>([4, 11, 18]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reelStopped, setReelStopped] = useState<[boolean, boolean, boolean]>([true, true, true]);

  const raf = useRef<number | null>(null);
  const posRef = useRef<[number, number, number]>([4, 11, 18]);
  const prevSpin = useRef(false);

  function writePos(p: [number, number, number]) {
    posRef.current = p;
    setPositions(p);
  }

  function cancelRaf() {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  }

  useEffect(() => {
    const wasSpin = prevSpin.current;
    prevSpin.current = spinning;

    if (spinning && !wasSpin) {
      cancelRaf();
      setPhase("spinning");
      setReelStopped([false, false, false]);
      const t0 = performance.now();

      function freeSpin(now: number) {
        const t = now - t0;
        writePos([
          (t / 55) % STRIPS[0].length,
          (t / 51) % STRIPS[1].length,
          (t / 58) % STRIPS[2].length,
        ]);
        raf.current = requestAnimationFrame(freeSpin);
      }
      raf.current = requestAnimationFrame(freeSpin);
      return;
    }

    if (!spinning && wasSpin) {
      cancelRaf();
      const isWin = outcome !== null && outcome !== "No Reward";
      const sym = isWin && outcome ? outcomeToSym(outcome) : null;

      const targets: [number, number, number] = sym
        ? (STRIPS.map((strip) => {
            const idx = strip.findIndex((s) => s === sym);
            return idx >= 0 ? idx : 0;
          }) as [number, number, number])
        : pickLoseTargets();

      const STOP_DELAYS = [0, 750, 1900];
      const EASE_DUR = 500;
      const settleStart = performance.now();
      const startPos: [number, number, number] = [...posRef.current] as [number, number, number];
      const stopped: [boolean, boolean, boolean] = [false, false, false];

      setPhase("settling");

      function settleTick(now: number) {
        const t = now - settleStart;
        const np: [number, number, number] = [0, 0, 0];
        let allDone = true;

        for (let r = 0; r < 3; r++) {
          const delay = STOP_DELAYS[r];
          const len = STRIPS[r].length;

          if (t < delay) {
            np[r] = (startPos[r] + t * 0.019) % len;
            allDone = false;
          } else if (t < delay + EASE_DUR) {
            const k = 1 - Math.pow(1 - (t - delay) / EASE_DUR, 3);
            let dist = (targets[r] - startPos[r] + len * 4) % len;
            if (dist < 3) dist += len;
            np[r] = (startPos[r] + dist * k) % len;
            allDone = false;
          } else {
            np[r] = targets[r];
            stopped[r] = true;
          }
        }

        writePos(np);
        setReelStopped([stopped[0], stopped[1], stopped[2]]);

        if (!allDone) {
          raf.current = requestAnimationFrame(settleTick);
        } else {
          setTimeout(() => setPhase(isWin ? "result-win" : "result-lose"), 300);
        }
      }
      raf.current = requestAnimationFrame(settleTick);
      return;
    }

    if (!spinning && !outcome) {
      setPhase("idle");
      setReelStopped([true, true, true]);
    }

    return cancelRaf;
  }, [spinning, outcome]);

  return { positions, phase, reelStopped };
}
