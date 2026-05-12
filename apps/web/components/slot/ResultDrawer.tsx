"use client";

import type { Phase } from "./useSlotEngine";

interface DrawerPalette {
  winBg: string;
  winBorder: string;
  winGlow: string;
  winText: string;
  winShadow: string;
  loseBg: string;
  loseBorder: string;
  loseText: string;
  btnBg: string;
  btnText: string;
  btnBorder: string;
  titleFont: string;
}

interface ResultDrawerProps {
  phase: Phase;
  payout: string | null;
  onReset: () => void;
  onShowCoupon?: () => void;
  onExit?: () => void;
  canContinue?: boolean;
  palette: DrawerPalette;
  labels?: {
    won: string;
    ready: string;
    couponAdded: string;
    showCoupon: string;
    notThisRound: string;
    nextTime: string;
    tryAgainHint: string;
    scanAgainHint: string;
    retry: string;
    exit: string;
    backMenu: string;
  };
}

export function ResultDrawer({ phase, payout, onReset, onShowCoupon, onExit, canContinue = true, palette, labels }: ResultDrawerProps) {
  const visible = phase === "result-win" || phase === "result-lose";
  const won = phase === "result-win";
  const t = labels ?? {
    won: "KAZANDIN",
    ready: "Ödülünüz hazır",
    couponAdded: "Kupon cüzdanınıza eklendi · Barman'a gösterin",
    showCoupon: "KUPONU GÖR",
    notThisRound: "BU TUR DEĞİL",
    nextTime: "Bir dahaki sefere.",
    tryAgainHint: "Jetonların var — tekrar dene.",
    scanAgainHint: "Yeni fiş yükleyince tekrar oyna.",
    retry: "TEKRAR DENE",
    exit: "ÇIKIŞ",
    backMenu: "MENÜYE DÖN",
  };

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.55s cubic-bezier(.2,1.1,.3,1) 0.1s",
      padding: "24px 22px 32px",
      background: "linear-gradient(180deg,rgba(6,2,1,0) 0%,rgba(6,2,1,0.96) 22%,rgba(6,2,1,1) 100%)",
      zIndex: 60,
    }}>
      {visible && won && (
        <div style={{
          padding: "20px 20px 22px",
          borderRadius: 20,
          background: palette.winBg,
          border: `2px solid ${palette.winBorder}`,
          boxShadow: `0 0 32px 4px ${palette.winGlow},0 16px 32px rgba(0,0,0,0.5)`,
          color: palette.winText,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em" }}>{t.won}</div>
          <div style={{
            fontFamily: palette.titleFont,
            fontSize: 28, fontWeight: 900,
            margin: "6px 0 8px",
            textShadow: palette.winShadow,
          }}>
            {payout ?? t.ready}
          </div>
          <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 600, lineHeight: 1.5 }}>
            {t.couponAdded}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onShowCoupon ?? onReset} style={{
              flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
              background: palette.btnBg, color: palette.btnText,
              fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
            }}>
              {t.showCoupon}
            </button>
            <button onClick={onReset} style={{
              padding: "13px 18px", borderRadius: 12,
              border: `1.5px solid ${palette.btnBorder}`,
              background: "transparent",
              color: palette.winText, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              OK
            </button>
          </div>
        </div>
      )}

      {visible && !won && (
        <div style={{
          padding: "20px 20px 22px", borderRadius: 20,
          background: palette.loseBg,
          border: `1px solid ${palette.loseBorder}`,
          color: palette.loseText, textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", opacity: 0.6 }}>
            {t.notThisRound}
          </div>
          <div style={{
            fontFamily: palette.titleFont,
            fontSize: 26, fontWeight: 700,
            margin: "6px 0 6px",
          }}>
            {t.nextTime}
          </div>
          <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 500, lineHeight: 1.5 }}>
            {canContinue ? t.tryAgainHint : t.scanAgainHint}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {canContinue && (
              <button onClick={onReset} style={{
                flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
                background: palette.btnBg, color: palette.btnText,
                fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
              }}>
                {t.retry}
              </button>
            )}
            <button onClick={onExit ?? onReset} style={{
              flex: canContinue ? "0 0 auto" : 1,
              padding: canContinue ? "13px 18px" : "13px 0",
              borderRadius: 12, border: `1.5px solid ${palette.loseBorder}`,
              background: "transparent",
              color: palette.loseText, fontSize: 13, fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer",
            }}>
              {canContinue ? t.exit : t.backMenu}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
