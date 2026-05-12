# Saldo Real - Controle Financeiro Avançado 💰

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

O **Saldo Real** é uma aplicação completa (SaaS-like) de gestão financeira pessoal e empresarial desenvolvida com as melhores práticas de desenvolvimento front-end e segurança de dados. O sistema possui arquitetura *Multi-tenant*, garantindo que cada usuário tenha acesso apenas aos seus próprios dados de forma segura, gerenciado diretamente no banco de dados.

## ✨ Principais Funcionalidades

O aplicativo conta com módulos abrangentes para cobrir toda a sua vida financeira:

- **Dashboard Analítico:** Visão geral da saúde financeira, evolução de saldo diário e quebra de gastos por categoria usando gráficos modernos (Recharts).
- **Sobra Prevista Inteligente:** Cálculo automático da projeção de sobra no fim do mês, subtraindo do salário todas as faturas de cartão, contas fixas pendentes e transações agendadas.
- **Gestão de Entradas e Saídas:** Painéis dedicados para lançamentos avulsos de receitas e despesas, com sistema de busca, filtros e categorização detalhada.
- **Cartões de Crédito e Faturas:** Cadastro ilimitado de cartões, com acompanhamento de limites e lançamentos de compras parceladas (projetando faturas automaticamente para os meses seguintes).
- **Contas Fixas Recorrentes:** Controle inteligente de assinaturas e despesas fixas. O sistema avisa os dias de vencimento, detecta automaticamente se já foi pago no mês e calcula dias de atraso.
- **Investimentos e Caixinhas:** Módulo completo para acompanhamento de patrimônio (Renda Fixa, Ações, FIIs e Cripto), registrando aportes, rentabilidade atualizada e sistema de contribuições mensais automatizadas.
- **Metas Financeiras:** Criação de objetivos de poupança com definição de prazos e acompanhamento visual do progresso dos depósitos.
- **Gestão de Impostos PJ (Exclusivo):** Ferramenta integrada para cálculo e lançamento rápido de impostos (DAS MEI e Simples Nacional) baseados no faturamento dinâmico do mês.
- **Planejamento de Salário:** Configuração de salário fixo e dia de pagamento para lançamento contínuo da receita principal de forma automatizada.
- **Telegram Integrado:** Conexão por token em Configurações para registrar gastos, entradas, aportes, consultar saldo, faturas, cartões, contas fixas, metas e investimentos diretamente pelo bot.
- **Automações no Telegram:** Processo automático no backend envia agenda matinal de vencimentos, resumo das 18h apenas em dias com movimentação, alerta de saldo baixo ou projeção negativa, fechamento semanal e botões para marcar faturas ou contas fixas como pagas.
- **Bootstrapping de Categorias:** Novos usuários recebem automaticamente um conjunto inteligente de categorias padronizadas (Estudo, Lazer, iFood, Impostos PJ, etc.) logo no primeiro acesso.
- **Filtros Temporais Globais:** Navegue entre os meses com facilidade. Todos os relatórios, dashboards, investimentos e faturas se adaptam instantaneamente ao mês selecionado.
- **Autenticação Segura:** Login, cadastro e gestão de sessão gerenciados nativamente via Supabase Auth.

## 🛠 Arquitetura & Segurança

O projeto adota uma abordagem robusta de segurança focada no banco de dados:

- **Row Level Security (RLS):** Todas as tabelas do sistema (`transactions`, `categories`, `fixed_bills`, `credit_cards`, `investments`, etc.) possuem políticas restritas (`auth.uid() = user_id`), tornando tecnicamente impossível que um usuário acesse ou modifique dados de outro.
- **Schema como Código:** Toda a estrutura de banco e permissões está consolidada em `/supabase/schema.sql`, permitindo rápida reconstrução do ambiente.
- **Event-Driven Reactivity:** A UI se mantém sincronizada globalmente através de um sistema pub/sub simples (`EventTarget`) que avisa todos os hooks quando uma nova mutação é realizada (atualizando a tela instantaneamente em todos os componentes).

## 💻 Stack Tecnológica

- **Front-end:** React 18, Vite, React Router DOM, TypeScript.
- **Estilização:** Tailwind CSS v4, Lucide Icons, UI inspirada em Glassmorphism e Design Tokens.
- **Back-end/BaaS:** Supabase (PostgreSQL, Auth, RLS).
- **Automações:** Vercel Cron chamando `/api/telegram/automations` uma vez por dia às `21:00 UTC` (`18:00` em `America/Fortaleza`), compatível com contas Hobby; o backend decide os envios válidos e consolida vencimentos, resumo diário, alertas e fechamento semanal.
- **Data Viz:** Recharts.

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- Projeto criado no [Supabase](https://supabase.com)

### 1. Clonando e Instalando dependências
```bash
git clone https://github.com/RanieeelB/Controle-financeiroraniel.git
cd Controle-financeiroraniel
npm install
```

### 2. Configurando as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto contendo as chaves do seu Supabase:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Para usar o backend do Telegram em produção, configure também as variáveis do servidor:
```env
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
TELEGRAM_BOT_TOKEN=token_do_bot
TELEGRAM_WEBHOOK_SECRET=segredo_do_webhook
TELEGRAM_LINK_TOKEN_SECRET=segredo_para_tokens_de_vinculo
TELEGRAM_AUTOMATION_SECRET=segredo_opcional_para_execucao_manual_do_cron
```

### 3. Configurando o Banco de Dados
No painel do seu projeto Supabase, acesse o **SQL Editor** e execute integralmente o conteúdo do arquivo `supabase/schema.sql`. Isso vai criar todas as tabelas, triggers e habilitar a segurança (RLS).

### 4. Rodando o app
```bash
npm run dev
```

---
*Desenvolvido com foco em alta performance e UX premium por [Raniel Bezerra](https://github.com/RanieeelB).*
