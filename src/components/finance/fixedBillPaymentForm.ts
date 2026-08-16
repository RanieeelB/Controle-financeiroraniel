import type { CreateFixedBillPaymentResult } from '../../lib/financialActions';

export interface FixedBillPaymentFormState {
  value: string;
  remainingAmount: number;
  error: string | null;
}

interface FixedBillPaymentReduction {
  close: boolean;
  state: FixedBillPaymentFormState;
}

export function parsePaymentValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return Number.NaN;
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(normalized)) return Number.NaN;

  return Number(normalized.replace(',', '.'));
}

export function formatPaymentCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value).replace(/\u00a0/g, ' ');
}

export function validatePaymentField(value: string, remainingAmount: number) {
  const amount = parsePaymentValue(value);
  const amountInCents = Math.round(amount * 100);

  if (!Number.isFinite(amount) || amountInCents <= 0) {
    return 'Informe um valor maior que zero.';
  }

  if (amountInCents > Math.round(remainingAmount * 100)) {
    return `O valor excede o saldo restante de ${formatPaymentCurrency(remainingAmount)}.`;
  }

  return null;
}

export function reduceFixedBillPaymentResult(
  state: FixedBillPaymentFormState,
  result: CreateFixedBillPaymentResult,
): FixedBillPaymentReduction {
  if (result.status === 'created') {
    return { close: true, state };
  }

  if (result.code === 'exceeds_remaining') {
    const remainingAmount = result.remainingAmount ?? state.remainingAmount;
    return {
      close: false,
      state: {
        ...state,
        remainingAmount,
        error: `O valor excede o saldo restante de ${formatPaymentCurrency(remainingAmount)}.`,
      },
    };
  }

  const errors = {
    invalid_month: 'Selecione o mês atual para adicionar um abatimento.',
    invalid_amount: 'Informe um valor válido.',
    bill_not_found: 'A conta fixa não foi encontrada.',
  } satisfies Record<typeof result.code, string>;

  return {
    close: false,
    state: { ...state, error: errors[result.code] },
  };
}
