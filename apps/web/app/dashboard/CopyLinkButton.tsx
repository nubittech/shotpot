"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  slug: string;
  label?: string;
  copiedLabel?: string;
  promptLabel?: string;
};

export function CopyLinkButton({
  slug,
  label = "Linki Kopyala",
  copiedLabel = "✓ Kopyalandı",
  promptLabel = "Kopyalayın:",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/play/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback if Clipboard API unavailable
      window.prompt(promptLabel, url);
    }
  }

  return (
    <button
      onClick={copy}
      type="button"
      style={{
        padding: "8px 14px", borderRadius: 10,
        background: copied ? "rgba(142,242,161,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${copied ? "rgba(142,242,161,0.4)" : "rgba(255,255,255,0.1)"}`,
        color: copied ? "#8ef2a1" : "rgba(244,239,230,0.85)",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? copiedLabel : `🔗 ${label}`}
    </button>
  );
}
