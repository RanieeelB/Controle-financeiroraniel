import { describe, expect, it, vi } from 'vitest';
import { createGeminiTelegramParser } from './telegramGeminiParser';

describe('telegramGeminiParser', () => {
  it('parses a complex expense from Gemini JSON', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        intent: 'create_expense',
        description: 'cinema',
        amount: 80,
        category: 'Outros',
        date: '2026-05-10',
        status: 'pago',
      }),
    });

    const parser = createGeminiTelegramParser({
      apiKey: 'fake-key',
      model: 'gemini-2.5-flash-lite',
      client: {
        models: {
          generateContent,
        },
      },
    });

    const parsed = await parser.parse('ontem fui no cinema e paguei oitenta reais', {
      now: new Date('2026-05-10T12:00:00-03:00'),
    });

    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash-lite',
      config: expect.objectContaining({
        responseMimeType: 'application/json',
      }),
    }));
    expect(parsed).toEqual({
      intent: 'create_expense',
      data: {
        description: 'cinema',
        amount: 80,
        category: 'Outros',
        date: '2026-05-10',
        status: 'pago',
      },
    });
  });

  it('returns unknown when Gemini response is unsafe or incomplete', async () => {
    const parser = createGeminiTelegramParser({
      apiKey: 'fake-key',
      client: {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              intent: 'create_expense',
              description: '',
              amount: -10,
            }),
          }),
        },
      },
    });

    const parsed = await parser.parse('faz qualquer coisa', {
      now: new Date('2026-05-10T12:00:00-03:00'),
    });

    expect(parsed).toEqual({
      intent: 'unknown',
      data: {
        description: 'Mensagem não reconhecida',
        date: '2026-05-10',
      },
    });
  });
});
