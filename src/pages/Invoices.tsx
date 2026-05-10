import { CreditCard, Plus, ShoppingBag, Filter, Inbox } from 'lucide-react';
import { useCreditCards } from '../hooks/useCreditCards';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { InvoicePurchaseModal } from '../components/finance/FinanceModals';
import { RecordActionsMenu } from '../components/finance/RecordActionsMenu';
import { deleteInvoicePurchase, payCreditInvoiceTransactions, reopenCreditInvoiceTransactions } from '../lib/financialActions';
import { getInvoiceActionState, getInvoicePaymentStatus, getPaidInvoiceTransactionIds, getPayableInvoiceTransactionIds } from '../lib/invoicePayments';
import type { LayoutContext } from '../components/layout/Layout';

export function Invoices() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const { cards, invoiceItems, creditTransactions, isLoading, refetch } = useCreditCards(selectedMonthRange);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPayingInvoice, setIsPayingInvoice] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const activeCard = selectedCardId ? cards.find(c => c.id === selectedCardId) : cards[0];
  const filteredItems = activeCard ? invoiceItems.filter(i => i.card_id === activeCard.id) : invoiceItems;
  const cardTotal = filteredItems.reduce((s, i) => s + i.amount, 0);
  const available = activeCard ? activeCard.credit_limit - cardTotal : 0;
  const invoiceStatus = getInvoicePaymentStatus(filteredItems, creditTransactions);
  const payableTransactionIds = getPayableInvoiceTransactionIds(filteredItems, creditTransactions);
  const paidTransactionIds = getPaidInvoiceTransactionIds(filteredItems, creditTransactions);
  const invoiceAction = getInvoiceActionState({
    invoiceStatus,
    payableTransactionIds,
    paidTransactionIds,
    isPayingInvoice,
  });

  const grouped = filteredItems.reduce((acc, item) => {
    const dateKey = new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  async function handleToggleInvoicePayment() {
    if (invoiceAction.action === 'none') return;

    setIsPayingInvoice(true);
    try {
      if (invoiceAction.action === 'reopen') {
        await reopenCreditInvoiceTransactions(paidTransactionIds);
      } else {
        await payCreditInvoiceTransactions(payableTransactionIds);
      }
      await refetch();
    } catch (error) {
      console.error('Error toggling invoice payment:', error);
      window.alert(invoiceAction.action === 'reopen'
        ? 'Não foi possível reabrir a fatura.'
        : 'Não foi possível marcar a fatura como paga.');
    } finally {
      setIsPayingInvoice(false);
    }
  }

  return (
    <div className="space-y-lg lg:space-y-xl min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div className="grid grid-cols-2 sm:flex gap-sm bg-surface-container rounded-2xl p-1.5 border border-outline-variant max-w-full w-full sm:w-auto">
          {cards.map(card => (
            <button key={card.id} onClick={() => setSelectedCardId(card.id)}
              aria-pressed={activeCard?.id === card.id}
              className={`px-sm sm:px-lg py-sm rounded-xl font-label-md text-[12px] min-[390px]:text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-sm transition-colors min-h-11 min-w-0 ${activeCard?.id === card.id ? 'border shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
              style={activeCard?.id === card.id ? { backgroundColor: `${card.color}30`, color: card.color, borderColor: `${card.color}50` } : {}}>
              <CreditCard size={16} className="shrink-0" />
              <span className="truncate">{card.name}</span>
            </button>
          ))}
          {cards.length === 0 && <span className="px-lg py-sm text-on-surface-variant text-sm">Nenhum cartão</span>}
        </div>
        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all shadow-[0_0_15px_rgba(117,255,158,0.2)] flex items-center justify-center gap-sm min-h-11 w-full sm:w-auto"
        >
          <Plus size={18} />Nova Compra
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm sm:gap-lg">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg relative overflow-hidden min-w-0 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: activeCard?.color }}></div>
          <div className="flex justify-between items-start mb-md">
            <span className="text-on-surface-variant">Fatura Atual</span>
            <span className={`inline-flex text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase border ${
              invoiceStatus === 'paid'
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30'
            }`}>
              {invoiceStatus === 'paid' ? 'Paga' : 'Aberta'}
            </span>
          </div>
          <span className="font-numeral-lg text-[30px] sm:text-[36px] font-bold text-on-surface break-words">R$ {fmt(cardTotal)}</span>
          {activeCard && <p className="text-[13px] text-on-surface-variant mt-sm">Vence todo dia {activeCard.due_day}</p>}
          <button
            type="button"
            onClick={handleToggleInvoicePayment}
            disabled={invoiceAction.disabled}
            className="mt-md px-md py-sm rounded-lg border border-primary/30 text-primary text-[13px] font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
          >
            {invoiceAction.label}
          </button>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg relative overflow-hidden hover:border-primary/50 transition-colors min-w-0">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30"></div>
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Limite Disponível</span><CreditCard className="text-primary" size={24} /></div>
          <span className="font-numeral-lg text-[24px] min-[390px]:text-[28px] sm:text-[32px] text-on-surface break-words">R$ {fmt(available)}</span>
          {activeCard && <div className="w-full bg-surface-variant rounded-full h-1.5 mt-md overflow-hidden"><div className="h-full rounded-full" style={{ width: `${activeCard.credit_limit > 0 ? Math.round((cardTotal / activeCard.credit_limit) * 100) : 0}%`, backgroundColor: activeCard.color }}></div></div>}
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg min-w-0">
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Itens na fatura</span><ShoppingBag className="text-tertiary-container" size={24} /></div>
          <span className="font-numeral-lg text-[32px] text-on-surface">{filteredItems.length}</span>
          <p className="text-[14px] text-on-surface-variant mt-sm">{filteredItems.filter(i => i.total_installments > 1).length} parcelados</p>
        </div>
      </section>

      <section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md sm:p-lg border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Lançamentos</h3>
          <div className="flex gap-sm"><button className="p-xs text-on-surface-variant hover:text-on-surface"><Filter size={20} /></button></div>
        </div>
        <div className="p-md sm:p-lg">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center py-xl text-on-surface-variant gap-md"><Inbox size={48} className="text-outline-variant" /><p>Nenhuma compra registrada.</p></div>
          ) : (
            <div className="space-y-md">
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel} className="relative pl-lg sm:pl-xl">
                  <div className="absolute left-[11px] top-8 bottom-0 w-px bg-outline-variant/50"></div>
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary"></div></div>
                  <h4 className="font-label-md text-[12px] sm:text-[14px] font-semibold text-on-surface-variant mb-md uppercase tracking-wider">{dateLabel}</h4>
                  {items.map(item => (
                    <div key={item.id} className="bg-surface border border-outline-variant/50 rounded-lg p-md hover:bg-surface-variant/30 transition-colors mb-sm min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-md min-w-0">
                        <div className="flex items-center gap-md min-w-0">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant shrink-0"><ShoppingBag size={18} className="text-on-surface-variant" /></div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-sm min-w-0">
                              <p className="text-[16px] font-medium text-on-surface truncate">{item.description}</p>
                              {item.total_installments > 1 && <span className="bg-secondary/10 text-secondary border border-secondary/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Parcelado</span>}
                            </div>
                            <p className="text-[13px] text-on-surface-variant mt-0.5">{item.category?.name || 'Sem categoria'}{item.total_installments > 1 && ` • ${item.current_installment}/${item.total_installments}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-md">
                          <div className="text-right">
                            <p className="font-numeral-lg text-[16px] text-on-surface">R$ {fmt(item.amount)}</p>
                            {item.total_installments > 1 && <p className="text-[12px] text-on-surface-variant mt-0.5">de R$ {fmt(item.amount * item.total_installments)}</p>}
                          </div>
                          <RecordActionsMenu
                            label={item.description}
                            onDelete={async () => {
                              await deleteInvoicePurchase(item);
                              await refetch();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {isPurchaseModalOpen && (
        <InvoicePurchaseModal
          defaultCardId={activeCard?.id}
          onClose={() => setIsPurchaseModalOpen(false)}
        />
      )}
    </div>
  );
}
