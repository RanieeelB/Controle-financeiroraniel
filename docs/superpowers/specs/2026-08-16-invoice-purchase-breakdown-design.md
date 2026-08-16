# Composição de Faturas e Término de Parcelas — Design

**Data:** 2026-08-16
**Status:** Aprovado pelo usuário para especificação

## Objetivo

Mostrar, nos cards de fatura e de planejamento futuro:

- compras à vista cobradas no mês
- compras parceladas cobradas no mês
- valor total da fatura no mês

O detalhamento de compras parceladas também deve informar a parcela atual e a previsão do mês de término de cada compra.

## Contexto Atual

- `invoice_items.amount` armazena o valor unitário da parcela.
- `total_installments` e `current_installment` distinguem compra à vista de compra parcelada.
- ao cadastrar uma compra parcelada, o app gera um `invoice_item` para cada parcela restante, com a data movida mês a mês.
- `useCreditCards` já carrega os itens da fatura do mês selecionado.
- `Invoices` soma os itens por cartão, mas não separa à vista e parcelado.
- `buildFinancialProjections` soma os itens de cartão de cada mês futuro em um único total.

## Escopo

- calcular a composição da fatura por cartão e mês
- exibir `À vista`, `Parcelado` e `Total da fatura` nos cards da tela Faturas
- repetir a composição nos detalhes da fatura
- separar o valor de cartão nos cards de Projeções Financeiras da dashboard
- incluir a composição no modal de detalhes da projeção
- mostrar previsão de término em cada item parcelado
- preservar o comportamento de pagamento e reabertura da fatura

## Fora de Escopo

- mostrar um saldo parcelado futuro agregado
- alterar o fechamento da fatura com base em `closing_day`
- reagrupar ou editar todas as parcelas de uma compra em lote
- criar um identificador de grupo de compra parcelada
- alterar a forma como as parcelas são persistidas
- criar novas tabelas ou colunas

## Definições dos Valores

Para um conjunto de itens de uma fatura no mês:

- `cashPurchases`: soma de itens com `total_installments === 1`
- `installmentPurchases`: soma de itens com `total_installments > 1`
- `total`: `cashPurchases + installmentPurchases`

Normalização de entrada:

- `amount` é convertido com `Number(...)`; valor não finito ou menor ou igual a zero exclui o item dos três totais
- `total_installments` finito e inteiro maior ou igual a 1 é preservado; qualquer outro valor é normalizado para `1` e classificado como à vista
- `current_installment` finito e inteiro é limitado ao intervalo `1..total_installments`; ausente ou inválido vira `1`

Todos os valores válidos são convertidos para inteiros em centavos durante a soma e voltam a reais na saída.

O card apresenta `Total da fatura` como valor principal. `À vista` e `Parcelado` aparecem como linhas secundárias, conforme o layout compacto aprovado.

## Previsão de Término

Para um item parcelado:

- parcela atual: `current_installment`
- total de parcelas: `total_installments`
- parcelas restantes após o mês exibido: `total_installments - current_installment`
- mês final: mês de `item.date` avançado pela quantidade restante

Exemplo:

- data do item atual: agosto de 2026
- parcela atual: 3 de 10
- restam 7 meses depois de agosto
- término previsto: março de 2027

A função deve tratar virada de ano e usar os helpers mensais existentes para evitar cálculos com quantidade variável de dias. `endingMonthKey` usa sempre o formato `YYYY-MM`.

Se `item.date` não começar com um mês válido `YYYY-MM`, o item continua nos totais, mas `endingMonthKey` é `null` e a interface mostra `Término indisponível`.

Itens à vista não exibem previsão de término.

## Experiência do Usuário

### Cards da tela Faturas

Cada cartão mostra:

- nome, bandeira e final do cartão
- estado da fatura e vencimento
- `Total da fatura` em destaque
- `Compras à vista`
- `Compras parceladas`
- quantidade de compras
- ações existentes para ver e pagar/reabrir a fatura

### Modal `Ver fatura`

O cabeçalho repete total, à vista e parcelado. Cada item mostra valor, categoria e data.

Itens parcelados acrescentam:

- selo `Parcela X de Y`
- texto `Previsão de término: <mês> de <ano>`

### Cards de Projeções Financeiras

O valor `Cartão` continua representando o total de cartão do mês projetado. Abaixo dele aparecem:

- `À vista`
- `Parcelado`

O total geral, fixos, aportes, salário e sobra prevista permanecem inalterados.

Uma compra à vista só aparece em um mês futuro se já existir um item com data naquele mês. Parcelas futuras existentes entram em `Parcelado`.

### Modal de detalhes da projeção

O resumo de faturas apresenta total, à vista e parcelado. Nos detalhes do tipo cartão:

- compra à vista recebe o rótulo `À vista`
- compra parcelada recebe `Parcela X de Y`
- compra parcelada mostra o mês final previsto

## Arquitetura e Responsabilidades

### Novo helper puro de faturas

Um módulo focado, junto aos helpers financeiros, deve oferecer:

- resumo de itens em `cashPurchases`, `installmentPurchases` e `total`
- cálculo do mês final de um item parcelado
- metadados de apresentação do parcelamento sem JSX

O helper não acessa Supabase nem conhece componentes React.

Contratos:

```ts
type InvoiceBreakdownItem = Pick<InvoiceItem,
  'amount' | 'date' | 'total_installments' | 'current_installment'
>;

summarizeInvoiceItems(items: InvoiceBreakdownItem[]): {
  cashPurchases: number;
  installmentPurchases: number;
  total: number;
};

getInvoicePurchaseSchedule(item: InvoiceBreakdownItem):
  | { kind: 'cash'; currentInstallment: null; totalInstallments: null; endingMonthKey: null }
  | { kind: 'installment'; currentInstallment: number; totalInstallments: number; endingMonthKey: string | null };
```

### `useCreditCards`

Continua responsável pela busca e deve expor `getCardInvoiceSummary(cardId)`, que filtra os itens do cartão e chama o helper puro. `Invoices` não repete filtros ou somas.

### `Invoices`

Consome o resumo por cartão para os cards e para o modal. O fluxo de pagamento continua usando os mesmos itens e transações vinculadas.

### `financialProjections`

`MonthProjection.breakdown` passa a incluir:

- `creditCards`: total atual
- `cashPurchases`: total à vista do mês projetado
- `installmentPurchases`: total parcelado do mês projetado

Os detalhes de cartão passam a usar um contrato discriminado:

```ts
type CardProjectionMetadata =
  | { purchaseKind: 'cash'; currentInstallment: null; totalInstallments: null; endingMonthKey: null }
  | { purchaseKind: 'installment'; currentInstallment: number; totalInstallments: number; endingMonthKey: string | null };
```

Detalhes dos tipos `fixed` e `investment` não carregam esses campos. Consumidores só acessam parcelas depois de verificar `detail.type === 'card'` e `purchaseKind === 'installment'`.

### Interface de projeções

`ProjectionsSection` e `ProjectionDetailsModal` apenas formatam os dados calculados; não refazem regras monetárias ou datas.

## Erros e Estados Vazios

- ausência de itens resulta em todos os valores iguais a zero
- valor monetário inválido exclui o item dos totais, sem gerar `NaN`
- `total_installments` inválido classifica o item como à vista
- `current_installment` inválido é normalizado e limitado a `1..total_installments`
- data inválida mantém o valor nos totais e produz término indisponível
- cards sem compras continuam mostrando o estado vazio existente
- falha na busca preserva o tratamento atual de carregamento e registra o erro

## Segurança

- descrições e categorias continuam renderizadas por interpolação JSX, com escape do React
- nenhum HTML bruto é criado para o detalhamento
- cálculos usam apenas dados já autorizados pelas políticas RLS de `invoice_items`
- nenhuma informação de cartão além dos últimos dígitos já existentes é introduzida
- não há armazenamento local de dados de fatura

## Testes

### Automatizados

- somente compras à vista
- somente compras parceladas
- composição mista e igualdade `total = à vista + parcelado`
- valores em string vindos do Supabase
- conjunto vazio
- valor zero, negativo, não numérico e infinito
- total de parcelas zero, negativo, fracionário ou ausente
- parcela atual ausente, zero, acima do total ou não numérica
- data ausente ou com mês inválido
- término no mesmo ano
- término atravessando dezembro
- última parcela termina no próprio mês
- projeção separa à vista e parcelado sem mudar o total geral
- cards e modal contêm os rótulos aprovados e mantêm as ações de pagamento

### Validação final

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run android:sync`

## Migração e Compatibilidade

Não há migração de banco. A solução usa os campos já existentes em `invoice_items` e mantém a forma atual de persistência e pagamento das faturas.
