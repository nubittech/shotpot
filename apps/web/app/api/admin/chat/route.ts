import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { getServiceClient } from "../../../../lib/supabase/server";
import type { ChatConversation, ChatMessage } from "../../../../lib/supabase/types";

/**
 * Admin live-chat control.
 *  GET                       -> list conversations (recent first) with preview + unread
 *  GET  ?conversationId=     -> messages for one convo (marks admin_seen_at)
 *  POST { conversationId, message } -> send as admin; flips mode to 'human'
 *  PATCH { conversationId, mode?, status? } -> hand back to AI / close
 */

export async function GET(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const svc = getServiceClient();
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const { data: c } = await svc.from("chat_conversations").select("*").eq("id", conversationId).maybeSingle();
    const convo = c as ChatConversation | null;
    if (!convo) return NextResponse.json({ error: "not found" }, { status: 404 });
    const { data: msgs } = await svc
      .from("chat_messages").select("id, role, content, created_at")
      .eq("conversation_id", conversationId).order("created_at", { ascending: true });
    await svc.from("chat_conversations").update({ admin_seen_at: new Date().toISOString() }).eq("id", conversationId);
    return NextResponse.json({ conversation: convo, messages: msgs ?? [] });
  }

  const { data: convosRaw } = await svc
    .from("chat_conversations").select("*")
    .order("last_message_at", { ascending: false }).limit(100);
  const convos = (convosRaw ?? []) as ChatConversation[];

  // last message preview per conversation
  let previews: Record<string, { content: string; role: string }> = {};
  if (convos.length > 0) {
    const ids = convos.map((c) => c.id);
    const { data: recent } = await svc
      .from("chat_messages").select("conversation_id, role, content, created_at")
      .in("conversation_id", ids).order("created_at", { ascending: false });
    const seen = new Set<string>();
    for (const m of (recent ?? []) as Array<Pick<ChatMessage, "conversation_id" | "role" | "content">>) {
      if (seen.has(m.conversation_id)) continue;
      seen.add(m.conversation_id);
      previews[m.conversation_id] = { content: m.content, role: m.role };
    }
  }

  const list = convos.map((c) => ({
    ...c,
    preview: previews[c.id]?.content ?? "",
    previewRole: previews[c.id]?.role ?? "",
    unread: !!c.last_visitor_at && (!c.admin_seen_at || c.last_visitor_at > c.admin_seen_at),
  }));

  return NextResponse.json({ conversations: list });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const body = (await req.json()) as { conversationId?: string; message?: string };
  const message = (body.message ?? "").trim();
  if (!body.conversationId || !message) return NextResponse.json({ error: "conversationId ve message gerekli" }, { status: 400 });

  const svc = getServiceClient();
  const now = new Date().toISOString();
  const { error } = await svc.from("chat_messages").insert({ conversation_id: body.conversationId, role: "admin", content: message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await svc.from("chat_conversations").update({ mode: "human", last_message_at: now, admin_seen_at: now }).eq("id", body.conversationId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdminApi();
  if (gate instanceof NextResponse) return gate;
  const body = (await req.json()) as { conversationId?: string; mode?: string; status?: string };
  if (!body.conversationId) return NextResponse.json({ error: "conversationId gerekli" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.mode === "ai" || body.mode === "human") update.mode = body.mode;
  if (body.status === "open" || body.status === "closed") update.status = body.status;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "no fields" }, { status: 400 });

  const svc = getServiceClient();
  const { error } = await svc.from("chat_conversations").update(update).eq("id", body.conversationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
