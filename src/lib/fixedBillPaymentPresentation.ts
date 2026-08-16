import type { Transaction } from '../types/financial';
import { getFixedBillIdFromNote } from './fixedBillPayments';

type FixedBillPaymentPresentationInput = Pick<Transaction, 'description' | 'notes'>;

export type FixedBillPaymentPresentation = {
  kind: 'partial' | 'legacy';
  badge: 'Pagamento parcial' | 'Conta fixa';
  context: 'Vinculado à conta fixa';
};

export function getFixedBillPaymentPresentation(
  transaction: FixedBillPaymentPresentationInput,
): FixedBillPaymentPresentation | null {
  if (!getFixedBillIdFromNote(transaction.notes)) return null;

  if (transaction.description.startsWith('Abatimento:')) {
    return {
      kind: 'partial',
      badge: 'Pagamento parcial',
      context: 'Vinculado à conta fixa',
    };
  }

  return {
    kind: 'legacy',
    badge: 'Conta fixa',
    context: 'Vinculado à conta fixa',
  };
}
