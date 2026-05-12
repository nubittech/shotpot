"use client";

import { Reel } from "./Reel";
import { Lever } from "./Lever";
import { Confetti } from "./Confetti";
import { ResultDrawer } from "./ResultDrawer";
import { useSlotEngine } from "./useSlotEngine";
import type { SlotVariantProps } from "./types";

const LEV = {
  railHi:"#5a4a1a", railLo:"#1a1408",
  shaftLo:"#7a6228", shaftHi:"#e8c876",
  knobHi:"#fce69a", knobMid:"#caa14a", knobLo:"#5a4218", knobRim:"#1a1408",
  hint:"#caa14a",
};
const CONFETTI = ["#caa14a","#f5d27a","#3a3018","#fff8e0","#8a6e2a","#1a1408"];
const DRAWER = {
  winBg:"linear-gradient(160deg,#14100a 0%,#0a0805 100%)",
  winBorder:"#caa14a", winGlow:"rgba(202,161,74,0.5)", winText:"#f5d27a",
  winShadow:"0 1px 0 #5a4218",
  loseBg:"rgba(5,4,2,0.97)",
  loseBorder:"rgba(202,161,74,0.3)", loseText:"rgba(202,161,74,0.9)",
  btnBg:"#caa14a", btnText:"#0a0805", btnBorder:"#caa14a",
  titleFont:"'Cinzel','Georgia',serif",
};

function DecoCorner({ pos }: { pos: "tl"|"tr"|"br"|"bl" }) {
  const map = {
    tl:{ top:4,left:4,transform:"rotate(0deg)" },
    tr:{ top:4,right:4,transform:"rotate(90deg)" },
    br:{ bottom:4,right:4,transform:"rotate(180deg)" },
    bl:{ bottom:4,left:4,transform:"rotate(270deg)" },
  };
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ position:"absolute",...(map[pos] as object) }}>
      <path d="M2 2 L22 2 L22 4 L8 4 L8 8 L4 8 L4 22 L2 22 Z" fill="rgba(202,161,74,0.65)" />
      <circle cx="12" cy="12" r="1.4" fill="#caa14a" />
    </svg>
  );
}

export function V3Deco({ tokens, outcome, spinning, canSpin, onSpin, venueName, labels, onBack, onReset, onShowCoupon, onExit }: SlotVariantProps) {
  const display = (venueName ?? "MIDNIGHT TAP").toUpperCase();
  const { positions, phase } = useSlotEngine({ spinning, outcome });
  const isAnim = phase === "spinning" || phase === "settling";
  const won = phase === "result-win";
  const lost = phase === "result-lose";

  return (
    <div style={{
      position:"absolute",inset:0,paddingTop:60,overflow:"hidden",
      background:"radial-gradient(80% 60% at 50% 30%,#1a1408 0%,#0a0805 70%,#050402 100%)",
      animation: won ? "shake-frame 0.45s ease-in-out 2" : "none",
    }}>
      {/* Deco sunburst */}
      <div style={{ position:"absolute",top:-100,left:"50%",transform:"translateX(-50%)",
        width:600,height:600,
        background:"conic-gradient(from -90deg,transparent 0deg,rgba(202,161,74,0.06) 12deg,transparent 24deg,rgba(202,161,74,0.06) 36deg,transparent 48deg,rgba(202,161,74,0.06) 60deg,transparent 72deg,rgba(202,161,74,0.06) 84deg,transparent 96deg,rgba(202,161,74,0.06) 108deg,transparent 120deg,rgba(202,161,74,0.06) 132deg,transparent 144deg,rgba(202,161,74,0.06) 156deg,transparent 168deg,rgba(202,161,74,0.06) 180deg)",
        pointerEvents:"none",zIndex:0 }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 18px 10px",position:"relative",zIndex:5 }}>
        {onBack ? (
          <button onClick={onBack} style={{ width:34,height:34,borderRadius:2,background:"transparent",border:"1px solid rgba(202,161,74,0.4)",color:"#caa14a",cursor:"pointer",fontSize:14 }}>‹</button>
        ) : <div style={{ width:34 }} />}
        <div style={{ fontFamily:"'Cinzel','Georgia',serif",fontSize:28,fontWeight:900,
          color:"#f5d27a",letterSpacing:"0.2em",textTransform:"uppercase",
          textShadow:"0 1px 0 #5a4218, 0 0 18px rgba(202,161,74,0.4)" }}>Jackpot</div>
        <div style={{ fontSize:12,fontWeight:700,letterSpacing:"0.2em",color:"#f5d27a",
          padding:"7px 12px",borderRadius:2,background:"rgba(202,161,74,0.06)",
          border:"1px solid rgba(202,161,74,0.5)" }}>{tokens} {labels?.tokens ?? "JETON"}</div>
      </div>

      <div style={{ margin:"8px 48px 0 18px",padding:16,borderRadius:6,position:"relative",zIndex:2,
        background:"linear-gradient(160deg,#14100a 0%,#0a0805 100%)",
        border:"1.5px solid #caa14a",
        boxShadow:"0 0 0 4px #0a0805,0 0 0 5.5px rgba(202,161,74,0.5),0 16px 40px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,230,170,0.18)" }}>

        <DecoCorner pos="tl" /><DecoCorner pos="tr" />
        <DecoCorner pos="bl" /><DecoCorner pos="br" />

        {/* Marquee */}
        <div style={{ position:"relative",height:64,borderRadius:2,background:"#0a0805",
          border:"1px solid rgba(202,161,74,0.5)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
          <svg width="180" height="20" viewBox="0 0 180 20" style={{ position:"absolute",top:-1 }}>
            <path d="M0 0 L180 0 L160 14 L20 14 Z" fill="rgba(202,161,74,0.12)" stroke="rgba(202,161,74,0.5)" strokeWidth="0.8"/>
            <line x1="60" y1="0" x2="50" y2="14" stroke="rgba(202,161,74,0.4)" strokeWidth="0.5"/>
            <line x1="90" y1="0" x2="90" y2="14" stroke="rgba(202,161,74,0.4)" strokeWidth="0.5"/>
            <line x1="120" y1="0" x2="130" y2="14" stroke="rgba(202,161,74,0.4)" strokeWidth="0.5"/>
          </svg>
          <div style={{ fontFamily:"'Cinzel','Georgia',serif",fontSize:11,fontWeight:700,color:"#caa14a",letterSpacing:"0.32em",marginTop:10 }}>EST · MMXXIV</div>
          <div style={{ fontFamily:"'Cinzel','Georgia',serif",fontSize:24,fontWeight:900,color:"#f5d27a",letterSpacing:"0.18em",textShadow:"0 1px 0 #5a4218" }}>{display}</div>
        </div>

        {/* Reels */}
        <div style={{ marginTop:12,padding:"14px 12px",borderRadius:4,
          background:"linear-gradient(180deg,#050402 0%,#0a0805 100%)",
          border:"1px solid rgba(202,161,74,0.5)",
          boxShadow:"inset 0 4px 12px rgba(0,0,0,0.85),0 0 0 1px #0a0805,0 0 0 2.5px rgba(202,161,74,0.25)",
          position:"relative" }}>
          <div style={{ position:"absolute",left:4,right:4,top:"50%",height:1,transform:"translateY(-0.5px)",
            background: won
              ? "linear-gradient(90deg,transparent,#f5d27a,transparent)"
              : "rgba(202,161,74,0.3)",
            boxShadow: won ? "0 0 10px 1px #caa14a" : "none",
            zIndex:3,pointerEvents:"none" }} />

          <div style={{ display:"flex",gap:6,position:"relative" }}>
            {[0,1,2].map(r => (
              <div key={r} style={{ flex:1,borderRadius:2,overflow:"hidden",
                background:"linear-gradient(180deg,#f7e6b3 0%,#e8d28a 50%,#f7e6b3 100%)",
                position:"relative",border:"1px solid rgba(90,66,24,0.6)" }}>
                <Reel reelIndex={r} position={positions[r]} tone="deco" height={108} symbolHeight={108} symbolScale={0.82} />
                {won && <div style={{ position:"absolute",inset:0,pointerEvents:"none",
                  boxShadow:"inset 0 0 18px 3px rgba(245,210,122,0.85)",animation:"pulse-glow 0.55s ease-in-out infinite" }} />}
              </div>
            ))}
          </div>

          <div style={{ display:"flex",justifyContent:"space-around",marginTop:4 }}>
            {[0,1,2].map(i => <div key={i} style={{ width:4,height:4,borderRadius:"50%",background:"#caa14a" }} />)}
          </div>
        </div>

        <div style={{ marginTop:12,textAlign:"center",fontSize:11,fontWeight:600,letterSpacing:"0.3em",
          color:"rgba(202,161,74,0.85)",textTransform:"uppercase" }}>
          {labels?.triplePays ?? "✦ ÜÇLÜ EŞLEŞİM ÖDER ✦"}
        </div>

        {/* Lever */}
        <div style={{ position:"absolute",right:-42,top:96 }}>
          <Lever disabled={isAnim || won || lost || !canSpin} onPull={onSpin} palette={LEV} height={200} />
        </div>
      </div>

      <ResultDrawer phase={phase} payout={outcome !== "No Reward" ? outcome : null} onReset={onReset ?? (() => {})} onShowCoupon={onShowCoupon} onExit={onExit} canContinue={tokens > 0} palette={DRAWER} labels={labels} />
      <Confetti run={won} colors={CONFETTI} />
    </div>
  );
}
