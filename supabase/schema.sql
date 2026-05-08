-- =============================================================
-- SALDO REAL — Schema Definitivo
-- Rode este SQL no Supabase SQL Editor para criar as tabelas.
-- =============================================================

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

-- 7. INVESTIMENTOS
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

-- 8. APORTES EM INVESTIMENTOS / CAIXINHAS
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
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_deposits ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- POLÍTICAS: Enquanto não temos auth, permitir acesso total
-- Quando implementar login, trocar para auth.uid() = user_id
-- =============================================================
CREATE POLICY "Allow all for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for credit_cards" ON public.credit_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for invoice_items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for fixed_bills" ON public.fixed_bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for financial_goals" ON public.financial_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for investments" ON public.investments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for investment_deposits" ON public.investment_deposits FOR ALL USING (true) WITH CHECK (true);
