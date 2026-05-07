# Controle-financeiroraniel

PWA simples para controle financeiro pessoal, com cadastro de receitas e despesas, cálculo automático de saldo e funcionamento offline básico.

## Como usar

1. Abra o arquivo `index.html` em um servidor estático (ex.: `python3 -m http.server`).
2. Adicione lançamentos pelo formulário.
3. Instale como app no navegador para experiência PWA.

## Funcionalidades

- Registro de receita e despesa
- Persistência local com `localStorage`
- Saldo, total de receitas e total de despesas
- Service Worker para cache básico offline
- Manifest para instalação da PWA
