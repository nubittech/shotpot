"use client";

import { useState } from "react";

/** One-click win-back: grants a gift-wheel spin to all dormant customers.
 *  They see it next time they open the app (or via push once enabled). */
export function WinBackButton({ slug, label, busyLabel, doneLabel }: {
  slug: string; label: string; busyLabel: string; doneLabel: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function run() {
    setState("busy"); setMsg("");
    try {
      const r = await fetch("/api/dashboard/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, audience: "dormant30", count: 1 }),
      });
      const d = await r.json() as { customers?: number; error?: string };
      if (!r.ok) { setState("error"); setMsg(d.error ?? "hata"); return; }
      setState("done"); setMsg(doneLabel.replace("{n}", String(d.customers ?? 0)));
    } catch {
      setState("error"); setMsg("hata");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <button onClick={run} disabled={state === "busy" || state === "done"} style={{
        padding: "9px 16px", borderRadius: 10, cursor: state === "busy" ? "default" : "pointer",
        background: state === "done" ? "rgba(74,222,128,0.15)" : "#ffd84e",
        border: "none", color: state === "done" ? "#4ade80" : "#111",
        fontSize: 13, fontWeight: 800, opacity: state === "busy" ? 0.7 : 1,
      }}>
        {state === "busy" ? busyLabel : state === "done" ? "✓" : `🎁 ${label}`}
      </button>
      {msg && <span style={{ fontSize: 12, color: state === "error" ? "#f87171" : "#4ade80" }}>{msg}</span>}
    </div>
  );
}
