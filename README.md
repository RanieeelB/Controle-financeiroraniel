# Saldo Real - Controle Financeiro Avançado 💰

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

O **Saldo Real** é uma aplicação completa (SaaS-like) de gestão financeira pessoal e empresarial desenvolvida com as melhores práticas de desenvolvimento front-end e segurança de dados. O sistema possui arquitetura *Multi-tenant*, garantindo que cada usuário tenha acesso apenas aos seus próprios dados de forma segura, gerenciado diretamente no banco de dados.

## ✨ Principais Funcionalidades

- **Dashboard Analítico:** Visão geral da saúde financeira, evolução de saldo e quebra de gastos por categoria usando gráficos modernos (Recharts).
- **Gestão de Impostos PJ (Exclusivo):** Ferramenta integrada para cálculo e lançamento rápido de impostos (DAS MEI e Simples Nacional) baseados no faturamento dinâmico do mês.
- **Controle de Contas Fixas:** Gestão inteligente de contas recorrentes. O sistema detecta se a conta já foi paga no mês atual e calcula automaticamente os dias de atraso se o vencimento tiver passado.
- **Bootstrapping de Categorias:** Novos usuários recebem automaticamente um conjunto inteligente de categorias padronizadas (Estudo, Lazer, iFood, Impostos PJ, etc.) logo no primeiro acesso.
- **Filtros Temporais Globais:** Navegue entre os meses com facilidade. Todos os relatórios e faturas se adaptam instantaneamente ao mês selecionado.
- **Autenticação Segura:** Login, cadastro e gestão de sessão gerenciados via Supabase Auth.

## 🛠 Arquitetura & Segurança

O projeto adota uma abordagem robusta de segurança focada no banco de dados:

- **Row Level Security (RLS):** Todas as 8 tabelas do sistema (`transactions`, `categories`, `fixed_bills`, `credit_cards`, etc.) possuem políticas restritas (`auth.uid() = user_id`), tornando tecnicamente impossível que um usuário acesse ou modifique dados de outro.
- **Schema como Código:** Toda a estrutura de banco e permissões está consolidada em `/supabase/schema.sql`, permitindo rápida reconstrução do ambiente.
- **Event-Driven Reactivity:** A UI se mantém sincronizada globalmente através de um sistema pub/sub simples (EventTarget) que avisa todos os hooks (`useTransactions`, `useFixedBills`) quando uma nova mutação é realizada.

## 💻 Stack Tecnológica

- **Front-end:** React 18, Vite, React Router DOM, TypeScript.
- **Estilização:** Tailwind CSS v4, Lucide Icons, UI inspirada em Glassmorphism e Design Tokens.
- **Back-end/BaaS:** Supabase (PostgreSQL, Auth, RLS).
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

### 3. Configurando o Banco de Dados
No painel do seu projeto Supabase, acesse o **SQL Editor** e execute integralmente o conteúdo do arquivo `supabase/schema.sql`. Isso vai criar todas as tabelas, triggers e habilitar a segurança (RLS).

### 4. Rodando o app
```bash
npm run dev
```

---
*Desenvolvido com foco em alta performance e UX premium por [Raniel Bezerra](https://github.com/RanieeelB).*
