import Anthropic from "@anthropic-ai/sdk";

/**
 * AI reply generation for the landing-page live chat.
 * Uses the same model/client pattern as the receipt OCR route.
 */

const MODEL = "claude-haiku-4-5";

export type AiTurn = { role: "user" | "assistant"; content: string };

const FACTS = `
SnapJack hakkında doğru bilgiler (yalnızca bunları kullan, fiyat UYDURMA):
- SnapJack, bar / kafe / restoran için oyunlaştırılmış müşteri sadakat sistemidir.
- Akış: Müşteri fişini telefonuyla okutur (OCR otomatik tutarı okur) → çark veya slot çevirir → kupon/ödül kazanır → tekrar gelmeye teşvik edilir.
- Standart plan: anonim oyun akışı, fiş tarama, çark/slot, kupon dağıtımı.
- Pro plan: müşteri hesapları, sadakat seviyeleri (Bronz/Gümüş/Altın), hedefli kampanya gönderimi, detaylı analitik, "sana özel menü" ve hediye çark.
- QR Dijital Menü (ayrı eklenti): masaya QR kod, kategorili/fiyatlı/fotoğraflı tam menü, TR+EN. Kurulumu SnapJack ekibi yapar; işletme menü fotoğraflarını /qr-menu sayfasından başvuruyla gönderir.
- Kurulum kolaydır; teknik bilgi gerekmez. Müşteriye uygulama indirtmeye gerek yok, her şey web üzerinden çalışır.

Davranış kuralları:
- Kısa, samimi ve yardımcı ol. Gereksiz uzun yazma (2-4 cümle).
- KESİN FİYAT verme; sorulursa "size en uygun planı ekibimiz netleştirsin" de ve iletişim bilgisi (isim + e-posta veya telefon) iste.
- Demo, fiyat teklifi veya bir insana bağlanmak isterlerse: isim ve e-posta/telefon iste, "ekibimiz en kısa sürede dönecek" de. (Bu konuşmayı ekibimiz görüyor.)
- Emin olmadığın bir şeyi uydurma; "bunu ekibimize ileteyim" de.
- Konuşmanın dilinde yanıt ver.
`.trim();

function systemPrompt(locale: string) {
  const lang = locale === "en" ? "English" : "Turkish";
  return `You are the friendly live-chat assistant on the SnapJack marketing website. Reply in ${lang}. Help visitors understand the product and capture leads (name + email/phone) when they want a demo, pricing, or a human.\n\n${FACTS}`;
}

/**
 * Generates an AI reply. Returns null on any failure (missing key, API error)
 * so the caller can fall back to a canned response + human handoff.
 */
export async function generateAiReply(history: AiTurn[], locale: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt(locale),
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
