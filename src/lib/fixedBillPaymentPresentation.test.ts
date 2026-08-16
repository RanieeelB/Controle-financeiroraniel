import { describe, expect, it } from 'vitest';
import { getFixedBillPaymentPresentation } from './fixedBillPaymentPresentation';

describe('getFixedBillPaymentPresentation', () => {
  it('classifies a linked abatimento as a partial payment', () => {
    expect(getFixedBillPaymentPresentation({
      notes: 'fixed_bill:bill-1',
      description: 'Abatimento: Aluguel',
    })).toEqual({
      kind: 'partial',
      badge: 'Pagamento parcial',
      context: 'Vinculado à conta fixa',
    });
  });

  it('classifies a linked Pagamento description as a legacy payment', () => {
    expect(getFixedBillPaymentPresentation({
      notes: 'fixed_bill:bill-1',
      description: 'Pagamento: Aluguel',
    })).toEqual({
      kind: 'legacy',
      badge: 'Conta fixa',
      context: 'Vinculado à conta fixa',
    });
  });

  it.each([
    'Aluguel',
    'Compra: Aluguel',
    'abatimento: Aluguel',
    ' Abatimento: Aluguel',
    'pagamento: Aluguel',
    ' Pagamento: Aluguel',
  ])('does not classify an exact link with the unapproved description %s', description => {
    expect(getFixedBillPaymentPresentation({
      notes: 'fixed_bill:bill-1',
      description,
    })).toBeNull();
  });

  it.each([
    { notes: null, description: 'Abatimento: Aluguel' },
    { notes: 'anotação comum', description: 'Abatimento: Aluguel' },
    { notes: 'fixed_bill:', description: 'Abatimento: Aluguel' },
    { notes: 'fixed_bill:bill-1:extra', description: 'Abatimento: Aluguel' },
  ])('returns null for an unlinked or malformed transaction: $notes', transaction => {
    expect(getFixedBillPaymentPresentation(transaction)).toBeNull();
  });
});
