// set-admin-password.mjs
//
// Bir admin hesabının şifresini ayarlar (hesap yoksa oluşturur) ve e-postayı
// `admins` tablosuna ekler. Supabase service-role key ile çalışır; e-posta/SMTP
// gerektirmez. Şifreyi SEN verirsin — script hiçbir yere kaydetmez.
//
// Kullanım (apps/web klasöründen):
//   node scripts/set-admin-password.mjs walkrie365@gmail.com 'YeniGucluSifre123'
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (apps/web/.env.local'den okunur)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const env = {};
try {
  for (const line of readFileSync(join(here, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch { /* env may come from process.env */ }

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.argv[2] || "").toLowerCase().trim();
const password = process.argv[3] || process.env.NEW_PASSWORD;

if (!URL || !KEY) { console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY bulunamadı (apps/web/.env.local kontrol et)."); process.exit(1); }
if (!email || !password) { console.error("Kullanım: node scripts/set-admin-password.mjs <email> <yeni-sifre>"); process.exit(1); }
if (password.length < 6) { console.error("✗ Şifre en az 6 karakter olmalı."); process.exit(1); }

const sb = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let userId = null;
for (let page = 1; ; page++) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("✗ Kullanıcı listesi hatası:", error.message); process.exit(1); }
  const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
  if (found) { userId = found.id; break; }
  if (data.users.length < 200) break;
}

if (userId) {
  const { error } = await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
  if (error) { console.error("✗ Şifre güncelleme hatası:", error.message); process.exit(1); }
  console.log("✓ Şifre güncellendi:", email);
} else {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) { console.error("✗ Hesap oluşturma hatası:", error.message); process.exit(1); }
  userId = data.user.id;
  console.log("✓ Hesap oluşturuldu:", email);
}

const { error: aErr } = await sb.from("admins").upsert({ email }, { onConflict: "email" });
if (aErr) console.warn("! admins tablosu uyarısı (migration 013 çalıştı mı?):", aErr.message);
else console.log("✓ admins tablosunda kayıtlı:", email);

console.log(`\nBitti. Şimdi /login → ${email} + yeni şifre ile gir, sonra /admin.`);
