"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/browser";
import { getClientCopy } from "../../lib/i18n/client";
import { AuthShell, Field, inputStyle, primaryBtn, errorStyle } from "../../components/auth/AuthShell";

function LoginForm() {
  const copy = getClientCopy();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setErr(error.message);
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      <Field label={copy.common.email}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </Field>
      <Field label={copy.common.password}>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      </Field>
      {err && <div style={errorStyle}>{err}</div>}
      <button type="submit" disabled={busy} style={primaryBtn}>
        {busy ? copy.auth.login.submitting : copy.auth.login.submit}
      </button>
      <div style={{ fontSize: 12, color: "rgba(244,239,230,0.5)", textAlign: "center" }}>
        {copy.auth.login.signupPrompt} <Link href="/signup" style={{ color: "#ffd84e" }}>{copy.auth.login.signupLink}</Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const copy = getClientCopy();

  return (
    <AuthShell title={copy.auth.login.title} sub={copy.auth.login.subtitle} mode="login">
      <Suspense fallback={<div style={{ color: "rgba(244,239,230,0.5)", fontSize: 13 }}>{copy.common.loading}</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
