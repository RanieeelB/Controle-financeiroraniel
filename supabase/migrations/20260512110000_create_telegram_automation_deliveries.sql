create table if not exists public.telegram_automation_deliveries (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    automation_key text not null,
    delivered_at timestamptz default now() not null,
    created_at timestamptz default now() not null,
    unique (user_id, automation_key)
);

create index if not exists telegram_automation_deliveries_user_delivered_idx
    on public.telegram_automation_deliveries (user_id, delivered_at desc);

alter table public.telegram_automation_deliveries enable row level security;

drop policy if exists "Users can view own telegram_automation_deliveries" on public.telegram_automation_deliveries;
create policy "Users can view own telegram_automation_deliveries"
    on public.telegram_automation_deliveries
    for select
    using (auth.uid() = user_id);
