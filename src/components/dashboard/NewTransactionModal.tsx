import { useMemo, useState, type FormEvent } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle,
  ChevronDown,
  Layers,
  Plus,
  ShoppingCart,
  X,
} from 'lucide-react';
import { createCategory, createFinancialTransaction } from '../../lib/financialActions';
import { getInstallmentAmount, parseCurrencyValue } from '../../lib/financialPayloads';
import { useCategories } from '../../hooks/useCategories';
import { useCreditCards } from '../../hooks/useCreditCards';
import type { Transaction } from '../../types/financial';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransactionType = Transaction['type'];
type CategoryType = 'entrada' | 'gasto' | 'ambos';
type PaymentMethod = 'pix' | 'credito' | 'dinheiro' | 'transferencia';

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const categoryColors = ['#75ff9e', '#7bd0ff', '#ffba79', '#ffb4ab', '#859585'];

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('entrada');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cardId, setCardId] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [notes, setNotes] = useState('');
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('gasto');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0]);
  const [categoryError, setCategoryError] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { categories, refetch: refetchCategories } = useCategories(type);
  const { cards } = useCreditCards();

  const parsedAmount = useMemo(() => parseCurrencyValue(amount), [amount]);
  const isCardPayment = type === 'gasto' && paymentMethod === 'credito';
  const installmentAmount = parsedAmount ? getInstallmentAmount(parsedAmount, totalInstallments) : 0;

  if (!isOpen) return null;

  function resetForm() {
    setType('entrada');
    setDescription('');
    setAmount('');
    setDate(today());
    setCategoryId('');
    setPaymentMethod('pix');
    setCardId('');
    setTotalInstallments(1);
    setCurrentInstallment(1);
    setNotes('');
    setIsCategoryFormOpen(false);
    setNewCategoryName('');
    setNewCategoryType('gasto');
    setNewCategoryColor(categoryColors[0]);
    setCategoryError('');
    setError('');
  }

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategoryId('');
    setPaymentMethod(nextType === 'entrada' ? 'pix' : 'dinheiro');
    setNewCategoryType(nextType);
    setCardId('');
    setTotalInstallments(1);
    setCurrentInstallment(1);
  }

  function handleInstallmentsChange(value: number) {
    const normalized = Math.max(1, Math.min(48, value));
    setTotalInstallments(normalized);
    setCurrentInstallment(current => Math.min(current, normalized));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const value = parseCurrencyValue(amount);
    if (!description.trim()) {
      setError('Informe uma descrição para o lançamento.');
      return;
    }
    if (!value) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (isCardPayment && !cardId) {
      setError('Selecione o cartão usado nesse lançamento.');
      return;
    }

    setIsSaving(true);
    try {
      await createFinancialTransaction({
        type,
        description,
        amount: value,
        date,
        paymentMethod,
        categoryId,
        notes,
        cardId,
        totalInstallments,
        currentInstallment,
      });
      resetForm();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o lançamento.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateCategory() {
    setCategoryError('');

    if (!newCategoryName.trim()) {
      setCategoryError('Informe o nome da categoria.');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const category = await createCategory({
        name: newCategoryName,
        type: newCategoryType,
        color: newCategoryColor,
      });
      await refetchCategories();
      if (category.type === type || category.type === 'ambos') {
        setCategoryId(category.id);
      }
      setNewCategoryName('');
      setNewCategoryType(type);
      setNewCategoryColor(categoryColors[0]);
      setIsCategoryFormOpen(false);
    } catch (submitError) {
      setCategoryError(submitError instanceof Error ? submitError.message : 'Não foi possível criar a categoria.');
    } finally {
      setIsCreatingCategory(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-md overflow-y-auto">
      <div
        className="w-full max-w-[42rem] max-h-[90dvh] bg-surface-container-low border border-outline-variant rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
        style={{ boxShadow: '0 0 40px rgba(117, 255, 158, 0.05)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />

        <div className="flex items-start justify-between gap-md px-md sm:px-lg py-md border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h2 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">Novo lançamento</h2>
            <p className="font-body-md text-[14px] sm:text-[16px] text-on-surface-variant">
              Registre uma entrada, gasto no Pix, dinheiro ou compra no cartão.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-md sm:p-lg overflow-y-auto space-y-lg">
            <div>
              <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                Tipo de lançamento
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  type="button"
                  onClick={() => handleTypeChange('entrada')}
                  className={`flex flex-col items-center justify-center p-md border rounded-lg transition-all ${
                    type === 'entrada'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Banknote className="mb-xs" size={24} />
                  <span className="font-label-md text-[12px]">Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('gasto')}
                  className={`flex flex-col items-center justify-center p-md border rounded-lg transition-all ${
                    type === 'gasto'
                      ? 'border-error bg-error/10 text-error'
                      : 'border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <ShoppingCart className="mb-xs" size={24} />
                  <span className="font-label-md text-[12px]">Gasto</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <label>
                <span className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                  Descrição
                </span>
                <input
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  type="text"
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline outline-none"
                  placeholder={type === 'entrada' ? 'Ex: Salário' : 'Ex: Mercado'}
                />
              </label>
              <label>
                <span className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                  {isCardPayment ? 'Valor total da compra' : 'Valor'}
                </span>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 font-numeral-lg text-[20px] text-on-surface-variant">
                    R$
                  </span>
                  <input
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-xl pr-md py-sm text-on-surface font-numeral-lg text-[24px] focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right placeholder:text-outline outline-none"
                    placeholder="0,00"
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <label>
                <span className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Data</span>
                <div className="relative">
                  <input
                    value={date}
                    onChange={event => setDate(event.target.value)}
                    type="date"
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-xl pr-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors [color-scheme:dark] outline-none"
                  />
                  <Calendar className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none ml-xs" size={20} />
                </div>
              </label>
              <div>
                <span className="flex items-center justify-between font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                  <span>Categoria</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategoryType(type);
                      setIsCategoryFormOpen(current => !current);
                    }}
                    className="inline-flex items-center gap-xs text-[12px] normal-case text-primary hover:text-primary-fixed transition-colors"
                  >
                    <Plus size={14} />
                    Nova categoria
                  </button>
                </span>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={event => setCategoryId(event.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                </div>
              </div>
            </div>

            {isCategoryFormOpen && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_10rem_auto] gap-md p-md bg-surface border border-outline-variant rounded-lg">
                <label>
                  <span className="block font-label-md text-[12px] text-on-surface-variant mb-xs uppercase">
                    Nova categoria
                  </span>
                  <input
                    value={newCategoryName}
                    onChange={event => setNewCategoryName(event.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline outline-none"
                    placeholder="Ex: Academia"
                  />
                </label>
                <label>
                  <span className="block font-label-md text-[12px] text-on-surface-variant mb-xs uppercase">
                    Tipo
                  </span>
                  <div className="relative">
                    <select
                      value={newCategoryType}
                      onChange={event => setNewCategoryType(event.target.value as CategoryType)}
                      className="w-full bg-background border border-outline-variant rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none"
                    >
                      <option value="entrada">Entrada</option>
                      <option value="gasto">Gasto</option>
                      <option value="ambos">Ambos</option>
                    </select>
                    <ChevronDown className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                  </div>
                </label>
                <div className="flex items-end gap-sm">
                  <div className="flex gap-xs pb-xs">
                    {categoryColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-7 h-7 rounded-full border transition-transform ${newCategoryColor === color ? 'border-on-surface scale-110' : 'border-outline-variant'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Cor ${color}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory}
                    className="mb-0 px-md py-sm rounded-lg bg-primary text-on-primary font-label-md text-[13px] font-semibold hover:bg-primary-fixed disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreatingCategory ? 'Criando...' : 'Criar'}
                  </button>
                </div>
                {categoryError && (
                  <div className="md:col-span-3 rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[13px]">
                    {categoryError}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md p-md bg-surface border border-outline-variant rounded-lg">
              <label>
                <span className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                  Forma de pagamento
                </span>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={event => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="w-full bg-background border border-outline-variant rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none"
                  >
                    <option value="pix">Pix</option>
                    {type === 'gasto' && <option value="credito">Cartão</option>}
                    <option value="dinheiro">Dinheiro</option>
                    {type === 'entrada' && <option value="transferencia">Transferência</option>}
                  </select>
                  <ChevronDown className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                </div>
              </label>

              {isCardPayment ? (
                <label>
                  <span className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                    Cartão
                  </span>
                  <div className="relative">
                    <select
                      value={cardId}
                      onChange={event => setCardId(event.target.value)}
                      className="w-full bg-background border border-outline-variant rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none"
                    >
                      <option value="">Selecione</option>
                      {cards.map(card => (
                        <option key={card.id} value={card.id}>
                          {card.name} • {card.brand} final {card.last_digits}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                  </div>
                </label>
              ) : (
                <div className="flex items-end">
                  <p className="text-[14px] text-on-surface-variant">
                    {type === 'entrada'
                      ? 'Entradas são registradas como recebidas.'
                      : 'Gastos fora do cartão entram como pagos.'}
                  </p>
                </div>
              )}
            </div>

            {isCardPayment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md p-md border border-outline-variant rounded-lg bg-surface-container/30">
                <div className="md:col-span-1 flex items-center gap-sm">
                  <Layers className="text-primary" size={24} />
                  <div>
                    <h3 className="font-label-md text-[14px] text-on-surface uppercase">Parcelamento</h3>
                    <p className="font-body-md text-[12px] text-on-surface-variant mt-xs">
                      Fatura recebe R$ {fmt(installmentAmount)}
                    </p>
                  </div>
                </div>
                <label>
                  <span className="block font-label-md text-[12px] text-on-surface-variant mb-xs uppercase">
                    Parcelas
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={totalInstallments}
                    onChange={event => handleInstallmentsChange(Number(event.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-xs py-sm text-center text-on-surface font-numeral-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                  />
                </label>
                <label>
                  <span className="block font-label-md text-[12px] text-on-surface-variant mb-xs uppercase">
                    Parcela atual
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={totalInstallments}
                    value={currentInstallment}
                    onChange={event => setCurrentInstallment(Math.max(1, Math.min(totalInstallments, Number(event.target.value))))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-xs py-sm text-center text-on-surface font-numeral-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                  />
                </label>
              </div>
            )}

            <label>
              <span className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">
                Observações
              </span>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                className="w-full min-h-20 bg-surface border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline outline-none resize-y"
                placeholder="Opcional"
              />
            </label>

            {error && (
              <div className="rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]">
                {error}
              </div>
            )}
          </div>

          <div className="px-md sm:px-lg py-md border-t border-outline-variant bg-surface/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-md shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-lg py-sm font-label-md text-[14px] text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors min-h-11 w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-lg py-sm font-label-md text-[14px] text-background bg-primary rounded-lg hover:bg-primary-fixed hover:shadow-[0_0_15px_rgba(117,255,158,0.4)] transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
            >
              <CheckCircle size={18} />
              <span>{isSaving ? 'Salvando...' : 'Salvar lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
