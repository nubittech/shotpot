"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/browser";

export function LogoutButton({ label = "Çıkış yap" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        const sb = createClient();
        await sb.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "8px 12px", borderRadius: 8,
        background: "transparent", border: "none",
        color: "#8b7d5e", fontSize: 13, fontWeight: 500, cursor: "pointer",
        textAlign: "left",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M9 3H4a1 1 0 00-1 1v8a1 1 0 001 1h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 5l3 3-3 3M14 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}
