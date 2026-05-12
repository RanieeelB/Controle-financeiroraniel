alter table public.telegram_connections
    add column if not exists token_encrypted text;
