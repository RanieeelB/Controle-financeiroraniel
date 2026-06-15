-- Adiciona colunas faltantes à tabela investments
ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'piggy-bank',
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.financial_goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS monthly_contribution DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_auto_contribution_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suggested_investment_percentage DECIMAL(5,2) DEFAULT 0;

-- Adiciona índice para melhorar performance de queries por user_id
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_goal_id ON public.investments(goal_id);
