import { ArrowUpRight, Calendar, Search, Inbox } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { RecordActionsMenu } from '../components/finance/RecordActionsMenu';
import { useTransactions } from '../hooks/useTransactions';
import { deleteFinancialTransaction } from '../lib/financialActions';
import type { LayoutContext } from '../components/layout/Layout';

export function Incomes() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const { transactions, isLoading, totals, topCategory, refetch } = useTransactions('entrada', selectedMonthRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-xl">
      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg relative overflow-hidden group shadow-[0_0_15px_rgba(0,230,118,0.05)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Total Recebido</h3>
            <div className="text-primary bg-primary/10 p-sm rounded-lg flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-h2 text-body-md text-on-surface-variant">R$</span>
            <span className="font-display-lg text-[48px] font-bold text-on-surface tracking-tight">{fmt(totals.paid)}</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg relative group">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Pendente</h3>
            <div className="text-secondary bg-secondary/10 p-sm rounded-lg flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-h2 text-body-md text-on-surface-variant">R$</span>
            <span className="font-h1 text-[32px] font-semibold text-on-surface tracking-tight">{fmt(totals.pending)}</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant font-body-md text-sm">
            <span>{totals.pendingCount} lançamentos aguardando</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg relative group">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Maior Fonte</h3>
            <div className="text-tertiary-container bg-tertiary-container/10 p-sm rounded-lg flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-h2 text-[24px] font-semibold text-on-surface">{topCategory.name}</span>
            <span className="font-numeral-lg text-[24px] text-on-surface-variant tracking-tight">R$ {fmt(topCategory.amount)}</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant font-body-md text-sm">
            <span>{topCategory.percentage}% do total recebido</span>
          </div>
        </div>
      </section>

      {/* Detailed List */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl flex flex-col overflow-hidden mb-xl">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-highest/30">
          <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Lançamentos Detalhados</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              className="bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm text-on-surface font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-64 placeholder-on-surface-variant/50" 
              placeholder="Buscar entrada..." 
              type="text"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/50">
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Data</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Descrição</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Categoria</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Status</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold text-right">Valor</th>
                <th className="py-md px-lg w-16"></th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-xl text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-md">
                      <Inbox size={48} className="text-outline-variant" />
                      <p>Nenhuma entrada registrada ainda.</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.map(t => (
                <tr key={t.id} className="border-b border-outline-variant/30 hover:bg-surface-variant/50 transition-colors group">
                  <td className="py-md px-lg text-on-surface">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-md px-lg text-on-surface font-medium">{t.description}</td>
                  <td className="py-md px-lg">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface-bright text-on-surface border border-outline-variant/50">
                      {t.category?.name || 'Sem categoria'}
                    </span>
                  </td>
                  <td className="py-md px-lg">
                    <span className={`inline-flex items-center gap-1.5 text-sm ${t.status === 'recebido' ? 'text-primary' : 'text-secondary'}`}>
                      <span className={`w-2 h-2 rounded-full ${t.status === 'recebido' ? 'bg-primary shadow-[0_0_15px_rgba(0,230,118,0.5)]' : 'bg-secondary'}`}></span>
                      {t.status === 'recebido' ? 'Recebido' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-md px-lg text-right font-numeral-lg text-[24px] font-medium text-on-surface">R$ {fmt(t.amount)}</td>
                  <td className="py-md px-lg text-right">
                    <RecordActionsMenu
                      label={t.description}
                      onDelete={async () => {
                        await deleteFinancialTransaction(t);
                        await refetch();
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
