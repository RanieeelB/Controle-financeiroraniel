-- =============================================================
-- SALDO REAL — Schema Definitivo (Reset & Recreate)
-- Rode este SQL no Supabase SQL Editor para limpar e recriar.
-- =============================================================

-- 0. LIMPEZA (Apaga tudo para recriar do zero)
DROP TABLE IF EXISTS public.investment_deposits CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.financial_goals CASCADE;
DROP TABLE IF EXISTS public.salary_settings CASCADE;
DROP TABLE IF EXISTS public.telegram_automation_deliveries CASCADE;
DROP TABLE IF EXISTS public.telegram_connections CASCADE;
DROP TABLE IF EXISTS public.fixed_bills CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.credit_cards CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 0.5 PERFIS DE USUÁRIO
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger para criar o perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Garante que os usuários antigos (já existentes no auth.users) tenham um perfil
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 1. CATEGORIAS
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'tag',
    type TEXT NOT NULL DEFAULT 'ambos' CHECK (type IN ('entrada', 'gasto', 'ambos')),
    color TEXT NOT NULL DEFAULT '#75ff9e',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TRANSAÇÕES (Entradas e Gastos)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'gasto')),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('recebido', 'pago', 'pendente')),
    payment_method TEXT DEFAULT 'pix' CHECK (payment_method IN ('pix', 'credito', 'debito', 'dinheiro', 'transferencia')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. CARTÕES DE CRÉDITO
CREATE TABLE public.credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    last_digits TEXT NOT NULL DEFAULT '0000',
    brand TEXT NOT NULL DEFAULT 'Mastercard',
    card_holder TEXT NOT NULL DEFAULT '',
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_day INTEGER NOT NULL DEFAULT 10 CHECK (due_day >= 1 AND due_day <= 31),
    closing_day INTEGER NOT NULL DEFAULT 3 CHECK (closing_day >= 1 AND closing_day <= 31),
    color TEXT NOT NULL DEFAULT '#8A05BE',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. ITENS DA FATURA (compras no cartão)
CREATE TABLE public.invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_installments INTEGER NOT NULL DEFAULT 1,
    current_installment INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. CONTAS FIXAS
CREATE TABLE public.fixed_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_day INTEGER NOT NULL DEFAULT 10 CHECK (due_day >= 1 AND due_day <= 31),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
    icon TEXT NOT NULL DEFAULT 'receipt',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. METAS FINANCEIRAS
CREATE TABLE public.financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    deadline DATE,
    icon TEXT NOT NULL DEFAULT 'target',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. CONFIGURAÇÃO DE SALÁRIO FIXO
CREATE TABLE public.salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7.5 VÍNCULO TELEGRAM
CREATE TABLE public.telegram_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    link_token_hash TEXT,
    token_encrypted TEXT,
    token_generated_at TIMESTAMPTZ,
    telegram_user_id TEXT UNIQUE,
    telegram_chat_id TEXT,
    linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7.6 MEMÓRIA DO CONSULTOR TELEGRAM
CREATE TABLE public.telegram_conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_chat_id TEXT NOT NULL,
    telegram_user_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7.7 CONTROLE DE ENTREGA DAS AUTOMAÇÕES TELEGRAM
CREATE TABLE public.telegram_automation_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    automation_key TEXT NOT NULL,
    delivered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, automation_key)
);

CREATE INDEX telegram_automation_deliveries_user_delivered_idx
    ON public.telegram_automation_deliveries (user_id, delivered_at DESC);

-- 8. INVESTIMENTOS
CREATE TABLE public.investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ticker TEXT,
    category TEXT NOT NULL DEFAULT 'renda_fixa' CHECK (category IN ('renda_fixa', 'acoes', 'fiis', 'cripto')),
    amount_invested DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    return_percentage DECIMAL(6,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. APORTES DE INVESTIMENTO (Depende de investments)
CREATE TABLE public.investment_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_automation_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- POLÍTICAS: Apenas o próprio usuário pode acessar seus dados
-- =============================================================
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credit_cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit_cards" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit_cards" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credit_cards" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoice_items" ON public.invoice_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoice_items" ON public.invoice_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoice_items" ON public.invoice_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoice_items" ON public.invoice_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fixed_bills" ON public.fixed_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fixed_bills" ON public.fixed_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fixed_bills" ON public.fixed_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fixed_bills" ON public.fixed_bills FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own financial_goals" ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial_goals" ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial_goals" ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial_goals" ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own salary_settings" ON public.salary_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own salary_settings" ON public.salary_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own salary_settings" ON public.salary_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own salary_settings" ON public.salary_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own telegram_connections" ON public.telegram_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own telegram_connections" ON public.telegram_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own telegram_connections" ON public.telegram_connections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own telegram_conversation_messages" ON public.telegram_conversation_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own telegram_conversation_messages" ON public.telegram_conversation_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own telegram_automation_deliveries" ON public.telegram_automation_deliveries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investment_deposits" ON public.investment_deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investment_deposits" ON public.investment_deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investment_deposits" ON public.investment_deposits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investment_deposits" ON public.investment_deposits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
