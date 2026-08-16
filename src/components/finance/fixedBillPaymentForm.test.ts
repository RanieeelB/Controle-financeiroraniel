import { describe, expect, it } from 'vitest';
import type { CreateFixedBillPaymentResult } from '../../lib/financialActions';
import {
  formatPaymentCurrency,
  parsePaymentValue,
  reduceFixedBillPaymentResult,
  validatePaymentField,
  type FixedBillPaymentFormState,
} from './fixedBillPaymentForm';

describe('fixed bill payment form', () => {
  describe('parsePaymentValue', () => {
    it('returns NaN for a blank value', () => {
      expect(parsePaymentValue('   ')).toBeNaN();
    });

    it('accepts a comma decimal separator', () => {
      expect(parsePaymentValue('451,25')).toBe(451.25);
    });

    it.each(['0x10', '0b10', '1e2'])(
      'rejects the non-currency numeric literal %s',
      value => {
        expect(parsePaymentValue(value)).toBeNaN();
      },
    );
  });

  describe('formatPaymentCurrency', () => {
    it('formats BRL with normal spaces', () => {
      const formatted = formatPaymentCurrency(450);

      expect(formatted).toBe('R$ 450,00');
      expect(formatted).not.toContain('\u00a0');
    });
  });

  describe('validatePaymentField', () => {
    it.each(['', '   ', 'abc', '0', '-1', '0,001', 'Infinity'])(
      'rejects the non-positive value %j',
      value => {
        expect(validatePaymentField(value, 450)).toBe('Informe um valor maior que zero.');
      },
    );

    it('rejects a cent-rounded amount above the remainder', () => {
      expect(validatePaymentField('450,006', 450)).toBe(
        'O valor excede o saldo restante de R$ 450,00.',
      );
    });

    it('accepts a positive amount within the remainder after cent rounding', () => {
      expect(validatePaymentField('450,004', 450)).toBeNull();
    });
  });

  describe('reduceFixedBillPaymentResult', () => {
    const state: FixedBillPaymentFormState = {
      value: '451',
      remainingAmount: 450,
      error: null,
    };

    it.each<[CreateFixedBillPaymentResult, string]>([
      [
        { status: 'rejected', code: 'invalid_month' },
        'Selecione o mês atual para adicionar um abatimento.',
      ],
      [
        { status: 'rejected', code: 'invalid_amount' },
        'Informe um valor válido.',
      ],
      [
        { status: 'rejected', code: 'bill_not_found' },
        'A conta fixa não foi encontrada.',
      ],
    ])('keeps the modal open for %s', (result, error) => {
      expect(reduceFixedBillPaymentResult(state, result)).toEqual({
        close: false,
        state: { ...state, error },
      });
    });

    it('uses the fresh remainder while preserving the typed value', () => {
      expect(reduceFixedBillPaymentResult(state, {
        status: 'rejected',
        code: 'exceeds_remaining',
        remainingAmount: 300,
      })).toEqual({
        close: false,
        state: {
          value: '451',
          remainingAmount: 300,
          error: 'O valor excede o saldo restante de R$ 300,00.',
        },
      });
    });

    it('keeps the current remainder if a stale response omits it', () => {
      expect(reduceFixedBillPaymentResult(state, {
        status: 'rejected',
        code: 'exceeds_remaining',
      })).toEqual({
        close: false,
        state: {
          ...state,
          error: 'O valor excede o saldo restante de R$ 450,00.',
        },
      });
    });

    it('closes only for a created payment', () => {
      expect(reduceFixedBillPaymentResult(state, { status: 'created' })).toEqual({
        close: true,
        state,
      });
    });
  });
});
