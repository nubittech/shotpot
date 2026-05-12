"use client";

import { Reel } from "./Reel";
import { Lever } from "./Lever";
import { Confetti } from "./Confetti";
import { ResultDrawer } from "./ResultDrawer";
import { useSlotEngine } from "./useSlotEngine";
import type { SlotVariantProps } from "./types";

const LEV = {
  railHi:"#1a1428", railLo:"#0a0014",
  shaftLo:"#3a2858", shaftHi:"#a880ff",
  knobHi:"#ff7ac2", knobMid:"#ff2d8a", knobLo:"#7e1cf5", knobRim:"#22002e",
  hint:"#ff7ac2",
};
const CONFETTI = ["#ff2d8a","#7e1cf5","#00e8ff","#ffd54a","#ffffff","#ff7ac2"];
const DRAWER = {
  winBg:"linear-gradient(160deg,#1a0228,#0a0014)",
  winBorder:"rgba(255,45,138,0.7)", winGlow:"rgba(255,45,138,0.55)", winText:"#ff7ac2",
  winShadow:"0 0 12px #ff2d8a",
  loseBg:"rgba(5,0,8,0.97)",
  loseBorder:"rgba(255,45,138,0.2)", loseText:"rgba(255,122,194,0.9)",
  btnBg:"#ff2d8a", btnText:"#0a0014", btnBorder:"#ff7ac2",
  titleFont:"'Bebas Neue','Impact',sans-serif",
};

export function V2Neon({ tokens, outcome, spinning, canSpin, onSpin, venueName, labels, onBack, onReset, onShowCoupon, onExit }: SlotVariantProps) {
  const display = (venueName ?? "MIDNIGHT TAP").toUpperCase();
  const { positions, phase } = useSlotEngine({ spinning, outcome });
  const isAnim = phase === "spinning" || phase === "settling";
  const won = phase === "result-win";
  const lost = phase === "result-lose";

  return (
    <div style={{
      position:"absolute",inset:0,paddingTop:60,overflow:"hidden",
      background:`radial-gradient(60% 50% at 50% 0%,rgba(255,45,138,0.18),transparent 70%),
        radial-gradient(40% 40% at 100% 100%,rgba(0,232,255,0.14),transparent 70%),
        linear-gradient(180deg,#0a0014 0%,#050008 100%)`,
      animation: won ? "shake-frame 0.45s ease-in-out 2" : "none",
    }}>
      {/* Cyber grid floor */}
      <div style={{ position:"absolute",left:0,right:0,bottom:80,height:200,
        background:`linear-gradient(180deg,transparent 0%,rgba(255,45,138,0.06) 100%),
          repeating-linear-gradient(0deg,rgba(255,45,138,0.18) 0 1px,transparent 1px 24px),
          repeating-linear-gradient(90deg,rgba(255,45,138,0.18) 0 1px,transparent 1px 24px)`,
        transform:"perspective(360px) rotateX(60deg)",transformOrigin:"top center",
        opacity:0.5,pointerEvents:"none" }} />

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 18px 10px" }}>
        {onBack ? (
          <button onClick={onBack} style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,45,138,0.12)",border:"1px solid rgba(255,45,138,0.4)",color:"#ff7ac2",cursor:"pointer",fontSize:14 }}>‹</button>
        ) : <div style={{ width:34 }} />}
        <div style={{ fontFamily:"'Bebas Neue','Impact',sans-serif",fontSize:34,fontWeight:400,
          color:"#ff7ac2",letterSpacing:"0.22em",
          textShadow:"0 0 12px #ff2d8a,0 0 24px #ff2d8a,0 0 36px rgba(255,45,138,0.6)",
          animation:"neon-flicker 6s linear infinite" }}>JACKPOT</div>
        <div style={{ fontSize:12,fontWeight:700,letterSpacing:"0.18em",color:"#00e8ff",
          padding:"7px 12px",borderRadius:12,background:"rgba(0,232,255,0.08)",
          border:"1px solid rgba(0,232,255,0.4)",textShadow:"0 0 6px #00e8ff" }}>{tokens} {labels?.tokens ?? "JETON"}</div>
      </div>

      <div style={{ margin:"8px 48px 0 18px",padding:14,borderRadius:22,position:"relative",
        background:"linear-gradient(160deg,#1a0228 0%,#0a0014 100%)",
        border:"1.5px solid rgba(255,45,138,0.35)",
        boxShadow:"0 0 24px 2px rgba(255,45,138,0.4),inset 0 0 30px rgba(126,28,245,0.18),0 14px 30px rgba(0,0,0,0.7)" }}>

        {/* Marquee */}
        <div style={{ position:"relative",height:54,borderRadius:12,
          background:"linear-gradient(180deg,#1a0228 0%,#0a0014 100%)",
          border:"1.5px solid rgba(0,232,255,0.5)",
          boxShadow:"inset 0 0 18px rgba(0,232,255,0.25),0 0 14px rgba(0,232,255,0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
          <div style={{ fontFamily:"'Bebas Neue','Impact',sans-serif",fontSize:32,fontWeight:400,
            color:"#fff",letterSpacing:"0.18em",
            textShadow:"0 0 8px #ff2d8a,0 0 16px #ff2d8a,0 0 32px #ff2d8a",
            animation:"neon-flicker 5s linear infinite" }}>
            {display}
          </div>
        </div>

        {/* Reels */}
        <div style={{ marginTop:12,padding:"14px 12px",borderRadius:12,background:"#000",
          border:"1.5px solid rgba(255,45,138,0.45)",
          boxShadow:"inset 0 0 20px rgba(255,45,138,0.25),0 0 18px rgba(255,45,138,0.35)",
          position:"relative" }}>
          <div style={{ position:"absolute",left:6,right:6,top:"50%",height:2,transform:"translateY(-1px)",
            background: won
              ? "linear-gradient(90deg,transparent,#00e8ff,#ff2d8a,#00e8ff,transparent)"
              : "linear-gradient(90deg,transparent,rgba(0,232,255,0.5),transparent)",
            boxShadow: won ? "0 0 14px 2px #00e8ff" : "0 0 6px rgba(0,232,255,0.5)",
            zIndex:3,pointerEvents:"none" }} />

          <div style={{ display:"flex",gap:8,position:"relative" }}>
            {[0,1,2].map(r => (
              <div key={r} style={{ flex:1,borderRadius:6,overflow:"hidden",
                background:"linear-gradient(180deg,#fbeaff 0%,#ffd6ec 50%,#fbeaff 100%)",
                position:"relative",boxShadow:"inset 0 0 0 1px rgba(255,45,138,0.4)" }}>
                <Reel reelIndex={r} position={positions[r]} tone="neon" height={108} symbolHeight={108} symbolScale={0.84} />
                {won && <div style={{ position:"absolute",inset:0,pointerEvents:"none",
                  boxShadow:"inset 0 0 24px 4px rgba(255,45,138,0.8)",animation:"pulse-glow 0.45s ease-in-out infinite" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Pay-table */}
        <div style={{ marginTop:10,padding:"8px 12px",borderRadius:8,background:"rgba(0,232,255,0.04)",
          border:"1px solid rgba(0,232,255,0.25)",fontSize:11,fontWeight:600,letterSpacing:"0.14em",
          color:"#00e8ff",textTransform:"uppercase",display:"flex",justifyContent:"space-between",
          textShadow:"0 0 4px rgba(0,232,255,0.5)" }}>
          <span>{labels?.payline ?? "3 aynı · kazan"}</span>
          <span style={{ color:"#ff7ac2" }}>{labels?.jackpotLine ?? "★ 7-7-7 · jackpot"}</span>
        </div>

        {/* Lever */}
        <div style={{ position:"absolute",right:-40,top:76 }}>
          <Lever disabled={isAnim || won || lost || !canSpin} onPull={onSpin} palette={LEV} height={200} />
        </div>

        <div style={{ marginTop:14,height:22,borderRadius:4,background:"rgba(0,0,0,0.7)",
          border:"1px solid rgba(255,45,138,0.3)",boxShadow:"inset 0 0 6px rgba(255,45,138,0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:10,color:"#ff7ac2",fontWeight:700,letterSpacing:"0.24em",
          textShadow:"0 0 4px #ff2d8a" }}>{labels?.receiptVerifiedShort ?? "FİŞ · DOĞRULANDI"}</div>
      </div>

      <ResultDrawer phase={phase} payout={outcome !== "No Reward" ? outcome : null} onReset={onReset ?? (() => {})} onShowCoupon={onShowCoupon} onExit={onExit} canContinue={tokens > 0} palette={DRAWER} labels={labels} />
      <Confetti run={won} colors={CONFETTI} />
    </div>
  );
}
