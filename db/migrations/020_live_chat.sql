-- 020_live_chat.sql
-- Landing-page live chat with AI (Claude) auto-reply + human takeover.
--
-- Flow: a visitor types in the floating widget -> /api/chat stores the message
-- and, while conversation.mode = 'ai', Claude replies automatically. Admins
-- watch all conversations in /admin/chat; when an admin sends a message the
-- conversation flips to mode = 'human' and the AI goes silent until handed
-- back. No auth for visitors (random client-side visitor_id); admin endpoints
-- are gated by the admins table.

create table if not exists chat_conversations (
  id              uuid primary key default gen_random_uuid(),
  visitor_id      text not null,                       -- random id from the visitor's localStorage
  visitor_name    text,
  visitor_email   text,
  status          text not null default 'open',        -- open | closed
  mode            text not null default 'ai',          -- ai | human
  locale          text not null default 'tr',
  last_message_at timestamptz not null default now(),
  last_visitor_at timestamptz,                         -- last time the visitor wrote (admin unread sense)
  admin_seen_at   timestamptz,                         -- last time an admin viewed it
  created_at      timestamptz not null default now()
);

create table if not exists chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  role            text not null,                       -- visitor | ai | admin
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists chat_conversations_recent on chat_conversations(last_message_at desc);
create index if not exists chat_conversations_visitor on chat_conversations(visitor_id);
create index if not exists chat_messages_convo on chat_messages(conversation_id, created_at);

notify pgrst, 'reload schema';
