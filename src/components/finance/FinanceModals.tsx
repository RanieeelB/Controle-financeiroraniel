import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, ChevronDown, X } from 'lucide-react';
import {
  createCreditCard,
  createCreditPurchasesBatch,
  createFinancialGoal,
  createFixedBill,
  createInvestment,
  createInvestmentDeposit,
  updateCreditCard,
} from '../../lib/financialActions';
import { getInstallmentAmount, parseCurrencyValue, type InvoicePurchaseBatchItemInput } from '../../lib/financialPayloads';
import { useCategories } from '../../hooks/useCategories';
import { useCreditCards } from '../../hooks/useCreditCards';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import type { CreditCard, Investment, InvestmentCategory } from '../../types/financial';

const inputClass = 'w-full min-h-11 bg-background border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-outline';
const selectClass = `${inputClass} appearance-none pr-xl`;
const labelClass = 'block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider';
const modalBodyClass = 'p-md sm:p-lg space-y-md';
const modalSectionClass = 'rounded-xl border border-outline-variant bg-surface/60 p-md space-y-md min-w-0';
const modalGridClass = 'grid grid-cols-1 sm:grid-cols-2 gap-md';
const modalInstallmentGridClass = 'grid grid-cols-2 md:grid-cols-3 gap-md';
const modalFooterClass = 'sticky bottom-0 z-10 -mx-md sm:-mx-lg px-md sm:px-lg py-md bg-surface-container-low/95 backdrop-blur border-t border-outline-variant flex flex-col min-[390px]:flex-row justify-end gap-md';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

interface ModalShellProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

function ModalShell({ title, subtitle, onClose, children }: ModalShellProps) {
  useLockBodyScroll();

  return createPortal(
    <div className="fixed inset-0 z-[999] isolate flex items-stretch sm:items-center justify-center bg-background/85 backdrop-blur-md p-0 sm:p-md overflow-hidden">
      <div className="w-full sm:max-w-[36rem] h-[100dvh] sm:h-auto sm:max-h-[90dvh] bg-surface-container-low border border-outline-variant rounded-none sm:rounded-xl shadow-2xl overflow-hidden relative flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
        <div className="flex items-start justify-between gap-md px-md sm:px-lg py-md border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h2 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">{title}</h2>
            <p className="font-body-md text-[14px] sm:text-[15px] text-on-surface-variant">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Fechar modal"
          >
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SelectChevron() {
  return <ChevronDown className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={18} />;
}

function ErrorMessage({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]">
      {error}
    </div>
  );
}

function SubmitButton({
  isSaving,
  children,
  type = 'submit',
  onClick,
}: {
  isSaving: boolean;
  children: ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isSaving}
      className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
    >
      <CheckCircle size={18} />
      <span>{isSaving ? 'Salvando...' : children}</span>
    </button>
  );
}

interface InvoicePurchaseModalProps {
  onClose: () => void;
  defaultCardId?: string;
}

export function InvoicePurchaseModal({ onClose, defaultCardId }: InvoicePurchaseModalProps) {
  const { cards } = useCreditCards();
  const { categories } = useCategories('gasto');
  const [cardId, setCardId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [batchItems, setBatchItems] = useState<InvoicePurchaseBatchItemInput[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resolvedCardId = cardId || defaultCardId || cards[0]?.id || '';
  const selectedCard = cards.find(card => card.id === resolvedCardId);
  const parsedAmount = useMemo(() => parseCurrencyValue(amount), [amount]);
  const installmentAmount = parsedAmount ? getInstallmentAmount(parsedAmount, totalInstallments) : 0;
  const batchTotal = useMemo(
    () => batchItems.reduce((sum, item) => sum + item.amount, 0),
    [batchItems],
  );

  const categoryById = useMemo(
    () => new Map(categories.map(category => [category.id, category])),
    [categories],
  );

  function handleInstallmentsChange(value: number) {
    const normalized = Math.max(1, Math.min(48, value));
    setTotalInstallments(normalized);
    setCurrentInstallment(current => Math.min(current, normalized));
  }

  function resetItemForm() {
    setDescription('');
    setAmount('');
    setDate(today());
    setCategoryId('');
    setTotalInstallments(1);
    setCurrentInstallment(1);
  }

  function handleAddToBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const value = parseCurrencyValue(amount);
    if (!resolvedCardId) {
      setError('Cadastre ou selecione um cartão antes de registrar a compra.');
      return;
    }
    if (!description.trim()) {
      setError('Informe a descrição da compra.');
      return;
    }
    if (!value) {
      setError('Informe um valor maior que zero.');
      return;
    }

    setBatchItems(current => [
      ...current,
      {
        description: description.trim(),
        amount: value,
        date,
        categoryId: categoryId || null,
        totalInstallments,
        currentInstallment,
      },
    ]);
    resetItemForm();
  }

  async function handleSubmitBatch() {
    setError('');

    if (!resolvedCardId) {
      setError('Cadastre ou selecione um cartão antes de registrar a compra.');
      return;
    }
    if (batchItems.length === 0) {
      setError('Adicione pelo menos uma compra ao lote antes de salvar a fatura.');
      return;
    }

    setIsSaving(true);
    try {
      await createCreditPurchasesBatch({
        cardId: resolvedCardId,
        items: batchItems,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar a fatura.');
    } finally {
      setIsSaving(false);
    }
  }

  function removeBatchItem(indexToRemove: number) {
    setBatchItems(current => current.filter((_, index) => index !== indexToRemove));
  }

  return (
    <ModalShell title="Nova compra" subtitle="Registre compras no cartão e salve tudo em lote quando precisar." onClose={onClose}>
      <form onSubmit={handleAddToBatch} className={modalBodyClass}>
        <div className={modalSectionClass}>
          <div className="flex items-start justify-between gap-md">
            <div>
              <h3 className="font-label-md text-[13px] font-semibold text-on-surface uppercase tracking-wider">Cartão da compra</h3>
              <p className="text-[13px] text-on-surface-variant">Escolha o cartão antes de montar os itens.</p>
            </div>
            {selectedCard && <span className="rounded-full bg-primary/10 px-sm py-xs text-[12px] font-semibold text-primary">Dia {selectedCard.due_day}</span>}
          </div>

          <label>
            <span className={labelClass}>Cartão</span>
            <div className="relative">
              <select
                value={resolvedCardId}
                onChange={event => setCardId(event.target.value)}
                className={selectClass}
                disabled={batchItems.length > 0}
              >
                <option value="">Selecione</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>{card.name} • {card.brand} final {card.last_digits}</option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </label>

          {selectedCard && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-md py-sm text-[14px] text-on-surface flex flex-col gap-1">
              <span><strong>{selectedCard.name}</strong> selecionado.</span>
              {batchItems.length > 0 && <span>Para trocar de cartão, remova todos os itens do lote primeiro.</span>}
            </div>
          )}
        </div>

        <div className={modalSectionClass}>
          <h3 className="font-label-md text-[13px] font-semibold text-on-surface uppercase tracking-wider">Dados da compra</h3>
          <div className={modalGridClass}>
            <label>
              <span className={labelClass}>Descrição</span>
              <input value={description} onChange={event => setDescription(event.target.value)} className={inputClass} placeholder="Ex: Mercado" />
            </label>
            <label>
              <span className={labelClass}>Valor total</span>
              <input value={amount} onChange={event => setAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
            </label>
          </div>

          <div className={modalGridClass}>
            <label>
              <span className={labelClass}>Data</span>
              <input value={date} onChange={event => setDate(event.target.value)} className={inputClass} type="date" />
            </label>
            <label>
              <span className={labelClass}>Categoria</span>
              <div className="relative">
                <select value={categoryId} onChange={event => setCategoryId(event.target.value)} className={selectClass}>
                  <option value="">Sem categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </label>
          </div>
        </div>

        <div className={`${modalSectionClass} bg-surface`}>
          <div className={modalInstallmentGridClass}>
            <div className="col-span-2 md:col-span-1 rounded-lg bg-background/60 p-md">
              <span className={labelClass}>Valor da parcela</span>
              <p className="font-numeral-lg text-[22px] text-on-surface">R$ {fmt(installmentAmount)}</p>
            </div>
            <label>
              <span className={labelClass}>Parcelas</span>
              <input type="number" min="1" max="48" value={totalInstallments} onChange={event => handleInstallmentsChange(Number(event.target.value))} className={`${inputClass} text-center`} />
            </label>
            <label>
              <span className={labelClass}>Parcela atual</span>
              <input type="number" min="1" max={totalInstallments} value={currentInstallment} onChange={event => setCurrentInstallment(Math.max(1, Math.min(totalInstallments, Number(event.target.value))))} className={`${inputClass} text-center`} />
            </label>
          </div>
        </div>

        <ErrorMessage error={error} />

        <div className={modalSectionClass}>
          <div className="flex items-center justify-between gap-md">
            <div>
              <p className="font-label-md text-[14px] font-semibold text-on-surface uppercase tracking-wider">Itens da compra</p>
              <p className="text-[13px] text-on-surface-variant">{batchItems.length} item(ns) adicionados</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-on-surface-variant">Subtotal</p>
              <p className="font-numeral-lg text-[20px] text-on-surface">R$ {fmt(batchTotal)}</p>
            </div>
          </div>

          {batchItems.length === 0 ? (
            <p className="text-[14px] text-on-surface-variant">Adicione compras acima para montar a fatura antes de salvar.</p>
          ) : (
            <div className="space-y-sm max-h-60 overflow-y-auto pr-1">
              {batchItems.map((item, index) => (
                <div key={`${item.description}-${item.date}-${index}`} className="flex flex-col min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between gap-md rounded-lg border border-outline-variant/60 bg-background px-md py-sm">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-on-surface">{item.description}</p>
                    <p className="text-[13px] text-on-surface-variant">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                      {item.categoryId ? ` • ${categoryById.get(item.categoryId)?.name ?? 'Sem categoria'}` : ' • Sem categoria'}
                      {item.totalInstallments > 1 ? ` • ${item.currentInstallment}/${item.totalInstallments}` : ' • À vista'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between min-[430px]:justify-end gap-sm shrink-0">
                    <span className="font-numeral-lg text-[15px] text-on-surface">R$ {fmt(item.amount)}</span>
                    <button
                      type="button"
                      onClick={() => removeBatchItem(index)}
                      className="rounded-lg border border-outline-variant px-sm py-xs text-[13px] text-on-surface-variant hover:text-error hover:border-error/50 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${modalFooterClass} sm:justify-between flex-col-reverse min-[390px]:flex-row`}>
          <button
            type="submit"
            className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-secondary rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-xs min-h-11"
          >
            <CheckCircle size={18} />
            <span>Adicionar ao lote</span>
          </button>

          <div className="flex flex-col min-[390px]:flex-row justify-end gap-md">
            <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors min-h-11">Cancelar</button>
            <SubmitButton isSaving={isSaving} type="button" onClick={handleSubmitBatch}>Salvar fatura</SubmitButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

interface CreditCardModalProps {
  card?: CreditCard | null;
  onClose: () => void;
}

export function CreditCardModal({ card, onClose }: CreditCardModalProps) {
  const [bank, setBank] = useState(card?.name ?? '');
  const [brand, setBrand] = useState(card?.brand ?? 'Mastercard');
  const [lastDigits, setLastDigits] = useState(card?.last_digits ?? '');
  const [dueDay, setDueDay] = useState(card?.due_day ?? 10);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!bank.trim()) {
      setError('Informe o banco do cartão.');
      return;
    }
    if (lastDigits.replace(/\D/g, '').length !== 4) {
      setError('Informe os 4 últimos dígitos.');
      return;
    }
    if (dueDay < 1 || dueDay > 31) {
      setError('Informe um dia de vencimento entre 1 e 31.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { bank, brand, lastDigits, dueDay };
      if (card) {
        await updateCreditCard(card.id, payload);
      } else {
        await createCreditCard(payload);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o cartão.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title={card ? 'Editar cartão' : 'Adicionar cartão'} subtitle="Cadastre bandeira, banco, vencimento e últimos dígitos." onClose={onClose}>
      <form onSubmit={handleSubmit} className={modalBodyClass}>
        <div aria-label="CartãoPreview" className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-surface p-md min-h-32 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-md">
            <span className="text-[12px] uppercase tracking-widest text-on-surface-variant">{brand}</span>
            <span className="text-[12px] text-on-surface-variant">Vence dia {dueDay || '--'}</span>
          </div>
          <div>
            <p className="font-numeral-lg text-[20px] text-on-surface tracking-[0.18em]">•••• •••• •••• {lastDigits || '0000'}</p>
            <p className="mt-xs text-[14px] font-semibold text-on-surface truncate">{bank || 'Nome do cartão'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface/60 p-md space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <label>
              <span className={labelClass}>Banco</span>
              <input value={bank} onChange={event => setBank(event.target.value)} className={inputClass} placeholder="Ex: Nubank" />
            </label>
            <label>
              <span className={labelClass}>Bandeira</span>
              <div className="relative">
                <select value={brand} onChange={event => setBrand(event.target.value)} className={selectClass}>
                  <option>Mastercard</option>
                  <option>Visa</option>
                  <option>Elo</option>
                  <option>Amex</option>
                  <option>Hipercard</option>
                </select>
                <SelectChevron />
              </div>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <label>
              <span className={labelClass}>Vencimento</span>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={event => setDueDay(Number(event.target.value))}
                className={`${inputClass} text-center`}
              />
            </label>
            <label>
              <span className={labelClass}>Final</span>
              <input value={lastDigits} onChange={event => setLastDigits(event.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inputClass} text-center`} inputMode="numeric" maxLength={4} placeholder="1234" />
            </label>
          </div>
        </div>

        <ErrorMessage error={error} />

        <div className={modalFooterClass}>
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors min-h-11">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar cartão</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function FixedBillModal({ onClose }: { onClose: () => void }) {
  const { categories } = useCategories('gasto');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(10);
  const [status, setStatus] = useState<'pago' | 'pendente' | 'atrasado'>('pendente');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const value = parseCurrencyValue(amount);
    if (!description.trim()) {
      setError('Informe a descrição da conta fixa.');
      return;
    }
    if (!value) {
      setError('Informe um valor maior que zero.');
      return;
    }

    setIsSaving(true);
    try {
      await createFixedBill({ description, amount: value, dueDay, status, categoryId });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar a conta fixa.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Nova conta fixa" subtitle="Cadastre despesas que se repetem todo mês." onClose={onClose}>
      <form onSubmit={handleSubmit} className={modalBodyClass}>
        <div className={modalSectionClass}>
          <h3 className="font-label-md text-[13px] font-semibold text-on-surface uppercase tracking-wider">Conta mensal</h3>
          <label>
            <span className={labelClass}>Descrição</span>
            <input value={description} onChange={event => setDescription(event.target.value)} className={inputClass} placeholder="Ex: Parcela do carro" />
          </label>
          <div className={modalGridClass}>
            <label>
              <span className={labelClass}>Valor mensal</span>
              <input value={amount} onChange={event => setAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
            </label>
            <label>
              <span className={labelClass}>Vencimento</span>
              <input type="number" min="1" max="31" value={dueDay} onChange={event => setDueDay(Number(event.target.value))} className={`${inputClass} text-center`} />
            </label>
          </div>
        </div>

        <div className={modalSectionClass}>
          <h3 className="font-label-md text-[13px] font-semibold text-on-surface uppercase tracking-wider">Organização</h3>
          <div className={modalGridClass}>
            <label>
              <span className={labelClass}>Status</span>
              <div className="relative">
                <select value={status} onChange={event => setStatus(event.target.value as 'pago' | 'pendente' | 'atrasado')} className={selectClass}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                </select>
                <SelectChevron />
              </div>
            </label>
            <label>
              <span className={labelClass}>Categoria</span>
              <div className="relative">
                <select value={categoryId} onChange={event => setCategoryId(event.target.value)} className={selectClass}>
                  <option value="">Sem categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </label>
          </div>
        </div>

        <ErrorMessage error={error} />

        <div className={modalFooterClass}>
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors min-h-11">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar conta</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function InvestmentModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('renda_fixa');
  const [amountInvested, setAmountInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const invested = parseCurrencyValue(amountInvested);
    const current = parseCurrencyValue(currentValue);
    const monthly = monthlyContribution.trim() ? parseCurrencyValue(monthlyContribution) : 0;
    
    if (!name.trim()) {
      setError('Informe o nome do investimento ou caixinha.');
      return;
    }
    if (!invested || !current) {
      setError('Informe valores maiores que zero.');
      return;
    }

    setIsSaving(true);
    try {
      await createInvestment({ 
        name, 
        ticker, 
        category, 
        amountInvested: invested, 
        currentValue: current,
        monthlyContribution: monthly || 0
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o investimento.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Novo investimento" subtitle="Cadastre investimentos, caixinhas e patrimônio." onClose={onClose}>
      <form onSubmit={handleSubmit} className={modalBodyClass}>
        <div className={modalSectionClass}>
          <h3 className="font-label-md text-[13px] font-semibold text-on-surface uppercase tracking-wider mb-md">Dados principais</h3>
          <div className={modalGridClass}>
            <label>
              <span className={labelClass}>Nome</span>
              <input value={name} onChange={event => setName(event.target.value)} className={inputClass} placeholder="Ex: Caixinha reserva" />
            </label>
            <label>
              <span className={labelClass}>Ticker</span>
              <input value={ticker} onChange={event => setTicker(event.target.value)} className={inputClass} placeholder="Opcional" />
            </label>
          </div>
        </div>

        <div className={modalSectionClass}>
          <label>
            <span className={labelClass}>Categoria</span>
            <div className="relative">
              <select value={category} onChange={event => setCategory(event.target.value as InvestmentCategory)} className={selectClass}>
                <option value="renda_fixa">Renda fixa / Caixinha</option>
                <option value="acoes">Ações</option>
                <option value="fiis">FIIs</option>
                <option value="cripto">Cripto</option>
              </select>
              <SelectChevron />
            </div>
          </label>

          <h3 className="font-label-md text-[13px] font-semibold text-on-surface uppercase tracking-wider">Patrimônio inicial</h3>
          <div className={modalGridClass}>
            <label>
              <span className={labelClass}>Valor aplicado</span>
              <input value={amountInvested} onChange={event => setAmountInvested(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
            </label>
            <label>
              <span className={labelClass}>Valor atual</span>
              <input value={currentValue} onChange={event => setCurrentValue(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
            </label>
          </div>

          <label>
            <span className={labelClass}>Aporte mensal automático (Todo dia 1)</span>
            <input value={monthlyContribution} onChange={event => setMonthlyContribution(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
        </div>

        <ErrorMessage error={error} />

        <div className={modalFooterClass}>
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors min-h-11">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar investimento</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function InvestmentDepositModal({ investment, onClose }: { investment: Investment; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const value = parseCurrencyValue(amount);
    if (!value) {
      setError('Informe um valor maior que zero.');
      return;
    }

    setIsSaving(true);
    try {
      await createInvestmentDeposit({
        investment,
        investmentId: investment.id,
        amount: value,
        date,
        notes,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o aporte.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title={`Adicionar valor`} subtitle={`Aporte em ${investment.name}. Esse valor será debitado do saldo livre.`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-lg space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label>
            <span className={labelClass}>Valor</span>
            <input value={amount} onChange={event => setAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
          <label>
            <span className={labelClass}>Data</span>
            <input value={date} onChange={event => setDate(event.target.value)} className={inputClass} type="date" />
          </label>
        </div>
        <label>
          <span className={labelClass}>Observação</span>
          <textarea value={notes} onChange={event => setNotes(event.target.value)} className={`${inputClass} min-h-20 resize-y`} placeholder="Opcional" />
        </label>

        <div className="rounded-lg border border-primary/30 bg-primary/10 px-md py-sm text-[14px] text-on-surface">
          Ao salvar, o saldo guardado de {investment.name} aumenta e o mesmo valor entra como gasto para abater do salário/saldo disponível.
        </div>

        <ErrorMessage error={error} />

        <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar aporte</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

export function FinancialGoalModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const target = parseCurrencyValue(targetAmount);
    const current = currentAmount.trim() ? parseCurrencyValue(currentAmount) : 0;
    if (!title.trim()) {
      setError('Informe o nome da meta.');
      return;
    }
    if (!target) {
      setError('Informe o valor alvo da meta.');
      return;
    }
    if (current === null) {
      setError('O valor acumulado precisa ser maior que zero ou ficar vazio.');
      return;
    }

    setIsSaving(true);
    try {
      await createFinancialGoal({ title, targetAmount: target, currentAmount: current, deadline });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar a meta.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Nova meta" subtitle="Cadastre metas, objetivos e caixinhas de reserva." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-lg space-y-md">
        <label>
          <span className={labelClass}>Nome</span>
          <input value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Ex: Viagem" />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label>
            <span className={labelClass}>Valor alvo</span>
            <input value={targetAmount} onChange={event => setTargetAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
          <label>
            <span className={labelClass}>Valor acumulado</span>
            <input value={currentAmount} onChange={event => setCurrentAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
        </div>
        <label>
          <span className={labelClass}>Prazo</span>
          <input value={deadline} onChange={event => setDeadline(event.target.value)} className={inputClass} type="date" />
        </label>

        <ErrorMessage error={error} />

        <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar meta</SubmitButton>
        </div>
      </form>
    </ModalShell>
  );
}

import type { MonthProjection } from '../../hooks/useProjections';

export function ProjectionDetailsModal({ projection, onClose }: { projection: MonthProjection; onClose: () => void }) {
  return (
    <ModalShell title={`Detalhes: ${projection.label}`} subtitle="Previsão de gastos e aportes para este mês." onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto p-lg space-y-lg">
        <div className="grid grid-cols-3 gap-md">
          <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
            <span className={labelClass}>Faturas</span>
            <p className="font-numeral-lg text-[18px] text-primary">R$ {fmt(projection.breakdown.creditCards)}</p>
          </div>
          <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
            <span className={labelClass}>Fixos</span>
            <p className="font-numeral-lg text-[18px] text-secondary">R$ {fmt(projection.breakdown.fixedBills)}</p>
          </div>
          <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
            <span className={labelClass}>Aportes</span>
            <p className="font-numeral-lg text-[18px] text-tertiary">R$ {fmt(projection.breakdown.investments)}</p>
          </div>
        </div>

        <div className="space-y-sm">
          <h4 className={labelClass}>Detalhamento</h4>
          <div className="space-y-xs">
            {projection.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between p-sm bg-surface rounded-lg border border-outline-variant/30">
                <div className="flex flex-col">
                  <span className="font-body-md text-on-surface">{detail.description}</span>
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant opacity-70">
                    {detail.type === 'card' ? 'Cartão' : detail.type === 'fixed' ? 'Conta Fixa' : 'Investimento'}
                  </span>
                </div>
                <span className="font-numeral-md text-on-surface">R$ {fmt(detail.amount)}</span>
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
        <button type="button" onClick={onClose} className="px-lg py-sm bg-surface-variant text-on-surface-variant rounded-lg hover:bg-outline-variant/20 transition-all font-semibold">Fechar</button>
      </div>
    </ModalShell>
  );
}
