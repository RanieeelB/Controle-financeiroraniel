import {
  FileDown,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Flame,
  Info,
  Landmark,
  ReceiptText,
  Target,
  Wallet,
} from 'lucide-react';
import type { ElementType } from 'react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCreditCards } from '../hooks/useCreditCards';
import { useFinancialGoals } from '../hooks/useFinancialGoals';
import { useFixedBills } from '../hooks/useFixedBills';
import { useInvestments } from '../hooks/useInvestments';
import { useTransactions } from '../hooks/useTransactions';
import { generateMonthlyFinancialReportPdf } from '../services/reportPdfService';
import { formatMonthLabel } from '../lib/monthSelection';
import type { LayoutContext } from '../components/layout/Layout';

export function Reports() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const [isExporting, setIsExporting] = useState(false);
  const { transactions: allTx, isLoading: transactionsLoading } = useTransactions(undefined, selectedMonthRange);
  const { invoiceItems, cards, isLoading: cardsLoading } = useCreditCards(selectedMonthRange);
  const { bills, isLoading: billsLoading, totals: billTotals } = useFixedBills();
  const { investments, isLoading: investmentsLoading, totalCurrentValue } = useInvestments();
  const { goals, isLoading: goalsLoading, totalTarget, totalSaved, overallProgress } = useFinancialGoals();

  const isLoading = transactionsLoading || cardsLoading || billsLoading || investmentsLoading || goalsLoading;
  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const income = allTx.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
  const expense = allTx.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
  const openInvoiceItems = invoiceItems.filter((item) => {
    const linkedTx = allTx.find(t => t.notes === `invoice_item:${item.id}`);
    if (linkedTx) {
      return linkedTx.status !== 'pago';
    }
    
    const signature = `${(item.description || '').trim().toLocaleLowerCase('pt-BR')}|${Number(item.amount).toFixed(2)}|${item.date}`;
    const fallbackTx = allTx.find(t => {
      if (t.payment_method !== undefined && t.payment_method !== 'credito') return false;
      if (!t.description || typeof t.amount !== 'number' || !t.date) return false;
      const tSig = `${t.description.trim().toLocaleLowerCase('pt-BR')}|${t.amount.toFixed(2)}|${t.date}`;
      return tSig === signature;
    });
    
    if (fallbackTx) {
      return fallbackTx.status !== 'pago';
    }
    return true;
  });

  const openInvoices = openInvoiceItems.reduce((s, item) => s + item.amount, 0);
  const operationalBalance = income - expense;
  const analyzedItems = allTx.length + invoiceItems.length + bills.length + investments.length + goals.length;

  const catMap = new Map<string, number>();
  allTx.filter(t => t.type === 'gasto').forEach(t => {
    const name = t.category?.name || 'Outros';
    catMap.set(name, (catMap.get(name) || 0) + t.amount);
  });
  const topExpenses = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxExpense = topExpenses.length > 0 ? topExpenses[0][1] : 1;

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const monthKey = selectedMonthRange.monthKey;
      const monthLabel = formatMonthLabel(monthKey);
      
      generateMonthlyFinancialReportPdf({
        monthLabel,
        income,
        expense,
        openInvoices,
        fixedBillsTotal: billTotals.total,
        investmentsTotal: totalCurrentValue,
        operationalBalance,
        transactions: allTx,
        invoiceItems: openInvoiceItems,
        cards,
        bills,
        investments,
        goals
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-md min-w-0">
      <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
        <button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-sm">Resumo Geral</button>
      </div>
      <div className="flex items-center gap-sm min-w-0">
        <div className="flex items-center gap-sm text-on-surface-variant text-[15px] sm:text-[16px]">
          <Info size={16} /><span>{analyzedItems} itens</span>
        </div>
        <button 
          onClick={handleExportPdf}
          disabled={isExporting}
          className="justify-center px-lg py-sm rounded-md font-label-md text-[14px] font-semibold bg-primary text-on-primary hover:bg-primary-fixed transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm min-h-10 sm:min-h-11"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-primary"></div>
          ) : (
            <FileDown size={18} />
          )}
          <span className="hidden sm:inline">{isExporting ? 'Gerando...' : 'Exportar PDF'}</span>
          <span className="sm:hidden">{isExporting ? '...' : 'PDF'}</span>
        </button>
      </div>
    </div>
  );

  if (analyzedItems === 0) {
    return (
      <div className="space-y-lg lg:space-y-xl min-w-0">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant gap-md">
          <div className="bg-surface-variant p-lg rounded-full"><Flame size={48} className="text-primary" /></div>
          <h2 className="font-h1 text-[32px] font-semibold text-on-surface">Sem dados para relatório</h2>
          <p className="font-body-md text-[16px] max-w-[28rem] text-center">Cadastre lançamentos, cartões, contas, investimentos ou metas para visualizar seu resumo financeiro.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg lg:space-y-xl min-w-0">
      {renderHeader()}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-sm sm:gap-lg">
        <KpiCard title="Receita Total" value={`R$ ${fmt(income)}`} icon={ArrowUp} tone="primary" />
        <KpiCard title="Gastos Lançados" value={`R$ ${fmt(expense)}`} icon={ArrowDown} tone="tertiary" />
        <KpiCard title="Saldo Operacional" value={`R$ ${fmt(operationalBalance)}`} icon={Landmark} tone={operationalBalance >= 0 ? 'primary' : 'error'} />
        <KpiCard title="Faturas Abertas" value={`R$ ${fmt(openInvoices)}`} icon={CreditCard} tone="secondary" />
        <KpiCard title="Contas Fixas" value={`R$ ${fmt(billTotals.total)}`} icon={ReceiptText} tone="tertiary" />
        <KpiCard title="Investimentos" value={`R$ ${fmt(totalCurrentValue)}`} icon={Wallet} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg min-w-0">
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg min-w-0">
          <div className="flex items-center gap-sm mb-lg"><Target className="text-primary" size={24} /><h3 className="font-h2 text-[24px] font-semibold text-on-surface">Metas</h3></div>
          <div className="font-numeral-lg text-[24px] min-[390px]:text-[28px] sm:text-[32px] text-on-surface mb-xs break-words">R$ {fmt(totalSaved)}</div>
          <p className="text-on-surface-variant mb-md">de R$ {fmt(totalTarget)} acumulados</p>
          <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${overallProgress}%` }}></div>
          </div>
          <p className="text-[12px] text-primary mt-sm text-right">{overallProgress}%</p>
        </div>

        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg min-w-0">
          <div className="flex items-center gap-sm mb-lg"><Flame className="text-tertiary-container" size={24} /><h3 className="font-h2 text-[24px] font-semibold text-on-surface">Maiores Gastos</h3></div>
          <div className="space-y-md">
            {topExpenses.map(([name, amount]) => (
              <div key={name} className="group">
                <div className="flex justify-between items-center gap-md mb-xs min-w-0">
                  <span className="text-on-surface truncate min-w-0">{name}</span>
                  <span className="font-numeral-lg text-[16px] text-on-surface">R$ {fmt(amount)}</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden"><div className="bg-tertiary-container h-full" style={{ width: `${(amount / maxExpense) * 100}%` }}></div></div>
              </div>
            ))}
            {topExpenses.length === 0 && <p className="text-on-surface-variant">Sem gastos registrados.</p>}
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg min-w-0">
          <div className="flex items-center gap-sm mb-lg"><CreditCard className="text-secondary" size={24} /><h3 className="font-h2 text-[24px] font-semibold text-on-surface">Cartões</h3></div>
          <div className="space-y-md">
            {cards.map(card => {
              const total = openInvoiceItems.filter(item => item.card_id === card.id).reduce((sum, item) => sum + item.amount, 0);
              return (
                <div key={card.id} className="flex justify-between items-center gap-md border-b border-outline-variant/50 pb-sm last:border-0 min-w-0">
                  <div className="min-w-0">
                    <p className="text-on-surface truncate">{card.name}</p>
                    <p className="text-[12px] text-on-surface-variant">{card.brand} final {card.last_digits}</p>
                  </div>
                  <span className="font-numeral-lg text-[16px] text-on-surface shrink-0">R$ {fmt(total)}</span>
                </div>
              );
            })}
            {cards.length === 0 && <p className="text-on-surface-variant">Nenhum cartão cadastrado.</p>}
          </div>
        </div>
      </div>

      <div className="bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg overflow-hidden">
        <div className="flex justify-between items-center mb-lg"><h3 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">Últimas Transações</h3></div>
        <div className="md:hidden space-y-sm">
          {allTx.length === 0 ? (
            <div className="py-lg text-center text-on-surface-variant">Nenhuma transação registrada.</div>
          ) : allTx.slice(0, 6).map(t => (
            <article key={t.id} className="bg-surface border border-outline-variant/50 rounded-xl p-md min-w-0">
              <div className="flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-on-surface truncate">{t.description}</p>
                  <p className="text-[12px] text-on-surface-variant mt-1">{paymentLabel(t.payment_method)}</p>
                </div>
                <span className={`text-sm shrink-0 ${t.type === 'entrada' ? 'text-primary' : 'text-tertiary-container'}`}>{t.type === 'entrada' ? 'Entrada' : 'Gasto'}</span>
              </div>
              <p className={`mt-md text-right font-numeral-lg text-[18px] font-bold ${t.type === 'entrada' ? 'text-primary' : 'text-on-surface'}`}>{t.type === 'entrada' ? '+' : '-'} R$ {fmt(t.amount)}</p>
            </article>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead><tr className="border-b border-outline-variant"><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Descrição</th><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Tipo</th><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Pagamento</th><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold text-right">Valor</th></tr></thead>
            <tbody className="divide-y divide-outline-variant/50">
              {allTx.slice(0, 6).map(t => (
                <tr key={t.id} className="hover:bg-surface-variant/30 transition-colors">
                  <td className="py-md px-sm text-on-surface">{t.description}</td>
                  <td className="py-md px-sm"><span className={`text-sm ${t.type === 'entrada' ? 'text-primary' : 'text-tertiary-container'}`}>{t.type === 'entrada' ? 'Entrada' : 'Gasto'}</span></td>
                  <td className="py-md px-sm text-on-surface-variant">{paymentLabel(t.payment_method)}</td>
                  <td className={`py-md px-sm text-right font-bold ${t.type === 'entrada' ? 'text-primary' : 'text-on-surface'}`}>{t.type === 'entrada' ? '+' : '-'} R$ {fmt(t.amount)}</td>
                </tr>
              ))}
              {allTx.length === 0 && <tr><td colSpan={4} className="py-lg text-center text-on-surface-variant">Nenhuma transação registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type KpiTone = 'primary' | 'secondary' | 'tertiary' | 'error';

interface KpiCardProps {
  title: string;
  value: string;
  icon: ElementType;
  tone: KpiTone;
}

function KpiCard({ title, value, icon: Icon, tone }: KpiCardProps) {
  const tones: Record<KpiTone, string> = {
    primary: 'text-primary bg-primary/10 border-primary/30',
    secondary: 'text-secondary bg-secondary/10 border-secondary/30',
    tertiary: 'text-tertiary-container bg-tertiary-container/10 border-tertiary-container/30',
    error: 'text-error bg-error/10 border-error/30',
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-sm min-[390px]:p-md sm:p-lg relative overflow-hidden group hover:border-primary/50 transition-colors min-w-0">
      <div className="flex justify-between items-start gap-sm mb-sm sm:mb-md">
        <p className="font-label-md text-[10px] min-[390px]:text-[11px] sm:text-[14px] font-semibold text-on-surface-variant uppercase leading-tight">{title}</p>
        <div className={`p-sm rounded-md border ${tones[tone]}`}><Icon size={20} /></div>
      </div>
      <h3 className="font-numeral-lg text-[18px] min-[390px]:text-[20px] sm:text-[24px] font-medium text-on-surface mb-xs break-words">{value}</h3>
    </div>
  );
}

function paymentLabel(method: string) {
  const labels: Record<string, string> = {
    pix: 'Pix',
    credito: 'Cartão',
    debito: 'Débito',
    dinheiro: 'Dinheiro',
    transferencia: 'Transferência',
  };

  return labels[method] ?? method;
}
