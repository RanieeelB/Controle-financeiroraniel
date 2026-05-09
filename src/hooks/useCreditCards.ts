import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { CreditCard, InvoiceItem, Transaction } from '../types/financial';
import type { MonthRange } from '../lib/monthSelection';

export function useCreditCards(monthRange?: MonthRange) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<Array<Pick<Transaction, 'id' | 'notes' | 'status'>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const startDate = monthRange?.startDate;
  const endDate = monthRange?.endDate;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: cardsData, error: cardsErr } = await supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: true });
      if (cardsErr) throw cardsErr;
      if (cardsData) {
        setCards(cardsData.map((c: Record<string, unknown>) => ({
          ...c,
          credit_limit: Number(c.credit_limit),
        })) as CreditCard[]);
      }

      let itemsQuery = supabase
        .from('invoice_items')
        .select('*, category:categories(*), credit_card:credit_cards(*)')
        .order('date', { ascending: false });
      let creditTransactionsQuery = supabase
        .from('transactions')
        .select('id, notes, status')
        .eq('payment_method', 'credito');
      if (startDate) itemsQuery = itemsQuery.gte('date', startDate);
      if (endDate) itemsQuery = itemsQuery.lt('date', endDate);
      if (startDate) creditTransactionsQuery = creditTransactionsQuery.gte('date', startDate);
      if (endDate) creditTransactionsQuery = creditTransactionsQuery.lt('date', endDate);

      const { data: itemsData, error: itemsErr } = await itemsQuery;
      if (itemsErr) throw itemsErr;
      if (itemsData) {
        setInvoiceItems(itemsData.map((i: Record<string, unknown>) => ({
          ...i,
          amount: Number(i.amount),
        })) as InvoiceItem[]);
      }

      const { data: creditTransactionsData, error: creditTransactionsErr } = await creditTransactionsQuery;
      if (creditTransactionsErr) throw creditTransactionsErr;
      setCreditTransactions((creditTransactionsData ?? []) as Array<Pick<Transaction, 'id' | 'notes' | 'status'>>);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchData();
  }), [fetchData]);

  function getCardItems(cardId: string) {
    return invoiceItems.filter(i => i.card_id === cardId);
  }

  function getCardTotal(cardId: string) {
    return getCardItems(cardId).reduce((s, i) => s + i.amount, 0);
  }

  return { cards, invoiceItems, creditTransactions, isLoading, getCardItems, getCardTotal, refetch: fetchData };
}
