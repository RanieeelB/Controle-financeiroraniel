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

  it('sanitizes control characters and repeated whitespace', () => {
    expect(sanitizeTelegramText('  gastei\u0000   32,90   ifood \n')).toBe('gastei 32,90 ifood');
  });
});
