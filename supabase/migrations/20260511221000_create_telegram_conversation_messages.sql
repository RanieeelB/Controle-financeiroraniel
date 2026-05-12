create table if not exists public.telegram_conversation_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    telegram_chat_id text not null,
    telegram_user_id text,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz default now() not null
);

create index if not exists telegram_conversation_messages_user_chat_created_idx
    on public.telegram_conversation_messages (user_id, telegram_chat_id, created_at desc);

alter table public.telegram_conversation_messages enable row level security;

drop policy if exists "Users can view own telegram_conversation_messages" on public.telegram_conversation_messages;
create policy "Users can view own telegram_conversation_messages"
    on public.telegram_conversation_messages
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own telegram_conversation_messages" on public.telegram_conversation_messages;
create policy "Users can insert own telegram_conversation_messages"
    on public.telegram_conversation_messages
    for insert
    with check (auth.uid() = user_id);
