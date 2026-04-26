"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/browser";

export function LogoutButton() {
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
        padding: "6px 12px", borderRadius: 8,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(244,239,230,0.7)", fontSize: 11, fontWeight: 600, cursor: "pointer",
      }}
    >
      Çıkış
    </button>
  );
}
