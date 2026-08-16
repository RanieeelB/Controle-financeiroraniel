import { useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { createFixedBillPayment } from '../../lib/financialActions';
import type { DynamicFixedBill } from '../../types/financial';
import {
  formatPaymentCurrency,
  parsePaymentValue,
  reduceFixedBillPaymentResult,
  validatePaymentField,
  type FixedBillPaymentFormState,
} from './fixedBillPaymentForm';

interface FixedBillPaymentModalProps {
  bill: DynamicFixedBill;
  selectedMonthKey: string;
  onClose: () => void;
  onRefresh: () => Promise<unknown> | unknown;
}

export function FixedBillPaymentModal({
  bill,
  selectedMonthKey,
  onClose,
  onRefresh,
}: FixedBillPaymentModalProps) {
  useLockBodyScroll();
  const titleId = useId();
  const savingRef = useRef(false);
  const closedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<FixedBillPaymentFormState>({
    value: '',
    remainingAmount: bill.remainingAmount,
    error: null,
  });

  function startBackgroundRefresh() {
    void Promise.resolve()
      .then(() => onRefresh())
      .catch(error => console.error('Error refreshing fixed bills:', error));
  }

  function closeOnce() {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }

  function handleClose() {
    if (savingRef.current) return;
    closeOnce();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;

    const error = validatePaymentField(formState.value, formState.remainingAmount);
    if (error) {
      setFormState(current => ({ ...current, error }));
      return;
    }

    savingRef.current = true;
    setIsSaving(true);

    try {
      const result = await createFixedBillPayment({
        billId: bill.id,
        amount: parsePaymentValue(formState.value),
        selectedMonthKey,
      });
      const reduction = reduceFixedBillPaymentResult(formState, result);

      if (reduction.close) {
        startBackgroundRefresh();
        closeOnce();
        return;
      }

      setFormState(reduction.state);
      if (result.status === 'rejected' && result.code === 'exceeds_remaining') {
        startBackgroundRefresh();
      }
    } catch {
      setFormState(current => ({
        ...current,
        error: 'Não foi possível salvar o abatimento. Tente novamente.',
      }));
    }

    savingRef.current = false;
    setIsSaving(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] isolate flex items-stretch sm:items-center justify-center bg-background/85 backdrop-blur-md p-0 sm:p-md overflow-hidden">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full sm:max-w-[32rem] h-[100dvh] sm:h-auto sm:max-h-[90dvh] bg-surface-container-low border border-outline-variant rounded-none sm:rounded-xl shadow-2xl overflow-hidden relative flex flex-col"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
        <header className="flex items-start justify-between gap-md px-md sm:px-lg py-md border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">
              Adicionar abatimento
            </h2>
            <p className="font-body-md text-[14px] sm:text-[15px] text-on-surface-variant">
              Registre um pagamento parcial de {bill.description}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Fechar modal"
            className="text-on-surface-variant hover:text-primary transition-colors min-h-11 min-w-11 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X size={22} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-md sm:p-lg space-y-md">
            <dl className="grid grid-cols-1 min-[390px]:grid-cols-3 gap-sm rounded-xl border border-outline-variant bg-surface/60 p-md">
              <div className="space-y-xs">
                <dt className="font-label-md text-[12px] uppercase tracking-wider text-on-surface-variant">Original</dt>
                <dd className="font-body-md font-semibold text-on-surface">{formatPaymentCurrency(bill.amount)}</dd>
              </div>
              <div className="space-y-xs">
                <dt className="font-label-md text-[12px] uppercase tracking-wider text-on-surface-variant">Pago</dt>
                <dd className="font-body-md font-semibold text-on-surface">{formatPaymentCurrency(bill.paidAmount)}</dd>
              </div>
              <div className="space-y-xs">
                <dt className="font-label-md text-[12px] uppercase tracking-wider text-on-surface-variant">Falta</dt>
                <dd className="font-body-md font-semibold text-primary">{formatPaymentCurrency(formState.remainingAmount)}</dd>
              </div>
            </dl>

            <div>
              <label
                htmlFor="fixed-bill-payment-value"
                className="block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider"
              >
                Valor do abatimento
              </label>
              <input
                id="fixed-bill-payment-value"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={formState.value}
                disabled={isSaving}
                onChange={event => setFormState(current => ({
                  ...current,
                  value: event.target.value,
                  error: null,
                }))}
                className="w-full min-h-11 bg-background border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-outline disabled:opacity-60"
                placeholder="0,00"
              />
            </div>

            {formState.error && (
              <div
                role="alert"
                className="rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]"
              >
                {formState.error}
              </div>
            )}
          </div>

          <footer className="sticky bottom-0 z-10 px-md sm:px-lg py-md bg-surface-container-low/95 backdrop-blur border-t border-outline-variant flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
            >
              <CheckCircle size={18} />
              <span>{isSaving ? 'Salvando...' : 'Salvar abatimento'}</span>
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
