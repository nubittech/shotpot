"use client";

import { useEffect, useMemo, useState } from "react";

type SlotMachineProps = {
  tokens: number;
  outcome: string | null;
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
};

const symbols = ["7", "BAR", "STAR", "LOGO", "LATTE", "CAKE"];

export function SlotMachine({ tokens, outcome, spinning, canSpin, onSpin }: SlotMachineProps) {
  const [reels, setReels] = useState(["7", "BAR", "STAR"]);

  useEffect(() => {
    if (!spinning) return;

    const interval = window.setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 90);

    return () => window.clearInterval(interval);
  }, [spinning]);

  useEffect(() => {
    if (!outcome) return;

    if (outcome === "No Reward") {
      setReels(["7", "BAR", "STAR"]);
      return;
    }

    const rewardSymbol = normalizeOutcomeToSymbol(outcome);
    setReels([rewardSymbol, rewardSymbol, rewardSymbol]);
  }, [outcome]);

  const status = useMemo(() => {
    if (spinning) return "Reels donuyor...";
    if (outcome) return outcome === "No Reward" ? "Bu turda jackpot yok." : `${outcome} kazanildi.`;
    if (tokens > 0) return "Jeton hazir. Kolu cekebilirsin.";
    return "Jeton almak icin fiş cek ve dogrula.";
  }, [outcome, spinning, tokens]);

  return (
    <section className="slot-machine">
      <div className="slot-topbar">
        <span className="slot-badge">Jackpot</span>
        <span className="slot-tokens">Jeton: {tokens}</span>
      </div>

      <div className="slot-window">
        {reels.map((reel, index) => (
          <div className={`slot-reel ${spinning ? "is-spinning" : ""}`} key={`${reel}-${index}`}>
            {reel}
          </div>
        ))}
      </div>

      <div className="slot-controls">
        <button className="lever-button" disabled={!canSpin || spinning} onClick={onSpin} type="button">
          <span className={`lever-stick ${spinning ? "pulled" : ""}`} />
          <span className="lever-knob" />
        </button>
        <div>
          <h3 className="slot-title">Kolu Cek</h3>
          <p className="muted">{status}</p>
        </div>
      </div>
    </section>
  );
}

function normalizeOutcomeToSymbol(outcome: string) {
  if (outcome.toLowerCase().includes("latte")) return "LATTE";
  if (outcome.toLowerCase().includes("suffle")) return "CAKE";
  return "LOGO";
}
