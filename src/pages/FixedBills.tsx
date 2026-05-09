import { Landmark, CheckCircle2, Clock, Filter, Inbox, Plus, PieChart, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { FixedBillModal } from '../components/finance/FinanceModals';
import { useFixedBills } from '../hooks/useFixedBills';
import type { DynamicFixedBill } from '../types/financial';
import { payFixedBill, removeFixedBillPayments } from '../lib/financialActions';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../components/layout/Layout';

export function FixedBills() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const { bills, isLoading, totals, categoryBreakdown } = useFixedBills(selectedMonthRange);
  const [isFixedBillModalOpen, setIsFixedBillModalOpen] = useState(false);
  const [activeBillAction, setActiveBillAction] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const paidPct = totals.count > 0 ? Math.round((totals.paidCount / totals.count) * 100) : 0;
  const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary-container', 'bg-outline'];

  async function handlePay(bill: DynamicFixedBill) {
    if (activeBillAction) return;
    setActiveBillAction(bill.id);
    try {
      await payFixedBill(bill);
    } catch (error) {
      console.error('Error paying bill:', error);
    } finally {
      setActiveBillAction(null);
    }
  }

  async function handleReopen(bill: DynamicFixedBill) {
    if (activeBillAction || bill.paymentTransactionIds.length === 0) return;

    setActiveBillAction(bill.id);
    try {
      await removeFixedBillPayments(bill.paymentTransactionIds);
    } catch (error) {
      console.error('Error reopening fixed bill payment:', error);
    } finally {
      setActiveBillAction(null);
    }
  }

  return (
    <div className="space-y-xl">
      <div className="flex justify-end">
        <button
          onClick={() => setIsFixedBillModalOpen(true)}
          className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center gap-sm"
        >
          <Plus size={18} />Nova Conta Fixa
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Total Mensal</span><Landmark className="text-primary" size={24} /></div>
          <span className="font-numeral-lg text-[32px] text-on-surface">R$ {fmt(totals.total)}</span>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg">
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Contas Pagas</span><CheckCircle2 className="text-secondary" size={24} /></div>
          <span className="font-numeral-lg text-[32px] text-on-surface">R$ {fmt(totals.paid)}</span>
          <div className="w-full bg-surface-variant rounded-full h-1.5 mt-md overflow-hidden"><div className="bg-secondary h-full rounded-full" style={{ width: `${paidPct}%` }}></div></div>
          <div className="flex justify-between mt-xs"><span className="text-[12px] text-on-surface-variant">{totals.paidCount} de {totals.count} contas</span><span className="text-[12px] text-secondary">{paidPct}%</span></div>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg">
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Pendente</span><Clock className="text-tertiary-container" size={24} /></div>
          <span className="font-numeral-lg text-[32px] text-on-surface">R$ {fmt(totals.pending)}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-high/50">
            <h3 className="font-h2 text-[18px] font-semibold text-on-surface">Detalhamento</h3>
            <div className="flex gap-sm"><button className="p-xs text-on-surface-variant hover:text-on-surface"><Filter size={20} /></button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-outline-variant text-on-surface-variant font-label-md text-[14px] font-semibold uppercase tracking-wider">
                <th className="py-md px-lg">Descrição</th><th className="py-md px-lg">Categoria</th><th className="py-md px-lg">Vencimento</th><th className="py-md px-lg text-right">Valor</th><th className="py-md px-lg text-center">Status</th><th className="py-md px-lg text-center">Ação</th>
              </tr></thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr><td colSpan={6} className="py-xl text-center text-on-surface-variant"><div className="flex flex-col items-center gap-md"><Inbox size={48} className="text-outline-variant" /><p>Nenhuma conta fixa cadastrada.</p></div></td></tr>
                ) : bills.map(b => (
                  <tr key={b.id} className={`border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors ${b.dynamicStatus === 'atrasado' ? 'bg-error-container/5' : ''}`}>
                    <td className="py-md px-lg text-on-surface">{b.description}</td>
                    <td className="py-md px-lg text-on-surface-variant">{b.category?.name || '—'}</td>
                    <td className={`py-md px-lg ${b.dynamicStatus === 'atrasado' ? 'text-error font-medium' : ''}`}>Dia {b.due_day}</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ {fmt(b.amount)}</td>
                    <td className="py-md px-lg text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`inline-flex items-center justify-center font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24 ${
                          b.dynamicStatus === 'pago' ? 'bg-primary-container/20 text-primary border border-primary/30' :
                          b.dynamicStatus === 'atrasado' ? 'bg-error-container text-on-error-container border border-error/50' :
                          'bg-surface-variant text-on-surface border border-outline-variant'
                        }`}>{b.dynamicStatus === 'pago' ? 'Pago' : b.dynamicStatus === 'atrasado' ? 'Atrasado' : 'Pendente'}</span>
                        {b.dynamicStatus === 'atrasado' && b.daysOverdue > 0 && (
                          <span className="text-[10px] text-error mt-1">{b.daysOverdue} dias de atraso</span>
                        )}
                      </div>
                    </td>
                    <td className="py-md px-lg text-center">
                      <button
                        onClick={() => (b.dynamicStatus === 'pago' ? handleReopen(b) : handlePay(b))}
                        disabled={activeBillAction === b.id}
                        className={`p-2 rounded-lg transition-all ${
                          b.dynamicStatus === 'pago'
                            ? 'text-secondary hover:text-secondary hover:bg-secondary/10'
                            : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
                        }`}
                        title={b.dynamicStatus === 'pago' ? 'Desmarcar pagamento desta conta no mês' : 'Pagar conta neste mês'}
                      >
                        {activeBillAction === b.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        ) : (
                          b.dynamicStatus === 'pago' ? <RotateCcw size={20} /> : <Check size={20} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg flex flex-col">
          <div className="flex justify-between items-center mb-xl"><h3 className="font-h2 text-[18px] font-semibold text-on-surface">Distribuição</h3><PieChart className="text-on-surface-variant" size={24} /></div>
          <div className="flex-grow flex flex-col gap-lg justify-center">
            {categoryBreakdown.length === 0 ? <p className="text-on-surface-variant text-center">Sem dados.</p> : categoryBreakdown.map((cat, i) => (
              <div key={cat.name}>
                <div className="flex justify-between items-end mb-xs">
                  <div className="flex items-center gap-sm"><div className={`w-3 h-3 rounded-sm ${colors[i % colors.length]}`}></div><span className="text-on-surface">{cat.name}</span></div>
                  <span className="text-[14px] text-on-surface-variant">R$ {fmt(cat.amount)} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden"><div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${cat.percentage}%` }}></div></div>
              </div>
            ))}
          </div>
          <div className="mt-xl pt-lg border-t border-outline-variant">
            <button
              onClick={() => setIsFixedBillModalOpen(true)}
              className="w-full border border-outline-variant text-on-surface font-label-md text-[14px] font-semibold py-sm rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-sm"
            >
              <Plus size={18} />Nova Conta Fixa
            </button>
          </div>
        </div>
      </section>

      {isFixedBillModalOpen && (
        <FixedBillModal onClose={() => setIsFixedBillModalOpen(false)} />
      )}
    </div>
  );
}
