"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Convo = {
  id: string; visitor_id: string; visitor_name: string | null; visitor_email: string | null;
  status: "open" | "closed"; mode: "ai" | "human"; locale: string;
  last_message_at: string; preview: string; previewRole: string; unread: boolean;
};
type Msg = { id: string; role: "visitor" | "ai" | "admin"; content: string; created_at: string };

export function AdminChatClient() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [mode, setMode] = useState<"ai" | "human">("ai");
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const selRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat");
      if (!res.ok) return;
      const data = await res.json() as { conversations: Convo[] };
      setConvos(data.conversations ?? []);
    } catch { /* silent */ }
  }, []);

  const loadConvo = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chat?conversationId=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json() as { conversation: Convo; messages: Msg[] };
      setMessages(data.messages ?? []);
      setMode(data.conversation.mode);
      setStatus(data.conversation.status);
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadList(); const t = setInterval(loadList, 6000); return () => clearInterval(t); }, [loadList]);

  useEffect(() => {
    selRef.current = selected;
    if (!selected) return;
    loadConvo(selected);
    const t = setInterval(() => { if (selRef.current) loadConvo(selRef.current); }, 4000);
    return () => clearInterval(t);
  }, [selected, loadConvo]);

  const send = async () => {
    const text = reply.trim();
    if (!text || !selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selected, message: text }),
      });
      if (res.ok) { setReply(""); await loadConvo(selected); await loadList(); }
    } finally { setBusy(false); }
  };

  const patch = async (body: { mode?: string; status?: string }) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fetch("/api/admin/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected, ...body }) });
      await loadConvo(selected); await loadList();
    } finally { setBusy(false); }
  };

  const title = (c: Convo) => c.visitor_name || c.visitor_email || `Ziyaretçi ${c.visitor_id.slice(0, 6)}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, height: "calc(100vh - 200px)", minHeight: 460 }}>
      {/* List */}
      <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, background: "#0f0f0f", overflowY: "auto" }}>
        {convos.length === 0 && <div style={{ color: "#666", fontSize: 13, padding: 20, textAlign: "center" }}>Henüz sohbet yok.</div>}
        {convos.map((c) => (
          <button key={c.id} onClick={() => setSelected(c.id)} style={{
            width: "100%", textAlign: "left", padding: "12px 14px", border: "none", borderBottom: "1px solid #161616",
            background: selected === c.id ? "#1a1a1a" : "transparent", cursor: "pointer", color: "#ddd",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {c.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e6b800", flexShrink: 0 }} />}
              <span style={{ fontWeight: 700, fontSize: 13, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title(c)}</span>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: c.mode === "human" ? "rgba(123,224,138,0.15)" : "rgba(123,179,255,0.15)", color: c.mode === "human" ? "#7be08a" : "#7bb3ff", fontWeight: 700 }}>
                {c.mode === "human" ? "İnsan" : "AI"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.previewRole === "visitor" ? "" : c.previewRole === "admin" ? "↪ " : "🤖 "}{c.preview}
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>
              {new Date(c.last_message_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              {c.status === "closed" && " · kapalı"}
            </div>
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div style={{ border: "1px solid #1a1a1a", borderRadius: 10, background: "#0f0f0f", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 14 }}>Soldan bir sohbet seç</div>
        ) : (
          <>
            <header style={{ padding: "10px 14px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, fontSize: 13, color: "#bbb" }}>
                {(() => { const c = convos.find((x) => x.id === selected); return c ? title(c) : ""; })()}
                {(() => { const c = convos.find((x) => x.id === selected); return c?.visitor_email ? <span style={{ color: "#666" }}> · {c.visitor_email}</span> : null; })()}
              </div>
              <span style={{ fontSize: 11, color: mode === "human" ? "#7be08a" : "#7bb3ff", fontWeight: 700 }}>{mode === "human" ? "İnsan modu" : "AI modu"}</span>
              {mode === "human" && <button onClick={() => patch({ mode: "ai" })} disabled={busy} style={btnSmall}>AI&apos;ya devret</button>}
              <button onClick={() => patch({ status: status === "open" ? "closed" : "open" })} disabled={busy} style={btnSmallGhost}>{status === "open" ? "Kapat" : "Aç"}</button>
            </header>

            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {messages.map((m) => {
                const isVisitor = m.role === "visitor";
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isVisitor ? "flex-start" : "flex-end", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: "#666", margin: "0 4px 2px" }}>{m.role === "visitor" ? "Ziyaretçi" : m.role === "ai" ? "AI" : "Sen"}</span>
                    <div style={{
                      maxWidth: "75%", padding: "8px 12px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      background: isVisitor ? "#1a1a1a" : m.role === "ai" ? "rgba(123,179,255,0.12)" : "#2d6b3a",
                      color: isVisitor ? "#e8e8e8" : m.role === "ai" ? "#cfe0ff" : "#fff",
                      border: m.role === "ai" ? "1px solid rgba(123,179,255,0.25)" : "none",
                    }}>{m.content}</div>
                    <span style={{ fontSize: 9, color: "#444", margin: "2px 4px 0" }}>{new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #1a1a1a" }}>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Yanıt yaz… (yazınca sohbet insan moduna geçer)"
                style={{ flex: 1, padding: "10px 12px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14 }}
              />
              <button onClick={send} disabled={busy || !reply.trim()} style={{ padding: "10px 18px", background: "#3a5b9e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Gönder</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnSmall: React.CSSProperties = { padding: "5px 10px", background: "#3a5b9e", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 12 };
const btnSmallGhost: React.CSSProperties = { padding: "5px 10px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#bbb", fontWeight: 600, cursor: "pointer", fontSize: 12 };
