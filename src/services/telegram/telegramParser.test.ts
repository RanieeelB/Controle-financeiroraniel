import { describe, expect, it } from 'vitest';
import { parseTelegramMessage, sanitizeTelegramText } from './telegramParser';

const referenceDate = new Date('2026-05-10T12:00:00-03:00');

describe('telegramParser', () => {
  it('parses a simple paid expense message', () => {
    const parsed = parseTelegramMessage('gastei 25 no almoço', { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'create_expense',
      data: {
        description: 'almoço',
        amount: 25,
        category: 'Alimentação',
        date: '2026-05-10',
        status: 'pago',
      },
    });
  });

  it.each([
    ['paguei R$ 100 internet', 'internet', 100, 'Contas'],
    ['comprei 32,90 ifood', 'ifood', 32.9, 'Alimentação'],
    ['foi 45,50 de uber', 'uber', 45.5, 'Transporte'],
    ['mercado custou 230,10', 'mercado', 230.1, 'Mercado'],
  ])('parses expense variation "%s"', (message, description, amount, category) => {
    const parsed = parseTelegramMessage(message, { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'create_expense',
      data: {
        description,
        amount,
        category,
        date: '2026-05-10',
        status: 'pago',
      },
    });
  });

  it('parses a received income message', () => {
    const parsed = parseTelegramMessage('recebi 6500 salário', { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'create_income',
      data: {
        description: 'salário',
        amount: 6500,
        category: 'Salário',
        date: '2026-05-10',
        status: 'recebido',
      },
    });
  });

  it.each([
    ['entrou 1200 freela', 'freela', 1200, 'Outros recebimentos'],
    ['ganhei R$ 350 cashback', 'cashback', 350, 'Outros recebimentos'],
    ['caiu 6500 salario', 'salario', 6500, 'Salário'],
  ])('parses income variation "%s"', (message, description, amount, category) => {
    const parsed = parseTelegramMessage(message, { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'create_income',
      data: {
        description,
        amount,
        category,
        date: '2026-05-10',
        status: 'recebido',
      },
    });
  });

  it('parses the monthly summary command', () => {
    const parsed = parseTelegramMessage('resumo do mês', { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'get_monthly_summary',
      data: {
        description: 'Resumo do mês',
        date: '2026-05-10',
      },
    });
  });

  it.each([
    ['lista meus gastos', 'list_expenses', 'Gastos do mês'],
    ['quais entradas tive esse mês', 'list_incomes', 'Entradas do mês'],
    ['onde estou gastando mais?', 'get_expense_distribution', 'Distribuição de gastos'],
    ['minhas contas fixas', 'list_fixed_bills', 'Contas fixas'],
    ['faturas abertas', 'list_open_invoices', 'Faturas abertas'],
    ['ver fatura nubank', 'get_card_invoice', 'nubank'],
    ['quais cartões eu tenho?', 'list_cards', 'Cartões'],
    ['meus investimentos', 'list_investments', 'Investimentos'],
    ['quanto tenho na caixinha ferias', 'get_investment_summary', 'ferias'],
    ['minhas metas', 'list_goals', 'Metas'],
    ['quanto sobrou esse mês', 'get_balance', 'Sobra do mês'],
  ] as const)('parses consultive variation "%s"', (message, intent, description) => {
    const parsed = parseTelegramMessage(message, { now: referenceDate });

    expect(parsed).toEqual({
      intent,
      data: {
        description,
        date: '2026-05-10',
      },
    });
  });

  it('parses an investment deposit message by investment name', () => {
    const parsed = parseTelegramMessage('adicione 500 no investimento ferias', { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'create_investment_deposit',
      data: {
        description: 'ferias',
        amount: 500,
        date: '2026-05-10',
        status: 'pago',
      },
    });
  });

  it.each([
    ['aportar 300 na caixinha 13', '13', 300],
    ['guardei 200 em reserva', 'reserva', 200],
    ['coloquei R$ 150 no investimento ferias', 'ferias', 150],
  ])('parses investment deposit variation "%s"', (message, description, amount) => {
    const parsed = parseTelegramMessage(message, { now: referenceDate });

    expect(parsed).toEqual({
      intent: 'create_investment_deposit',
      data: {
        description,
        amount,
        date: '2026-05-10',
        status: 'pago',
      },
    });
  });

  it('sanitizes control characters and repeated whitespace', () => {
    expect(sanitizeTelegramText('  gastei\u0000   32,90   ifood \n')).toBe('gastei 32,90 ifood');
  });
});
