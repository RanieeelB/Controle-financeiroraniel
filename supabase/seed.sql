-- ATENÇÃO: Substitua o 'user_id' pelo UUID do seu usuário real do Supabase Auth após criar uma conta no seu app.
-- Como estamos testando, você pode rodar esses inserts sem user_id se desativar temporariamente a restrição,
-- ou melhor, crie um usuário no painel do Supabase Auth, pegue o ID e coloque aqui.

-- Por enquanto, vamos inserir sem user_id apenas para popular a tabela se o RLS estiver desativado,
-- mas o correto é associar a um auth.users(id). Caso não tenha auth ainda, comente a linha 'user_id UUID REFERENCES auth.users(id)' no schema temporariamente.

INSERT INTO public.upcoming_bills (description, value, due_date, status, icon) VALUES
('Internet Fibra', 120.00, 'Dia 10', 'Pago', 'wifi'),
('Conta de Luz', 245.50, 'Dia 15', 'Pendente', 'zap'),
('Aluguel', 1500.00, 'Dia 05', 'Pendente', 'landmark');

INSERT INTO public.credit_card_invoices (name, value, due_date, color, initial) VALUES
('Nubank', 2340.50, 'Vence em 2 dias', '#8B5CF6', 'N'),
('Inter', 850.00, 'Fechada', '#F97316', 'I');

INSERT INTO public.financial_goals (title, target_amount, current_amount) VALUES
('Reserva de Emergência', 10000.00, 3500.00),
('Viagem Fim de Ano', 5000.00, 1200.00);

-- Para transações e gráficos, seria um volume maior de dados, mas aqui está um exemplo de transação:
INSERT INTO public.transactions (type, description, amount, date, category, payment_method) VALUES
('entrada', 'Salário', 5000.00, CURRENT_DATE, 'renda', 'pix'),
('gasto', 'Supermercado', 650.00, CURRENT_DATE, 'alimentacao', 'credito');
