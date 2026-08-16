import { ModalShell } from './ModalShell';
import { formatMonthLabel } from '../../lib/monthSelection';
import type { MonthProjection } from '../../lib/financialProjections';

interface ProjectionDetailsModalProps {
  projection: MonthProjection;
  onClose: () => void;
}

const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const labelClass = 'block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider';

export function ProjectionDetailsModal({ projection, onClose }: ProjectionDetailsModalProps) {
  return (
    <ModalShell title={`Detalhes: ${projection.label}`} subtitle="Previsão de gastos e aportes para este mês." onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto p-lg space-y-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div className="p-md bg-surface-container rounded-lg border border-outline-variant space-y-xs">
            <span className={labelClass}>Faturas</span>
            <p className="font-numeral-lg text-[18px] font-bold text-primary">R$ {fmt(projection.breakdown.creditCards)}</p>
            <div className="text-[11px] text-on-surface-variant space-y-0.5 pt-xs border-t border-outline-variant/40">
              <p>À vista: <span className="text-on-surface font-medium">R$ {fmt(projection.breakdown.cashPurchases)}</span></p>
              <p>Parcelado: <span className="text-on-surface font-medium">R$ {fmt(projection.breakdown.installmentPurchases)}</span></p>
            </div>
          </div>
          <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
            <span className={labelClass}>Fixos</span>
            <p className="font-numeral-lg text-[18px] font-bold text-secondary">R$ {fmt(projection.breakdown.fixedBills)}</p>
          </div>
          <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
            <span className={labelClass}>Aportes</span>
            <p className="font-numeral-lg text-[18px] font-bold text-tertiary">R$ {fmt(projection.breakdown.investments)}</p>
          </div>
        </div>

        <div className="space-y-sm">
          <h4 className={labelClass}>Detalhamento</h4>
          <div className="space-y-xs">
            {projection.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between p-sm bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex flex-col min-w-0 pr-sm">
                  <span className="font-body-md text-on-surface truncate">{detail.description}</span>
                  {detail.type === 'card' ? (
                    detail.purchaseKind === 'installment' ? (
                      <div className="text-[11px] text-on-surface-variant flex flex-wrap items-center gap-x-2">
                        <span className="uppercase tracking-wider opacity-70">
                          Parcela {detail.currentInstallment} de {detail.totalInstallments}
                        </span>
                        <span>•</span>
                        <span>
                          {detail.endingMonthKey
                            ? `Previsão de término: ${formatMonthLabel(detail.endingMonthKey)}`
                            : 'Término indisponível'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant opacity-70">
                        Cartão • À vista
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant opacity-70">
                      {detail.type === 'fixed' ? 'Conta Fixa' : 'Investimento'}
                    </span>
                  )}
                </div>
                <span className="font-numeral-md text-on-surface shrink-0">R$ {fmt(detail.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-md bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <span className="font-semibold text-on-surface">Total Estimado</span>
          <span className="font-numeral-lg text-[22px] text-primary">R$ {fmt(projection.total)}</span>
        </div>
      </div>
      <div className="p-lg border-t border-outline-variant flex justify-end">
        <button type="button" onClick={onClose} className="px-lg py-sm bg-surface-variant text-on-surface-variant rounded-lg hover:bg-outline-variant/20 transition-all font-semibold min-h-11">Fechar</button>
      </div>
    </ModalShell>
  );
}
