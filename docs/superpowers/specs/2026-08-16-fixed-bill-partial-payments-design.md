# Pagamentos Parciais de Contas Fixas — Design

**Data:** 2026-08-16
**Status:** Aprovado pelo usuário para especificação

## Objetivo

Permitir que o usuário faça um ou mais abatimentos no valor mensal de uma conta fixa. A conta preserva seu valor original, mostra quanto já foi pago e quanto falta, e só fica quitada quando o saldo restante chega a zero.

Exemplo:

- conta fixa `Vale casa`: R$ 700,00, vencimento no dia 10
- primeiro abatimento: R$ 350,00
- pago no mês: R$ 350,00
- saldo restante: R$ 350,00

## Contexto Atual

- `fixed_bills.amount` armazena o valor mensal original da conta.
- `payFixedBill` cria uma transação de gasto com a nota `fixed_bill:<billId>`.
- `resolveDynamicFixedBills` considera a conta quitada quando encontra qualquer transação paga vinculada, independentemente do valor.
- `useFixedBills` busca as contas e as transações vinculadas do mês selecionado.
- A dashboard usa a mesma resolução dinâmica para mostrar próximas contas e calcular os totais.
- O histórico de gastos já permite excluir uma transação individual.

## Escopo

- aceitar vários abatimentos na mesma conta durante o mês atual
- bloquear valor zero, inválido, negativo ou superior ao saldo restante
- calcular valor pago, saldo restante, progresso e status por conta
- atualizar os totais de contas pagas e pendentes com valores parciais
- permitir o lançamento nas telas de Contas Fixas e nas Próximas Contas da dashboard
- destacar abatimentos de contas fixas no histórico de gastos
- desfazer um abatimento excluindo sua transação individual no histórico
- manter meses anteriores e futuros em modo somente leitura para abatimentos

## Fora de Escopo

- alterar o valor original da conta fixa ao abater
- aceitar data ou forma de pagamento no modal
- permitir abatimentos em meses diferentes do mês atual
- criar uma tabela exclusiva de pagamentos de contas fixas
- criar função RPC ou serialização no banco para gravações simultâneas em vários clientes
- excluir todos os pagamentos do mês por uma ação de “reabrir conta”
- alterar automaticamente contas fixas de meses futuros

## Abordagem Escolhida

Reaproveitar `transactions` como o livro de pagamentos. Cada abatimento é uma despesa paga vinculada à conta por `notes = fixed_bill:<billId>`.

Essa abordagem foi escolhida porque:

- preserva o histórico individual de cada abatimento
- mantém o abatimento visível no fluxo normal de gastos
- permite desfazer um lançamento pela exclusão da própria transação
- evita migração e novas políticas RLS
- mantém compatibilidade com pagamentos integrais já registrados

## Modelo Derivado da Conta

`DynamicFixedBill` deve expor, além dos campos atuais:

- `paidAmount`: menor valor entre a soma bruta elegível e o valor original da conta
- `remainingAmount`: `max(0, amount - paidAmount)`
- `paymentProgress`: percentual entre `0` e `100`
- `paymentTransactionIds`: IDs dos abatimentos vinculados no mês

Todos os cálculos monetários puros convertem os valores para inteiros em centavos e só voltam a reais na saída. Isso preserva a igualdade `paidAmount + remainingAmount === amount`, inclusive diante de sobrepagamentos legados.

Uma transação participa do somatório somente quando:

- `notes` é exatamente `fixed_bill:<billId>`, sem segmentos adicionais
- o ID após o prefixo é não vazio e igual ao ID da conta
- `type` é `gasto`
- `status` é `pago`
- `amount` é um número finito maior que zero

Transações nulas, negativas, de entrada, pendentes, com vínculo malformado ou de outra conta são ignoradas.

### Status

- `pago`: `remainingAmount === 0`
- `atrasado`: há saldo restante e o vencimento já passou
- `pendente`: há saldo restante e o vencimento ainda não passou

Uma conta parcialmente paga continua pendente ou atrasada. Pagamentos que, por dados antigos, somem mais que o valor original não produzem saldo negativo: o saldo é limitado a zero e o progresso a 100%.

## Regras do Abatimento

O modal de abatimento contém somente um campo monetário `Valor do abatimento`.

Regras:

- o campo começa vazio
- o valor deve ser maior que zero
- o valor deve ser menor ou igual ao saldo restante
- um valor acima do saldo mostra erro inline e não é salvo
- o botão de salvar fica desabilitado durante a gravação
- a transação usa a data atual, status `pago`, tipo `gasto` e método interno `pix`
- a descrição segue `Abatimento: <descrição da conta>`
- a nota segue `fixed_bill:<billId>`

Antes de inserir, a action consulta novamente os abatimentos pagos da conta no mês atual e recalcula o saldo. Se o valor ficou maior que o novo saldo, a gravação é rejeitada com mensagem clara e a conta é recarregada. Essa segunda conferência garante a regra para envios sequenciais e reduz inconsistências entre abas.

Sem uma operação transacional no banco, duas gravações exatamente simultâneas podem observar o mesmo saldo. Garantia atômica entre dispositivos fica explicitamente fora deste escopo para preservar a decisão aprovada de não migrar o banco. Mesmo nesse caso, os valores exibidos e agregados ficam limitados ao valor original; uma futura evolução pode introduzir RPC transacional sem mudar o modelo de transações.

## Restrição ao Mês Atual

O navegador é a fonte de tempo desta funcionalidade. Uma única instância de `Date`, criada internamente no início da action, determina tanto o `monthKey` atual quanto a data local `YYYY-MM-DD`. O contrato público não aceita relógio ou data fornecidos pelo chamador. Os testes controlam o relógio global do Vitest. O código não usa `toISOString`, evitando mudança de dia por conversão UTC.

O app compara o `monthKey` selecionado com o mês local dessa instância.

- no mês atual, contas com saldo exibem `Adicionar abatimento`
- em meses passados ou futuros, o botão não permite lançamento e a visualização permanece somente leitura
- a action recebe o mês selecionado e também rejeita chamadas que não correspondam ao mês atual

A proteção na action impede que a regra dependa apenas do botão da interface.

## Experiência do Usuário

### Cards e tabelas de contas fixas

O layout aprovado é compacto e hierárquico:

- valor original permanece em destaque
- uma barra mostra o progresso do pagamento
- abaixo aparecem `Pago R$ ...` e `Falta R$ ...`
- o botão `Adicionar abatimento` abre o modal de valor
- uma conta quitada mostra o estado `Pago` sem ação de reabertura

O mesmo padrão deve funcionar nos cards móveis, na tabela desktop de Contas Fixas e em Próximas Contas na dashboard.

### Totais

- `Total mensal`: soma dos valores originais
- `Contas pagas`: soma dos valores efetivamente abatidos
- `Pendente`: soma dos saldos restantes
- quantidade e percentual de contas pagas consideram apenas contas com saldo zero

### Histórico de gastos

Uma nova transação cuja nota é de conta fixa e cuja descrição começa com `Abatimento:` recebe tratamento visual próprio:

- faixa lateral verde
- ícone de conta fixa
- selo `Pagamento parcial`
- texto `Abatimento: <descrição>`
- contexto `Vinculado à conta fixa`

A ação de excluir usa o fluxo existente de exclusão de transações. Depois da exclusão, o evento financeiro recarrega as contas e recalcula pago, restante e status.

Pagamentos integrais legados com nota `fixed_bill:` e descrição `Pagamento:` mantêm vínculo e cálculo, mas recebem o selo genérico `Conta fixa`, não `Pagamento parcial`.

## Arquitetura e Responsabilidades

### `src/lib/fixedBillPayments.ts`

Responsável por:

- identificar transações vinculadas
- somar pagamentos pagos por conta
- derivar valores e status
- fornecer validação monetária pura para um novo abatimento

Não acessa Supabase nem contém estado de interface.

Contratos:

```ts
type FixedBillPaymentRecord = Pick<Transaction, 'id' | 'type' | 'status' | 'amount' | 'notes'>;

resolveDynamicFixedBills(input: {
  bills: FixedBill[];
  payments: FixedBillPaymentRecord[];
  monthKey: string;
  today?: Date;
}): DynamicFixedBill[];

validateFixedBillPayment(input: {
  billAmount: number;
  paidAmount: number;
  paymentAmount: number;
}):
  | { ok: true; amount: number; remainingAfterPayment: number }
  | { ok: false; code: 'invalid_amount' | 'exceeds_remaining'; remainingAmount: number };
```

### `src/hooks/useFixedBills.ts`

Responsável por:

- buscar `amount` junto dos dados das transações vinculadas
- aplicar o intervalo mensal
- expor contas dinâmicas e totais derivados

### `src/lib/financialActions.ts`

Responsável por:

- confirmar que o mês selecionado é o atual
- buscar a conta por ID no Supabase sob a sessão e RLS atuais
- usar o valor, descrição e categoria persistidos, nunca os dados do objeto exibido na tela
- reler os pagamentos atuais antes da gravação
- rejeitar valor superior ao saldo fresco
- inserir a transação vinculada
- emitir a atualização financeira

`payFixedBill` será substituída nos consumidores pela action explícita:

```ts
createFixedBillPayment(input: {
  billId: string;
  amount: number;
  selectedMonthKey: string;
}): Promise<
  | { status: 'created' }
  | { status: 'rejected'; code: 'invalid_month' | 'invalid_amount' | 'exceeds_remaining' | 'bill_not_found'; remainingAmount?: number }
>;
```

A action primeiro busca `id`, `description`, `amount` e `category_id` em `fixed_bills` com `.eq('id', billId).single()`. RLS garante que uma conta de outro usuário não seja retornada. A ausência da conta produz `bill_not_found`; outras falhas de consulta ou inserção são lançadas como erro de persistência. `removeFixedBillPayments` pode permanecer para compatibilidade interna, mas não terá consumidor na nova interface.

### Interface

- um modal focado recebe conta, saldo e mês selecionado
- `FixedBills` e `UpcomingBills` abrem o mesmo modal
- `Expenses` reconhece a nota vinculada e usa o estilo especial

## Erros e Recuperação

- erros de entrada aparecem inline no modal
- erros do Supabase mantêm o modal aberto e preservam o valor digitado
- saldo desatualizado mantém o modal aberto, preserva o valor digitado, atualiza o saldo exibido com `remainingAmount` retornado e mostra mensagem específica
- após saldo desatualizado, o `refetch` do pai ocorre em segundo plano; se ele falhar, o modal continua usando o saldo fresco devolvido pela action e a página mantém o estado anterior até nova tentativa
- se a releitura do saldo falhar antes da inserção, nada é gravado e o erro de persistência é exibido
- após `created`, o modal fecha e o evento financeiro inicia a recarga do pai
- uma falha ao recarregar dados após sucesso é registrada no console, não reabre o modal, não repete a inserção e não cria uma quitação apenas local; a página permanece com o estado anterior até nova recarga
- ações evitam envio duplicado enquanto estiverem em andamento

## Segurança e Integridade

- nenhum valor de usuário é renderizado como HTML bruto
- a action obtém o `user_id` da sessão atual
- as políticas RLS existentes continuam limitando leitura e escrita ao proprietário
- a validação de mês e saldo sequencial existe na camada de action, além da interface
- IDs do usuário não são aceitos como entrada do modal
- não são adicionados segredos nem dados financeiros ao armazenamento local

## Testes

### Automatizados

- nenhum pagamento mantém valor integral pendente
- pagamento parcial calcula pago e restante
- múltiplos pagamentos são somados
- pagamento exato quita a conta
- pagamento acima do valor legado limita saldo a zero
- exclusão de um pagamento recalcula o saldo a partir das transações restantes
- conta parcialmente paga fica atrasada após o vencimento
- totais somam valores pagos e restantes, não contas inteiras
- validação rejeita zero, negativo e valor acima do restante
- action rejeita mês diferente do atual
- data local e `monthKey` permanecem coerentes na virada de mês e perto da meia-noite
- transações inelegíveis são ignoradas pelo somatório
- sobrepagamento legado mantém `pago + restante = total`
- retornos da validação distinguem valor inválido de saldo insuficiente
- action relê a conta persistida e não confia em valor, descrição ou categoria fornecidos pela tela
- action retorna `exceeds_remaining` com o saldo fresco e não chama a inserção
- action distingue conta inexistente e falha de persistência
- teste de componente mantém o modal aberto e o valor digitado após `exceeds_remaining`, atualiza o saldo e dispara `refetch`
- teste de componente mantém o modal aberto após falha de persistência
- teste de componente confirma que sucesso fecha o modal uma única vez e que falha posterior de `refetch` não repete a inserção
- helper de apresentação distingue abatimento novo de pagamento integral legado
- testes de componente cobrem o padrão responsivo e os rótulos aprovados

### Validação final

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run android:sync`

## Migração e Compatibilidade

Não há migração de banco.

Pagamentos integrais existentes continuam compatíveis porque uma transação com o valor total resulta em saldo zero. Transações antigas sem `amount` válido não quitam uma conta e são ignoradas no somatório. Sobrepagamentos legados não aumentam o total pago exibido além do valor original.
