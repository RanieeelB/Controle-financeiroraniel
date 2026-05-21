CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_balance_carryover_note_unique
ON public.transactions (user_id, notes)
WHERE notes LIKE 'carryover:auto:%';
