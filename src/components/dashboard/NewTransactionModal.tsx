import { X, Payments, ShoppingCart, CreditCard, CalendarToday, TrendingUp, CalendarMonth, ExpandMore, Layers, CheckCircle } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-md">
      <div 
        className="w-full max-w-2xl bg-[#111827] border border-[#243041] rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
        style={{ boxShadow: '0 0 40px rgba(117, 255, 158, 0.05)' }}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-[#243041]">
          <div>
            <h2 className="font-h2 text-[24px] font-semibold text-on-surface">Novo Lançamento</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant">Adicione uma nova transação financeira.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body (Form) */}
        <div className="p-lg overflow-y-auto max-h-[70vh]">
          <form className="space-y-lg">
            {/* Type Selector */}
            <div>
              <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Tipo de Lançamento</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-sm">
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="entrada" className="peer sr-only" defaultChecked />
                  <div className="flex flex-col items-center justify-center p-md bg-[#080B12] border border-[#243041] rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 transition-all text-on-surface-variant peer-checked:text-primary">
                    <Payments className="mb-xs" size={24} />
                    <span className="font-label-md text-[12px]">Entrada</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="gasto" className="peer sr-only" />
                  <div className="flex flex-col items-center justify-center p-md bg-[#080B12] border border-[#243041] rounded-lg peer-checked:border-error peer-checked:bg-error/10 transition-all text-on-surface-variant peer-checked:text-error">
                    <ShoppingCart className="mb-xs" size={24} />
                    <span className="font-label-md text-[12px]">Gasto</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="cartao" className="peer sr-only" />
                  <div className="flex flex-col items-center justify-center p-md bg-[#080B12] border border-[#243041] rounded-lg peer-checked:border-secondary peer-checked:bg-secondary/10 transition-all text-on-surface-variant peer-checked:text-secondary">
                    <CreditCard className="mb-xs" size={24} />
                    <span className="font-label-md text-[12px]">Cartão</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="fixa" className="peer sr-only" />
                  <div className="flex flex-col items-center justify-center p-md bg-[#080B12] border border-[#243041] rounded-lg peer-checked:border-tertiary peer-checked:bg-tertiary/10 transition-all text-on-surface-variant peer-checked:text-tertiary">
                    <CalendarToday className="mb-xs" size={24} />
                    <span className="font-label-md text-[12px]">Fixa</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="investimento" className="peer sr-only" />
                  <div className="flex flex-col items-center justify-center p-md bg-[#080B12] border border-[#243041] rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 transition-all text-on-surface-variant peer-checked:text-primary">
                    <TrendingUp className="mb-xs" size={24} />
                    <span className="font-label-md text-[12px]">Investimento</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Description & Value Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Descrição</label>
                <input 
                  type="text" 
                  className="w-full bg-[#080B12] border border-[#243041] rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-[#94A3B8] outline-none" 
                  placeholder="Ex: Conta de Luz" 
                />
              </div>
              <div>
                <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Valor</label>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 font-numeral-lg text-[24px] text-on-surface-variant">R$</span>
                  <input 
                    type="text" 
                    className="w-full bg-[#080B12] border border-[#243041] rounded-lg pl-xl pr-md py-sm text-on-surface font-numeral-lg text-[24px] focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-right placeholder:text-[#94A3B8] outline-none" 
                    placeholder="0,00" 
                  />
                </div>
              </div>
            </div>

            {/* Date & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Data</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-[#080B12] border border-[#243041] rounded-lg pl-xl pr-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors [color-scheme:dark] outline-none" 
                  />
                  <CalendarMonth className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none ml-xs" size={20} />
                </div>
              </div>
              <div>
                <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Categoria</label>
                <div className="relative">
                  <select className="w-full bg-[#080B12] border border-[#243041] rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none">
                    <option value="" disabled selected className="text-[#94A3B8]">Selecione uma categoria</option>
                    <option value="moradia">Moradia</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="transporte">Transporte</option>
                    <option value="saude">Saúde</option>
                  </select>
                  <ExpandMore className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                </div>
              </div>
            </div>

            {/* Payment Method & Card Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md p-md bg-[#080B12] border border-[#243041] rounded-lg">
              <div>
                <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Forma de Pagamento</label>
                <div className="relative">
                  <select className="w-full bg-surface border border-[#243041] rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none">
                    <option value="pix">Pix</option>
                    <option value="credito" selected>Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                  <ExpandMore className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                </div>
              </div>
              <div>
                <label className="block font-label-md text-[14px] text-on-surface-variant mb-sm uppercase">Cartão</label>
                <div className="relative">
                  <select className="w-full bg-surface border border-[#243041] rounded-lg pl-md pr-xl py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none outline-none">
                    <option value="black">Mastercard Black (Final 4321)</option>
                    <option value="platinum">Visa Platinum (Final 9876)</option>
                  </select>
                  <ExpandMore className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={20} />
                </div>
              </div>
            </div>

            {/* Installments Toggle */}
            <div className="flex items-center justify-between p-md border border-[#243041] rounded-lg bg-surface-container/30">
              <div className="flex items-center space-x-sm">
                <Layers className="text-primary" size={24} />
                <div>
                  <h3 className="font-label-md text-[14px] text-on-surface uppercase">Parcelado?</h3>
                  <p className="font-body-md text-[12px] text-on-surface-variant mt-xs">Dividir em múltiplas faturas</p>
                </div>
              </div>
              <div className="flex items-center space-x-md">
                <input 
                  type="number" 
                  min="2" 
                  max="24" 
                  defaultValue="3" 
                  className="w-20 bg-[#080B12] border border-[#243041] rounded-lg px-xs py-sm text-center text-on-surface font-numeral-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none" 
                />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[#243041] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-lg py-md border-t border-[#243041] bg-surface/50 flex justify-end space-x-md">
          <button 
            type="button" 
            onClick={onClose}
            className="px-lg py-sm font-label-md text-[14px] text-on-surface-variant border border-[#243041] rounded-lg hover:bg-[#243041]/50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="px-lg py-sm font-label-md text-[14px] text-background bg-primary rounded-lg hover:bg-primary-fixed hover:shadow-[0_0_15px_rgba(117,255,158,0.4)] transition-all flex items-center space-x-xs"
          >
            <CheckCircle size={18} />
            <span>Salvar lançamento</span>
          </button>
        </div>

      </div>
    </div>
  );
}
