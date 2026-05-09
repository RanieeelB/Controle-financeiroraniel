# Cadastro em Lote de Fatura Design

**Data:** 2026-05-09
**Status:** Aprovado para especificacao

## Objetivo

Permitir que o usuario:

- defina o dia de vencimento padrao de cada cartao
- cadastre a primeira fatura de um cartao com muitos itens de uma vez
- revise e remova itens antes de salvar a fatura inteira

O foco principal e acelerar o primeiro cadastro de fatura, sem criar uma nova tela nem exigir mudancas de schema neste momento.

## Contexto Atual

- O schema ja possui `credit_cards.due_day` e `credit_cards.closing_day`.
- O modal de cartao atualmente salva apenas banco, bandeira e ultimos digitos.
- O modal `InvoicePurchaseModal` salva uma compra por vez assim que o formulario e enviado.
- A logica de parcelamento ja existe em `createCreditPurchase`, que gera os itens futuros e as transacoes vinculadas.

Isso significa que o vencimento padrao do cartao pode ser exposto sem migracao, e o cadastro em lote pode ser implementado no frontend reaproveitando a action atual.

## Abordagem Escolhida

Manter o fluxo concentrado no modal de fatura:

- o usuario escolhe um cartao uma unica vez
- visualiza o vencimento padrao desse cartao no topo do modal
- adiciona compras ao lote uma a uma
- revisa os itens adicionados dentro do proprio modal
- salva tudo apenas no final

Essa abordagem atende o caso de uso principal, reduz atrito no primeiro cadastro e evita expandir o escopo para uma nova pagina ou multiplos modais.

## Experiencia do Usuario

### Cadastro e edicao de cartao

No modal de cartao:

- adicionar campo numerico `Dia do vencimento`
- aceitar valores de `1` a `31`
- ao editar um cartao existente, carregar o valor salvo

Em exibicoes do cartao:

- mostrar o texto do vencimento nas telas de cartoes e faturas
- exemplo: `Vence todo dia 10`

### Cadastro de fatura em lote

No modal `Nova compra`:

- manter a selecao de cartao no topo
- mostrar o vencimento do cartao selecionado como contexto visual
- transformar o botao de envio principal do formulario do item em `Adicionar ao lote`
- depois de adicionar, limpar apenas os campos do item
- manter o cartao selecionado para agilizar o preenchimento

Cada item do lote deve permitir:

- descricao
- valor total
- data
- categoria
- quantidade de parcelas
- parcela atual

Abaixo do formulario:

- listar os itens temporarios ja adicionados
- mostrar subtotal da fatura em montagem
- permitir remover itens antes de salvar

Botao final do modal:

- `Salvar fatura`
- persiste todos os itens do lote de uma vez

## Regras de Negocio

### Cartao

- nao permitir salvar cartao com banco vazio
- nao permitir salvar cartao sem 4 ultimos digitos validos
- nao permitir vencimento fora do intervalo `1..31`

### Lote de compras

- nao permitir adicionar item sem cartao selecionado
- nao permitir adicionar item sem descricao
- nao permitir adicionar item com valor nulo, zero ou invalido
- nao permitir salvar a fatura se o lote estiver vazio
- se houver erro ao persistir o lote, manter os itens no modal para evitar perda do preenchimento

### Parcelamento

- o comportamento atual deve ser preservado
- ao salvar um item parcelado, as parcelas futuras continuam sendo geradas automaticamente
- o valor salvo em cada `invoice_item` continua sendo o valor unitario da parcela

## Arquitetura Tecnica

### Camada de payloads

Atualizar `buildCreditCardPayload` para receber e normalizar `dueDay`.

Nao ha necessidade de alterar o payload do item de fatura para suportar lote, porque o lote sera uma orquestracao de varias chamadas usando a mesma estrutura atual.

### Camada de actions

Adicionar uma action de lote sobre a action atual:

- `createCreditPurchasesBatch`
- recebe cartao e lista de compras
- percorre os itens e reaproveita `createCreditPurchase`
- dispara o refresh financeiro apenas no final, ou preserva o comportamento com impacto minimo se a extracao for mais segura

Objetivo:

- evitar duplicar a regra de parcelamento
- concentrar a logica de persistencia em uma unica camada

### Camada de interface

`CreditCardModal`

- incluir input para `dueDay`
- ajustar validacoes e mensagens de erro

`InvoicePurchaseModal`

- trocar o estado de compra unica por dois grupos de estado:
  - item em edicao
  - lote acumulado
- adicionar handler para inserir item no lote
- adicionar handler para remover item do lote
- adicionar handler final para salvar todo o lote

`Cards` e `Invoices`

- renderizar vencimento do cartao como informacao visivel

## Impacto em Arquivos

Arquivos com maior probabilidade de alteracao:

- `src/components/finance/FinanceModals.tsx`
- `src/lib/financialActions.ts`
- `src/lib/financialPayloads.ts`
- `src/lib/financialPayloads.test.ts`
- `src/pages/Cards.tsx`
- `src/pages/Invoices.tsx`

Possivel ajuste de tipagem:

- `src/types/financial.ts`

## Erros e Recuperacao

- erros de validacao aparecem inline no modal
- ao falhar no salvamento do lote, manter o modal aberto
- nao limpar a lista temporaria em caso de falha
- fechar o modal apenas apos sucesso completo

## Testes

### Automatizados

- validar `buildCreditCardPayload` com `dueDay`
- validar normalizacao do vencimento dentro do intervalo permitido
- validar helper ou estrutura usada para preparar itens do lote, se for extraida para funcao testavel

### Manuais

1. Criar cartao com vencimento e confirmar exibicao nas telas.
2. Editar cartao e alterar vencimento.
3. Abrir modal de fatura e adicionar varios itens ao lote.
4. Remover um item antes de salvar.
5. Salvar lote com compras simples e parceladas.
6. Conferir se os itens aparecem na fatura e se as parcelas futuras foram geradas.

## Fora de Escopo

- nova tela exclusiva para montar fatura
- lotes com multiplos cartoes no mesmo salvamento
- novas tabelas para rascunho de fatura
- logica de fechamento automatico por `closing_day`

## Decisao sobre Banco de Dados

Nenhuma nova tabela e necessaria nesta etapa.

Motivo:

- `due_day` ja existe em `credit_cards`
- o lote pode viver apenas no estado do modal ate o usuario salvar

Se surgir uma necessidade futura de salvar rascunhos de fatura entre sessoes, ai sim pode fazer sentido propor uma nova estrutura e gerar SQL especifico.
