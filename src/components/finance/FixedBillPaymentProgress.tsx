import type { DynamicFixedBill } from '../../types/financial';
import { formatPaymentCurrency } from './fixedBillPaymentForm';

interface FixedBillPaymentProgressProps {
  bill: DynamicFixedBill;
  canAddPayment: boolean;
  onAddPayment: () => void;
  compact?: boolean;
}

export function FixedBillPaymentProgress({
  bill,
  canAddPayment,
  onAddPayment,
  compact = false,
}: FixedBillPaymentProgressProps) {
  const isPaid = bill.remainingAmount <= 0;
  const progress = Math.min(100, Math.max(0, bill.paymentProgress));

  return (
    <div className={`min-w-0 ${compact ? 'space-y-xs' : 'space-y-sm'}`}>
      <div className="flex items-center justify-between gap-sm">
        <p className={`font-numeral-lg font-semibold text-on-surface ${compact ? 'text-[16px]' : 'text-[18px]'}`}>
          {formatPaymentCurrency(bill.amount)}
        </p>
        {isPaid && (
          <span className="rounded-full border border-primary/30 bg-primary-container/20 px-sm py-[2px] text-[11px] font-semibold uppercase tracking-wider text-primary">
            Pago
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-label={`Progresso de pagamento de ${bill.description}`}
        aria-valuemin={0}
        aria-valuemax={bill.amount}
        aria-valuenow={bill.paidAmount}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant"
      >
        <div
          className={`h-full rounded-full transition-[width] ${isPaid ? 'bg-secondary' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-sm gap-y-xs text-[12px] text-on-surface-variant">
        <span>Pago R$ {bill.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span>Falta R$ {bill.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>

      {!isPaid && canAddPayment && (
        <button
          type="button"
          onClick={onAddPayment}
          className={`min-h-11 rounded-lg border border-primary/40 px-md py-xs font-label-md text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10 ${compact ? 'w-full sm:w-auto' : ''}`}
        >
          Adicionar abatimento
        </button>
      )}
    </div>
  );
}
