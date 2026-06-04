import { AdminChatClient } from "./AdminChatClient";

export const dynamic = "force-dynamic";

export default function AdminChatPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Canlı Sohbet</h1>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
        Ziyaretçiler AI ile konuşur. Bir mesaj yazarsan o sohbet &quot;insan&quot; moduna geçer ve AI susar; &quot;AI&apos;ya devret&quot; ile geri verebilirsin.
      </p>
      <AdminChatClient />
    </div>
  );
}
