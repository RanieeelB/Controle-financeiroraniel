create table if not exists public.telegram_connections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    link_token_hash text,
    token_generated_at timestamptz,
    telegram_user_id text unique,
    telegram_chat_id text,
    linked_at timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create unique index if not exists telegram_connections_user_id_key
    on public.telegram_connections (user_id);

alter table public.telegram_connections enable row level security;

drop policy if exists "Users can view own telegram_connections" on public.telegram_connections;
create policy "Users can view own telegram_connections"
    on public.telegram_connections
    for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own telegram_connections" on public.telegram_connections;
create policy "Users can insert own telegram_connections"
    on public.telegram_connections
    for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own telegram_connections" on public.telegram_connections;
create policy "Users can update own telegram_connections"
    on public.telegram_connections
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create or replace function public.set_telegram_connections_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists telegram_connections_set_updated_at on public.telegram_connections;
create trigger telegram_connections_set_updated_at
before update on public.telegram_connections
for each row execute procedure public.set_telegram_connections_updated_at();
