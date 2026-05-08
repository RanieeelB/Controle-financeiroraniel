import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle, ChevronDown, X } from 'lucide-react';
import {
  createCreditCard,
  createCreditPurchase,
  createFinancialGoal,
  createFixedBill,
  createInvestment,
  updateCreditCard,
} from '../../lib/financialActions';
import { getInstallmentAmount, parseCurrencyValue } from '../../lib/financialPayloads';
import { useCategories } from '../../hooks/useCategories';
import { useCreditCards } from '../../hooks/useCreditCards';
import type { CreditCard, InvestmentCategory } from '../../types/financial';

const inputClass = 'w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-outline';
const selectClass = `${inputClass} appearance-none pr-xl`;
const labelClass = 'block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

interface ModalShellProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

function ModalShell({ title, subtitle, onClose, children }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-md">
      <div className="w-full max-w-xl bg-surface-container-low border border-outline-variant rounded-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <div>
            <h2 className="font-h2 text-[24px] font-semibold text-on-surface">{title}</h2>
            <p className="font-body-md text-[15px] text-on-surface-variant">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Fechar modal"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
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

function SubmitButton({ isSaving, children }: { isSaving: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed"
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
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resolvedCardId = cardId || defaultCardId || cards[0]?.id || '';
  const parsedAmount = useMemo(() => parseCurrencyValue(amount), [amount]);
  const installmentAmount = parsedAmount ? getInstallmentAmount(parsedAmount, totalInstallments) : 0;

  function handleInstallmentsChange(value: number) {
    const normalized = Math.max(1, Math.min(48, value));
    setTotalInstallments(normalized);
    setCurrentInstallment(current => Math.min(current, normalized));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setIsSaving(true);
    try {
      await createCreditPurchase({
        cardId: resolvedCardId,
        categoryId,
        description,
        amount: value,
        date,
        totalInstallments,
        currentInstallment,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar a compra.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Nova compra" subtitle="Registre uma compra feita no cartão." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-lg space-y-md">
        <label>
          <span className={labelClass}>Cartão</span>
          <div className="relative">
            <select value={resolvedCardId} onChange={event => setCardId(event.target.value)} className={selectClass}>
              <option value="">Selecione</option>
              {cards.map(card => (
                <option key={card.id} value={card.id}>{card.name} • {card.brand} final {card.last_digits}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label>
            <span className={labelClass}>Descrição</span>
            <input value={description} onChange={event => setDescription(event.target.value)} className={inputClass} placeholder="Ex: Mercado" />
          </label>
          <label>
            <span className={labelClass}>Valor total</span>
            <input value={amount} onChange={event => setAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md bg-surface border border-outline-variant rounded-lg p-md">
          <div>
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

        <ErrorMessage error={error} />

        <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar compra</SubmitButton>
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

    setIsSaving(true);
    try {
      const payload = { bank, brand, lastDigits };
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
    <ModalShell title={card ? 'Editar cartão' : 'Adicionar cartão'} subtitle="Cadastre bandeira, banco e últimos dígitos." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-lg space-y-md">
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
        <label>
          <span className={labelClass}>Últimos dígitos</span>
          <input value={lastDigits} onChange={event => setLastDigits(event.target.value.replace(/\D/g, '').slice(0, 4))} className={inputClass} inputMode="numeric" maxLength={4} placeholder="1234" />
        </label>

        <ErrorMessage error={error} />

        <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors">Cancelar</button>
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
      <form onSubmit={handleSubmit} className="p-lg space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label>
            <span className={labelClass}>Descrição</span>
            <input value={description} onChange={event => setDescription(event.target.value)} className={inputClass} placeholder="Ex: Parcela do carro" />
          </label>
          <label>
            <span className={labelClass}>Valor mensal</span>
            <input value={amount} onChange={event => setAmount(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <label>
            <span className={labelClass}>Vencimento</span>
            <input type="number" min="1" max="31" value={dueDay} onChange={event => setDueDay(Number(event.target.value))} className={`${inputClass} text-center`} />
          </label>
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

        <ErrorMessage error={error} />

        <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors">Cancelar</button>
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
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const invested = parseCurrencyValue(amountInvested);
    const current = parseCurrencyValue(currentValue);
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
      await createInvestment({ name, ticker, category, amountInvested: invested, currentValue: current });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o investimento.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Novo investimento" subtitle="Cadastre investimentos, caixinhas e patrimônio." onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-lg space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label>
            <span className={labelClass}>Nome</span>
            <input value={name} onChange={event => setName(event.target.value)} className={inputClass} placeholder="Ex: Caixinha reserva" />
          </label>
          <label>
            <span className={labelClass}>Ticker</span>
            <input value={ticker} onChange={event => setTicker(event.target.value)} className={inputClass} placeholder="Opcional" />
          </label>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <label>
            <span className={labelClass}>Valor aplicado</span>
            <input value={amountInvested} onChange={event => setAmountInvested(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
          <label>
            <span className={labelClass}>Valor atual</span>
            <input value={currentValue} onChange={event => setCurrentValue(event.target.value)} className={inputClass} inputMode="decimal" placeholder="0,00" />
          </label>
        </div>

        <ErrorMessage error={error} />

        <div className="flex justify-end gap-md pt-md border-t border-outline-variant">
          <button type="button" onClick={onClose} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors">Cancelar</button>
          <SubmitButton isSaving={isSaving}>Salvar investimento</SubmitButton>
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
