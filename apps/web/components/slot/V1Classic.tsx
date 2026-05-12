"use client";

import { Reel } from "./Reel";
import { Lever } from "./Lever";
import { Confetti } from "./Confetti";
import { ResultDrawer } from "./ResultDrawer";
import { useSlotEngine } from "./useSlotEngine";
import type { SlotVariantProps } from "./types";

const LEV = {
  railHi:"#7a5a30", railLo:"#3a2010",
  shaftLo:"#9a7a40", shaftHi:"#e0c878",
  knobHi:"#ff5e3a", knobMid:"#c81e35", knobLo:"#5a0a14", knobRim:"#3a0810",
  hint:"#e8c876",
};
const CONFETTI = ["#e8c876","#c81e35","#3a8c3a","#f0b94a","#fff8e0","#5a2a08"];
const DRAWER = {
  winBg:"linear-gradient(160deg,#fff8d0 0%,#f0b94a 60%,#c8841d 100%)",
  winBorder:"#5a2a08", winGlow:"rgba(240,185,74,0.6)", winText:"#3a1808",
  winShadow:"2px 2px 0 #fff8d0",
  loseBg:"linear-gradient(160deg,rgba(40,20,10,0.96),rgba(20,10,4,0.96))",
  loseBorder:"rgba(232,200,118,0.22)", loseText:"#e8c876",
  btnBg:"#3a1808", btnText:"#fff8d0", btnBorder:"#3a1808",
  titleFont:"'Playfair Display',Georgia,serif",
};

function BulbRow() {
  const bulbs = Array.from({ length: 12 }, (_, i) => i);
  return (
    <>
      <div style={{ position:"absolute",top:4,left:6,right:6,height:5,display:"flex",justifyContent:"space-between" }}>
        {bulbs.map(i => <span key={"t"+i} style={{ width:5,height:5,borderRadius:"50%",background:"#fff8d0", animation:`bulb-blink ${1+(i%3)*0.3}s ease-in-out infinite`,animationDelay:`${(i%4)*0.15}s` }} />)}
      </div>
      <div style={{ position:"absolute",bottom:4,left:6,right:6,height:5,display:"flex",justifyContent:"space-between" }}>
        {bulbs.map(i => <span key={"b"+i} style={{ width:5,height:5,borderRadius:"50%",background:"#fff8d0", animation:`bulb-blink ${1+(i%3)*0.3}s ease-in-out infinite`,animationDelay:`${(i%4)*0.15+0.4}s` }} />)}
      </div>
    </>
  );
}

export function V1Classic({ tokens, outcome, spinning, canSpin, onSpin, venueName, labels, onBack, onReset, onShowCoupon, onExit }: SlotVariantProps) {
  const display = (venueName ?? "MIDNIGHT TAP").toUpperCase();
  const { positions, phase } = useSlotEngine({ spinning, outcome });
  const isAnim = phase === "spinning" || phase === "settling";
  const won = phase === "result-win";
  const lost = phase === "result-lose";

  return (
    <div style={{
      position:"absolute",inset:0,paddingTop:60,overflow:"hidden",
      background:"radial-gradient(120% 80% at 50% 0%,#2c1908 0%,#150803 70%,#08030a 100%)",
      animation: won ? "shake-frame 0.45s ease-in-out 2" : "none",
    }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 18px" }}>
        {onBack ? (
          <button onClick={onBack} style={{ width:34,height:34,borderRadius:"50%",background:"rgba(232,200,118,0.08)",border:"1px solid rgba(232,200,118,0.25)",color:"#e8c876",cursor:"pointer",fontSize:14 }}>‹</button>
        ) : <div style={{ width:34 }} />}
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:30,fontWeight:900,color:"#e8c876",letterSpacing:"0.02em",textShadow:"0 2px 12px rgba(232,200,118,0.5),0 0 1px #fff8d0" }}>Jackpot</div>
        <div style={{ fontSize:12,fontWeight:700,letterSpacing:"0.14em",color:"#e8c876",padding:"7px 12px",borderRadius:12,background:"rgba(232,200,118,0.1)",border:"1px solid rgba(232,200,118,0.25)" }}>{tokens} {labels?.tokens ?? "JETON"}</div>
      </div>

      <div style={{ margin:"8px 48px 0 18px",padding:14,borderRadius:22,position:"relative",
        background:"linear-gradient(160deg,#6a3a14 0%,#4a2208 50%,#2a1004 100%)",
        boxShadow:"0 14px 30px rgba(0,0,0,0.7),inset 0 2px 0 rgba(255,200,120,0.25),inset 0 -3px 0 rgba(0,0,0,0.5)" }}>

        {/* Wood grain */}
        <div style={{ position:"absolute",inset:4,borderRadius:18,pointerEvents:"none",
          background:"repeating-linear-gradient(95deg,rgba(40,18,4,0.18) 0 1px,transparent 1px 6px)",
          mixBlendMode:"multiply" }} />

        {/* Marquee */}
        <div style={{ position:"relative",height:54,borderRadius:12,
          background:"linear-gradient(180deg,#c81e35 0%,#8a0a18 100%)",
          border:"2px solid #e8c876",
          boxShadow:"inset 0 2px 4px rgba(255,255,255,0.25),inset 0 -3px 6px rgba(0,0,0,0.45),0 0 14px rgba(200,30,53,0.5)",
          display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
          <BulbRow />
          <div style={{ fontFamily:"'Bebas Neue','Impact',sans-serif",fontSize:26,fontWeight:900,
            color:"#fff8d0",letterSpacing:"0.06em",
            textShadow:"0 0 12px rgba(255,200,120,0.85),2px 2px 0 #5a0a14" }}>
            {display}
          </div>
        </div>

        {/* Reels */}
        <div style={{ marginTop:12,padding:"14px 12px",borderRadius:12,
          background:"linear-gradient(180deg,#2a1208 0%,#1a0804 100%)",
          border:"3px solid #e8c876",
          boxShadow:"inset 0 4px 8px rgba(0,0,0,0.7),0 0 14px rgba(232,200,118,0.2)",
          position:"relative" }}>
          {/* Win line */}
          <div style={{ position:"absolute",left:8,right:8,top:"50%",height:2,transform:"translateY(-1px)",
            background: won ? "linear-gradient(90deg,transparent,#ff5e3a,#ffd54a,#ff5e3a,transparent)"
              : "linear-gradient(90deg,transparent,rgba(232,200,118,0.5),transparent)",
            zIndex:3,pointerEvents:"none",
            boxShadow: won ? "0 0 14px 2px #ff5e3a" : "none",
            transition:"background .3s,box-shadow .3s" }} />

          <div style={{ display:"flex",gap:8,position:"relative" }}>
            {[0,1,2].map(r => (
              <div key={r} style={{ flex:1,borderRadius:8,overflow:"hidden",
                background:"linear-gradient(180deg,#fff8e0 0%,#f3e3c2 50%,#fff8e0 100%)",position:"relative" }}>
                <Reel reelIndex={r} position={positions[r]} tone="warm" height={108} symbolHeight={108} symbolScale={0.84} />
                {won && <div style={{ position:"absolute",inset:0,pointerEvents:"none",
                  boxShadow:"inset 0 0 20px 4px rgba(255,180,80,0.7)",animation:"pulse-glow 0.5s ease-in-out infinite" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Pay-table */}
        <div style={{ marginTop:10,padding:"8px 12px",borderRadius:8,background:"rgba(0,0,0,0.35)",
          border:"1px solid rgba(232,200,118,0.25)",fontSize:11,fontWeight:600,
          letterSpacing:"0.12em",color:"#e8c876",textTransform:"uppercase",
          display:"flex",justifyContent:"space-between" }}>
          <span>{labels?.payline ?? "3 aynı · kazan"}</span>
          <span style={{ color:"#ff8a4a" }}>{labels?.jackpotLine ?? "★ 7-7-7 · jackpot"}</span>
        </div>

        {/* Lever */}
        <div style={{ position:"absolute",right:-40,top:76 }}>
          <Lever disabled={isAnim || won || lost || !canSpin} onPull={onSpin} palette={LEV} height={200} />
        </div>

        {/* Coin slot */}
        <div style={{ marginTop:14,height:22,borderRadius:4,
          background:"linear-gradient(180deg,#1a0804,#3a1a08)",
          border:"1.5px solid #5a2a08",boxShadow:"inset 0 2px 3px rgba(0,0,0,0.7)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:10,color:"#caa14a",fontWeight:700,letterSpacing:"0.22em" }}>
          {labels?.receiptVerified ?? "FİŞ DOĞRULANDI"}
        </div>
      </div>

      {won && <div style={{ position:"absolute",top:"38%",left:"50%",width:600,height:600,
        transform:"translate(-50%,-50%)",
        background:"conic-gradient(from 0deg,rgba(255,200,80,0.16) 0deg,transparent 20deg,rgba(255,200,80,0.16) 40deg,transparent 60deg,rgba(255,200,80,0.16) 80deg,transparent 100deg,rgba(255,200,80,0.16) 120deg,transparent 140deg,rgba(255,200,80,0.16) 160deg,transparent 180deg,rgba(255,200,80,0.16) 200deg,transparent 220deg,rgba(255,200,80,0.16) 240deg,transparent 260deg,rgba(255,200,80,0.16) 280deg,transparent 300deg,rgba(255,200,80,0.16) 320deg,transparent 340deg)",
        animation:"win-rays 14s linear infinite",pointerEvents:"none",zIndex:1 }} />}

      <ResultDrawer phase={phase} payout={outcome !== "No Reward" ? outcome : null} onReset={onReset ?? (() => {})} onShowCoupon={onShowCoupon} onExit={onExit} canContinue={tokens > 0} palette={DRAWER} labels={labels} />
      <Confetti run={won} colors={CONFETTI} />
    </div>
  );
}
