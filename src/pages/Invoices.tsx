import { CreditCard, Plus, ShoppingBag, Filter, Inbox, Eye, X } from 'lucide-react';
import { useCreditCards } from '../hooks/useCreditCards';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { InvoicePurchaseModal } from '../components/finance/FinanceModals';
import { RecordActionsMenu } from '../components/finance/RecordActionsMenu';
import { deleteInvoicePurchase, payCreditInvoiceTransactions, reopenCreditInvoiceTransactions } from '../lib/financialActions';
import { getInvoiceActionState, getInvoicePaymentStatus, getPaidInvoiceTransactionIds, getPayableInvoiceTransactionIds } from '../lib/invoicePayments';
import type { LayoutContext } from '../components/layout/Layout';

export function Invoices() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const { cards, invoiceItems, creditTransactions, isLoading, refetch } = useCreditCards(selectedMonthRange);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [selectedInvoiceCardId, setSelectedInvoiceCardId] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const grouped = invoiceItems.reduce((acc, item) => {
    const dateKey = new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, typeof invoiceItems>);
  const selectedInvoiceCard = cards.find(card => card.id === selectedInvoiceCardId);
  const selectedInvoiceState = selectedInvoiceCard ? getCardInvoiceState(selectedInvoiceCard.id) : null;

  function getCardInvoiceState(cardId: string) {
    const cardItems = invoiceItems.filter(item => item.card_id === cardId);
    const invoiceStatus = getInvoicePaymentStatus(cardItems, creditTransactions);
    const payableTransactionIds = getPayableInvoiceTransactionIds(cardItems, creditTransactions);
    const paidTransactionIds = getPaidInvoiceTransactionIds(cardItems, creditTransactions);
    const invoiceAction = getInvoiceActionState({
      invoiceStatus,
      payableTransactionIds,
      paidTransactionIds,
      isPayingInvoice: payingCardId === cardId,
    });
    const cardTotal = cardItems.reduce((sum, item) => sum + item.amount, 0);

    return { cardItems, invoiceStatus, payableTransactionIds, paidTransactionIds, invoiceAction, cardTotal };
  }

  async function handleToggleInvoicePayment(cardId: string) {
    const { invoiceAction, payableTransactionIds, paidTransactionIds } = getCardInvoiceState(cardId);
    if (invoiceAction.action === 'none') return;

    setPayingCardId(cardId);
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
      setPayingCardId(null);
    }
  }

  return (
    <div className="space-y-lg lg:space-y-xl min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div className="min-w-0">
          <h2 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">Faturas por cartão</h2>
          <p className="text-[14px] text-on-surface-variant">Cartão | Fatura e vencimento | Ação</p>
        </div>
        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all shadow-[0_0_15px_rgba(117,255,158,0.2)] flex items-center justify-center gap-sm min-h-11 w-full sm:w-auto"
        >
          <Plus size={18} />Nova Compra
        </button>
      </div>

      <section className="space-y-sm">
        {cards.map(card => {
          const { cardItems, invoiceStatus, invoiceAction, cardTotal } = getCardInvoiceState(card.id);
          const limitUsed = card.credit_limit > 0 ? Math.min(100, Math.round((cardTotal / card.credit_limit) * 100)) : 0;

          return (
            <article key={card.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-sm md:items-center bg-surface-container border border-outline-variant rounded-xl p-md min-w-0 overflow-hidden">
              <div className="flex items-center gap-sm min-w-0">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant" style={{ backgroundColor: `${card.color}25`, color: card.color }}>
                  <CreditCard size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface truncate">{card.name}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">{card.brand} final {card.last_digits}</p>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">Fatura e vencimento</p>
                <div className="flex items-end justify-between gap-md mt-xs">
                  <p className="font-numeral-lg text-[22px] sm:text-[24px] font-semibold text-on-surface break-words">R$ {fmt(cardTotal)}</p>
                  <span className={`inline-flex text-[10px] font-semibold px-sm py-[2px] rounded-full uppercase border shrink-0 ${
                    invoiceStatus === 'paid'
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30'
                  }`}>
                    {invoiceStatus === 'paid' ? 'Paga' : 'Aberta'}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant mt-xs">Vence dia {card.due_day} • {cardItems.length} compra(s)</p>
                <div className="w-full bg-surface-variant rounded-full h-1.5 mt-sm overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${limitUsed}%`, backgroundColor: card.color }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-xs w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceCardId(card.id)}
                  className="px-md py-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-[13px] font-semibold hover:bg-surface-container-high transition-colors min-h-11 w-full md:w-auto flex items-center justify-center gap-xs"
                >
                  <Eye size={16} />
                  Ver fatura
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleInvoicePayment(card.id)}
                  disabled={invoiceAction.disabled}
                  className="px-md py-sm rounded-lg border border-primary/30 text-primary text-[13px] font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-11 w-full md:w-auto"
                >
                  {invoiceAction.label}
                </button>
              </div>
            </article>
          );
        })}

        {cards.length === 0 && (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg text-center text-on-surface-variant">
            Nenhum cartão cadastrado.
          </div>
        )}
      </section>

      <section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-md sm:p-lg border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Lançamentos</h3>
          <div className="flex gap-sm"><button className="p-xs text-on-surface-variant hover:text-on-surface"><Filter size={20} /></button></div>
        </div>
        <div className="p-md sm:p-lg">
          {invoiceItems.length === 0 ? (
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
          defaultCardId={cards[0]?.id}
          onClose={() => setIsPurchaseModalOpen(false)}
        />
      )}

      {selectedInvoiceCard && selectedInvoiceState && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-lg">
          <div className="bg-surface-container border border-outline-variant rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-[680px] max-h-[90dvh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-surface-container/95 backdrop-blur border-b border-outline-variant p-md sm:p-lg flex items-start justify-between gap-md">
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-wider text-on-surface-variant">Fatura de {selectedInvoiceCard.name}</p>
                <h3 className="font-h2 text-[22px] font-semibold text-on-surface truncate">R$ {fmt(selectedInvoiceState.cardTotal)}</h3>
                <p className="text-[13px] text-on-surface-variant">Vence dia {selectedInvoiceCard.due_day} • {selectedInvoiceState.cardItems.length} compra(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceCardId(null)}
                className="rounded-full border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors min-h-10 min-w-10 flex items-center justify-center shrink-0"
                aria-label="Fechar fatura"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-md sm:p-lg space-y-md">
              <div className="rounded-2xl border border-outline-variant bg-surface p-md flex items-center justify-between gap-md">
                <div className="flex items-center gap-sm min-w-0">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant" style={{ backgroundColor: `${selectedInvoiceCard.color}25`, color: selectedInvoiceCard.color }}>
                    <CreditCard size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{selectedInvoiceCard.brand} final {selectedInvoiceCard.last_digits}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">Limite R$ {fmt(selectedInvoiceCard.credit_limit)}</p>
                  </div>
                </div>
                <span className={`inline-flex text-[10px] font-semibold px-sm py-[2px] rounded-full uppercase border shrink-0 ${
                  selectedInvoiceState.invoiceStatus === 'paid'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30'
                }`}>
                  {selectedInvoiceState.invoiceStatus === 'paid' ? 'Paga' : 'Aberta'}
                </span>
              </div>

              {selectedInvoiceState.cardItems.length === 0 ? (
                <div className="flex flex-col items-center py-xl text-on-surface-variant gap-md text-center">
                  <Inbox size={44} className="text-outline-variant" />
                  <p>Nenhuma compra registrada nesta fatura.</p>
                </div>
              ) : (
                <div className="space-y-sm">
                  {selectedInvoiceState.cardItems.map(item => (
                    <div key={item.id} className="rounded-xl border border-outline-variant/60 bg-surface p-md min-w-0">
                      <div className="flex items-start justify-between gap-md min-w-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-on-surface truncate">{item.description}</p>
                          <p className="text-[13px] text-on-surface-variant mt-1">
                            {item.category?.name || 'Sem categoria'} • {new Date(item.date).toLocaleDateString('pt-BR')}
                            {item.total_installments > 1 && ` • ${item.current_installment}/${item.total_installments}`}
                          </p>
                        </div>
                        <p className="font-numeral-lg text-[16px] text-on-surface shrink-0">R$ {fmt(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
