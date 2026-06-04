"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getClientCopy, getClientLocale } from "../lib/i18n/client";

type Msg = { id: string; role: "visitor" | "ai" | "admin"; content: string };

const LS_VISITOR = "snapjack_chat_visitor";
const LS_CONVO = "snapjack_chat_convo";

function newId() {
  try { return crypto.randomUUID(); } catch { return `v_${Math.random().toString(36).slice(2)}${Date.now()}`; }
}

export function ChatWidget() {
  const copy = getClientCopy().chatWidget;
  const locale = getClientLocale();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const visitorId = useRef<string>("");
  const convoId = useRef<string>("");
  const after = useRef<string>("");
  const knownIds = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vid = localStorage.getItem(LS_VISITOR);
    if (!vid) { vid = newId(); localStorage.setItem(LS_VISITOR, vid); }
    visitorId.current = vid;
    convoId.current = localStorage.getItem(LS_CONVO) ?? "";
    setMounted(true);
  }, []);

  const scrollToEnd = () => {
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  };

  const poll = useCallback(async () => {
    if (!convoId.current || !visitorId.current) return;
    try {
      const url = `/api/chat?conversationId=${encodeURIComponent(convoId.current)}&visitorId=${encodeURIComponent(visitorId.current)}${after.current ? `&after=${encodeURIComponent(after.current)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json() as { messages: Array<{ id: string; role: Msg["role"]; content: string; created_at: string }> };
      const fresh = (data.messages ?? []).filter((m) => m.role !== "visitor" && !knownIds.current.has(m.id));
      if (fresh.length > 0) {
        fresh.forEach((m) => knownIds.current.add(m.id));
        setMessages((prev) => [...prev, ...fresh.map((m) => ({ id: m.id, role: m.role, content: m.content }))]);
        scrollToEnd();
      }
      const last = (data.messages ?? [])[data.messages.length - 1];
      if (last) after.current = last.created_at;
    } catch { /* silent */ }
  }, []);

  // background polling while open
  useEffect(() => {
    if (!open || !mounted) return;
    const t = setInterval(poll, 4000);
    poll();
    return () => clearInterval(t);
  }, [open, mounted, poll]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError("");
    setInput("");
    setMessages((prev) => [...prev, { id: `tmp_${newId()}`, role: "visitor", content: text }]);
    setSending(true);
    scrollToEnd();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId.current, conversationId: convoId.current || undefined, message: text, locale }),
      });
      const data = await res.json() as { conversationId?: string; error?: string };
      if (!res.ok) throw new Error(data.error || copy.errorSend);
      if (data.conversationId && data.conversationId !== convoId.current) {
        convoId.current = data.conversationId;
        localStorage.setItem(LS_CONVO, data.conversationId);
      }
      await poll(); // pull the authoritative AI/admin reply
    } catch {
      setError(copy.errorSend);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label={copy.launcher} style={launcher}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" fill="#0a0a0c"/></svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={panel}>
          <header style={head}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={avatar}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{copy.title}</div>
                <div style={{ fontSize: 11, color: "rgba(10,10,12,0.6)" }}>{copy.subtitle}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label={copy.closeAria} style={closeBtn}>×</button>
          </header>

          <div ref={scrollRef} style={body}>
            <Bubble role="ai" copy={copy}>{copy.greeting}</Bubble>
            {messages.map((m) => <Bubble key={m.id} role={m.role} copy={copy}>{m.content}</Bubble>)}
            {sending && <Bubble role="ai" copy={copy}><span style={{ opacity: 0.6 }}>{copy.sending}</span></Bubble>}
            {error && <div style={{ color: "#c0392b", fontSize: 12, textAlign: "center", margin: "6px 0" }}>{error}</div>}
          </div>

          <div style={footer}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={copy.placeholder}
              style={textInput}
            />
            <button onClick={send} disabled={sending || !input.trim()} style={sendBtn} aria-label={copy.send}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11l18-8-8 18-2-7-8-3Z" fill="#0a0a0c"/></svg>
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: "rgba(244,239,230,0.3)", padding: "0 0 8px" }}>{copy.poweredBy}</div>
        </div>
      )}
    </>
  );
}

function Bubble({ role, children, copy }: { role: Msg["role"]; children: React.ReactNode; copy: { aiLabel: string; teamLabel: string } }) {
  const isVisitor = role === "visitor";
  const label = role === "admin" ? copy.teamLabel : role === "ai" ? copy.aiLabel : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isVisitor ? "flex-end" : "flex-start", marginBottom: 10 }}>
      {label && <span style={{ fontSize: 10, color: role === "admin" ? "#7be08a" : "rgba(244,239,230,0.4)", margin: "0 4px 2px", fontWeight: 600 }}>{label}</span>}
      <div style={{
        maxWidth: "82%", padding: "9px 12px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
        background: isVisitor ? "#ffd84e" : role === "admin" ? "rgba(123,224,138,0.14)" : "rgba(255,255,255,0.06)",
        color: isVisitor ? "#0a0a0c" : "#f4efe6",
        border: isVisitor ? "none" : `1px solid ${role === "admin" ? "rgba(123,224,138,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderBottomRightRadius: isVisitor ? 4 : 14, borderBottomLeftRadius: isVisitor ? 14 : 4,
      }}>{children}</div>
    </div>
  );
}

const launcher: React.CSSProperties = {
  position: "fixed", bottom: 22, right: 22, zIndex: 9000,
  width: 56, height: 56, borderRadius: "50%", background: "#ffd84e",
  border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const panel: React.CSSProperties = {
  position: "fixed", bottom: 22, right: 22, zIndex: 9000,
  width: "min(380px, calc(100vw - 32px))", height: "min(560px, calc(100vh - 60px))",
  background: "#0f0f12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
  display: "flex", flexDirection: "column", overflow: "hidden",
  boxShadow: "0 16px 48px rgba(0,0,0,0.5)", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
};
const head: React.CSSProperties = { background: "#ffd84e", color: "#0a0a0c", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" };
const avatar: React.CSSProperties = { width: 34, height: 34, borderRadius: "50%", background: "rgba(10,10,12,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 };
const closeBtn: React.CSSProperties = { background: "transparent", border: "none", color: "#0a0a0c", fontSize: 26, lineHeight: 1, cursor: "pointer", fontWeight: 400 };
const body: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "14px", background: "#0a0a0c" };
const footer: React.CSSProperties = { display: "flex", gap: 8, padding: "10px 12px 6px", background: "#0f0f12" };
const textInput: React.CSSProperties = { flex: 1, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#f4efe6", fontSize: 14, outline: "none" };
const sendBtn: React.CSSProperties = { width: 40, borderRadius: 10, background: "#ffd84e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
