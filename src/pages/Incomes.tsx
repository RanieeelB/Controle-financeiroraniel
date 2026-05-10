import { useState } from 'react';
import { ArrowUpRight, Calendar, Search, Inbox } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { RecordActionsMenu } from '../components/finance/RecordActionsMenu';
import { useTransactions } from '../hooks/useTransactions';
import { deleteFinancialTransaction, markTransactionStatus } from '../lib/financialActions';
import type { LayoutContext } from '../components/layout/Layout';

export function Incomes() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const { transactions, isLoading, totals, topCategory, refetch } = useTransactions('entrada', selectedMonthRange);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-lg lg:gap-xl min-w-0">
      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm sm:gap-lg">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md sm:p-lg relative overflow-hidden group shadow-[0_0_15px_rgba(0,230,118,0.05)] min-w-0 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Total Recebido</h3>
            <div className="text-primary bg-primary/10 p-sm rounded-lg flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-h2 text-body-md text-on-surface-variant">R$</span>
            <span className="font-display-lg text-[32px] min-[390px]:text-[36px] sm:text-[48px] font-bold text-on-surface tracking-tight break-words">{fmt(totals.paid)}</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md sm:p-lg relative group min-w-0">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Pendente</h3>
            <div className="text-secondary bg-secondary/10 p-sm rounded-lg flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-h2 text-body-md text-on-surface-variant">R$</span>
            <span className="font-h1 text-[24px] min-[390px]:text-[28px] sm:text-[32px] font-semibold text-on-surface tracking-tight break-words">{fmt(totals.pending)}</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant font-body-md text-sm">
            <span>{totals.pendingCount} lançamentos aguardando</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md sm:p-lg relative group min-w-0">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Maior Fonte</h3>
            <div className="text-tertiary-container bg-tertiary-container/10 p-sm rounded-lg flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface truncate">{topCategory.name}</span>
            <span className="font-numeral-lg text-[20px] sm:text-[24px] text-on-surface-variant tracking-tight break-words">R$ {fmt(topCategory.amount)}</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant font-body-md text-sm">
            <span>{topCategory.percentage}% do total recebido</span>
          </div>
        </div>
      </section>

      {/* Detailed List */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl flex flex-col overflow-hidden mb-xl min-w-0">
        <div className="p-md sm:p-lg border-b border-outline-variant flex flex-col sm:flex-row sm:justify-between sm:items-center gap-md bg-surface-container-highest/30">
          <h3 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">Lançamentos Detalhados</h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              className="bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm text-on-surface font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-full sm:w-64 placeholder-on-surface-variant/50"
              placeholder="Buscar entrada..."
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="md:hidden p-md space-y-sm">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center gap-md py-xl text-center text-on-surface-variant">
              <Inbox size={40} className="text-outline-variant" />
              <p>{searchQuery ? 'Nenhuma entrada encontrada para a busca.' : 'Nenhuma entrada registrada ainda.'}</p>
            </div>
          ) : filteredTransactions.map(t => (
            <article key={t.id} className="bg-surface border border-outline-variant/50 rounded-xl p-md min-w-0">
              <div className="flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-on-surface truncate">{t.description}</p>
                  <p className="text-[12px] text-on-surface-variant mt-1">
                    {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <RecordActionsMenu
                  label={t.description}
                  primaryActionLabel={t.status === 'pendente' ? 'Marcar como recebido' : 'Marcar como pendente'}
                  onPrimaryAction={async () => {
                    await markTransactionStatus(t.id, t.status === 'pendente' ? 'recebido' : 'pendente');
                    await refetch();
                  }}
                  onDelete={async () => {
                    await deleteFinancialTransaction(t);
                    await refetch();
                  }}
                />
              </div>
              <div className="mt-md flex items-end justify-between gap-md">
                <div className="min-w-0">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface-bright text-on-surface border border-outline-variant/50 max-w-full">
                    <span className="truncate">{t.category?.name || 'Sem categoria'}</span>
                  </span>
                  <div className={`mt-sm inline-flex items-center gap-1.5 text-sm ${t.status === 'recebido' ? 'text-primary' : 'text-secondary'}`}>
                    <span className={`w-2 h-2 rounded-full ${t.status === 'recebido' ? 'bg-primary shadow-[0_0_15px_rgba(0,230,118,0.5)]' : 'bg-secondary'}`}></span>
                    {t.status === 'recebido' ? 'Recebido' : 'Pendente'}
                  </div>
                </div>
                <p className="font-numeral-lg text-[18px] font-semibold text-primary text-right shrink-0">R$ {fmt(t.amount)}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-xl text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-md">
                      <Inbox size={48} className="text-outline-variant" />
                      <p>{searchQuery ? 'Nenhuma entrada encontrada para a busca.' : 'Nenhuma entrada registrada ainda.'}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.map(t => (
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
                      primaryActionLabel={t.status === 'pendente' ? 'Marcar como recebido' : 'Marcar como pendente'}
                      onPrimaryAction={async () => {
                        await markTransactionStatus(t.id, t.status === 'pendente' ? 'recebido' : 'pendente');
                        await refetch();
                      }}
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
