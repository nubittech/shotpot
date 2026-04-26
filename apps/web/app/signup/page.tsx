"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/browser";
import { AuthShell, Field, inputStyle, primaryBtn, errorStyle } from "../../components/auth/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) {
        setErr(error.message);
        return;
      }
      // If email confirmations are off, session is created immediately
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setInfo("E-postanı kontrol et — onay linki gönderdik.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Kaydol" sub="İşletme paneli için yeni hesap oluştur.">
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <Field label="E-posta">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Parola (min 6)">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        </Field>
        {err && <div style={errorStyle}>{err}</div>}
        {info && <div style={{ ...errorStyle, background: "rgba(142,242,161,0.1)", borderColor: "rgba(142,242,161,0.3)", color: "#8ef2a1" }}>{info}</div>}
        <button type="submit" disabled={busy} style={primaryBtn}>
          {busy ? "Kaydediliyor…" : "Kaydol"}
        </button>
        <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", textAlign: "center" }}>
          Hesabın var mı? <Link href="/login" style={{ color: "#ffd84e" }}>Giriş yap</Link>
        </div>
      </form>
    </AuthShell>
  );
}
