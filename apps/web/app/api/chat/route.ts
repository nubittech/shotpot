import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "../../../lib/supabase/server";
import { generateAiReply, type AiTurn } from "../../../lib/chat/ai";
import type { ChatConversation, ChatMessage } from "../../../lib/supabase/types";

/**
 * Public live-chat endpoint (no auth; random client visitor_id).
 *
 *  POST  { visitorId, conversationId?, message, name?, email?, locale? }
 *        -> stores the visitor message; if conversation.mode === 'ai', also
 *           generates + stores a Claude reply. Returns { conversationId, reply }.
 *  GET   ?conversationId=&visitorId=&after=<iso>
 *        -> messages after `after` (for polling admin/ai replies) + mode/status.
 */

const MAX_LEN = 2000;
const MAX_MESSAGES = 120; // hard cap per conversation (abuse guard)
const HISTORY = 20;

const fallback = (locale: string) =>
  locale === "en"
    ? "Thanks! I've noted that. Could you share your name and email or phone so our team can get back to you shortly?"
    : "Teşekkürler! Not aldım. İsmini ve e-posta veya telefonunu paylaşır mısın? Ekibimiz en kısa sürede sana dönsün.";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      visitorId?: string; conversationId?: string; message?: string;
      name?: string; email?: string; locale?: string;
    };
    const visitorId = (body.visitorId ?? "").trim();
    const message = (body.message ?? "").trim();
    const locale = body.locale === "en" ? "en" : "tr";
    if (!visitorId) return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
    if (message.length > MAX_LEN) return NextResponse.json({ error: "message too long" }, { status: 400 });

    const svc = getServiceClient();

    // Resolve / create conversation
    let convo: ChatConversation | null = null;
    if (body.conversationId) {
      const { data } = await svc.from("chat_conversations").select("*").eq("id", body.conversationId).maybeSingle();
      const c = data as ChatConversation | null;
      if (c && c.visitor_id === visitorId) convo = c;
    }
    if (!convo) {
      const { data, error } = await svc
        .from("chat_conversations")
        .insert({ visitor_id: visitorId, locale, mode: "ai", status: "open",
          visitor_name: body.name?.trim() || null, visitor_email: body.email?.trim() || null })
        .select("*")
        .single();
      if (error || !data) return NextResponse.json({ error: error?.message ?? "could not start" }, { status: 500 });
      convo = data as ChatConversation;
    }

    // Abuse guard
    const { count } = await svc.from("chat_messages").select("id", { count: "exact", head: true }).eq("conversation_id", convo.id);
    if ((count ?? 0) >= MAX_MESSAGES) {
      return NextResponse.json({ error: "limit reached", conversationId: convo.id }, { status: 429 });
    }

    const nowIso = new Date().toISOString();
    await svc.from("chat_messages").insert({ conversation_id: convo.id, role: "visitor", content: message });

    // Optionally capture contact + bump timestamps
    const convoPatch: Record<string, unknown> = { last_message_at: nowIso, last_visitor_at: nowIso };
    if (body.name?.trim() && !convo.visitor_name) convoPatch.visitor_name = body.name.trim();
    if (body.email?.trim() && !convo.visitor_email) convoPatch.visitor_email = body.email.trim();
    await svc.from("chat_conversations").update(convoPatch).eq("id", convo.id);

    // Human mode: AI stays silent; admin will reply.
    if (convo.mode === "human") {
      return NextResponse.json({ conversationId: convo.id, reply: null, pending: true });
    }

    // AI mode: build history and reply.
    const { data: hist } = await svc
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY);
    const rows = ((hist ?? []) as Array<Pick<ChatMessage, "role" | "content" | "created_at">>).reverse();
    const turns: AiTurn[] = rows.map((m) => ({ role: m.role === "visitor" ? "user" : "assistant", content: m.content }));

    let reply = await generateAiReply(turns, locale);
    if (!reply) reply = fallback(locale);

    await svc.from("chat_messages").insert({ conversation_id: convo.id, role: "ai", content: reply });
    await svc.from("chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convo.id);

    return NextResponse.json({ conversationId: convo.id, reply });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId") ?? "";
    const visitorId = searchParams.get("visitorId") ?? "";
    const after = searchParams.get("after");
    if (!conversationId || !visitorId) return NextResponse.json({ error: "params required" }, { status: 400 });

    const svc = getServiceClient();
    const { data: c } = await svc.from("chat_conversations").select("id, visitor_id, mode, status").eq("id", conversationId).maybeSingle();
    const convo = c as Pick<ChatConversation, "id" | "visitor_id" | "mode" | "status"> | null;
    if (!convo || convo.visitor_id !== visitorId) return NextResponse.json({ error: "not found" }, { status: 404 });

    let q = svc.from("chat_messages").select("id, role, content, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    if (after) q = q.gt("created_at", after);
    const { data: msgs } = await q;

    return NextResponse.json({ mode: convo.mode, status: convo.status, messages: msgs ?? [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
