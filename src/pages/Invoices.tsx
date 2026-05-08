import { CreditCard, ChevronRight, ChevronLeft, Plus, Smartphone, ShoppingBag, Utensils, Zap, Filter, MoreVertical, Calendar } from 'lucide-react';

export function Invoices() {
  return (
    <div className="space-y-xl">
      {/* Top Controls: Card Selection & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
        <div className="flex gap-md bg-surface-container rounded-lg p-1 border border-outline-variant backdrop-blur-md">
          <button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold bg-[#8A05BE]/20 text-[#8A05BE] border border-[#8A05BE]/30 shadow-sm flex items-center gap-sm">
            <CreditCard size={16} /> Nubank
          </button>
          <button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-[#FF7A00] transition-colors flex items-center gap-sm">
            <CreditCard size={16} /> Banco Inter
          </button>
        </div>

        <button className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all shadow-[0_0_15px_rgba(117,255,158,0.2)] flex items-center gap-sm">
          <Plus size={18} />
          Nova Compra
        </button>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Fatura Atual */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden group hover:border-[#8A05BE]/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[#8A05BE]"></div>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#8A05BE]/5 rounded-full blur-2xl group-hover:bg-[#8A05BE]/10 transition-all"></div>
          
          <div className="flex justify-between items-start mb-md relative z-10">
            <span className="font-body-md text-[16px] text-on-surface-variant">Fatura Atual (Outubro)</span>
            <span className="inline-flex items-center justify-center bg-error-container/20 text-error border border-error/30 font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider">
              Aberta
            </span>
          </div>
          <div className="relative z-10">
            <span className="font-numeral-lg text-[36px] font-bold text-on-surface">R$ 2.450,80</span>
            <div className="flex items-center justify-between mt-md">
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">Vencimento: 10/Nov</span>
              <span className="font-label-md text-[12px] font-semibold text-[#8A05BE] bg-[#8A05BE]/10 px-sm py-xs rounded">Fecha em 5 dias</span>
            </div>
          </div>
        </div>

        {/* Limite Disponível */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 group-hover:bg-primary transition-colors"></div>
          <div className="flex justify-between items-start mb-md">
            <span className="font-body-md text-[16px] text-on-surface-variant">Limite Disponível</span>
            <CreditCard className="text-primary" size={24} />
          </div>
          <div>
            <span className="font-numeral-lg text-[32px] text-on-surface">R$ 6.049,20</span>
            <div className="w-full bg-surface-variant rounded-full h-1.5 mt-md overflow-hidden">
              <div className="bg-[#8A05BE] w-[28%] h-full rounded-full"></div>
            </div>
            <div className="flex justify-between mt-xs">
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">De R$ 8.500,00</span>
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">28% Utilizado</span>
            </div>
          </div>
        </div>

        {/* Faturas Futuras */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden group hover:border-tertiary-container/50 transition-colors">
          <div className="flex justify-between items-start mb-md">
            <span className="font-body-md text-[16px] text-on-surface-variant">Próxima Fatura (Novembro)</span>
            <Calendar className="text-tertiary-container" size={24} />
          </div>
          <div>
            <span className="font-numeral-lg text-[32px] text-on-surface">R$ 1.120,50</span>
            <p className="font-body-md text-[14px] text-on-surface-variant mt-sm">
              Já comprometido em parcelamentos.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area: Timeline and Invoice Details */}
      <section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        {/* Month Selector Carousel */}
        <div className="border-b border-outline-variant bg-surface-container-high/30 p-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-xs min-w-max">
            <button className="p-xs text-on-surface-variant hover:text-on-surface"><ChevronLeft size={20} /></button>
            <button className="px-lg py-sm rounded-lg font-label-md text-[14px] font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors flex flex-col items-center">
              <span>Ago</span>
              <span className="font-numeral-lg text-[12px] opacity-70">R$ 1.890</span>
            </button>
            <button className="px-lg py-sm rounded-lg font-label-md text-[14px] font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors flex flex-col items-center">
              <span>Set</span>
              <span className="font-numeral-lg text-[12px] opacity-70">R$ 2.100</span>
            </button>
            <button className="px-lg py-sm rounded-lg font-label-md text-[14px] font-semibold bg-[#8A05BE]/20 text-[#8A05BE] border border-[#8A05BE]/30 flex flex-col items-center">
              <span>Out (Atual)</span>
              <span className="font-numeral-lg text-[12px]">R$ 2.450</span>
            </button>
            <button className="px-lg py-sm rounded-lg font-label-md text-[14px] font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors flex flex-col items-center">
              <span>Nov</span>
              <span className="font-numeral-lg text-[12px] opacity-70">R$ 1.120</span>
            </button>
            <button className="px-lg py-sm rounded-lg font-label-md text-[14px] font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors flex flex-col items-center">
              <span>Dez</span>
              <span className="font-numeral-lg text-[12px] opacity-70">R$ 450</span>
            </button>
            <button className="p-xs text-on-surface-variant hover:text-on-surface"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="p-lg">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Lançamentos de Outubro</h3>
            <div className="flex gap-sm">
              <button className="p-xs text-on-surface-variant hover:text-on-surface transition-colors">
                <Filter size={20} />
              </button>
              <button className="p-xs text-on-surface-variant hover:text-on-surface transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-md">
            {/* Timeline Group 1 */}
            <div className="relative pl-xl">
              <div className="absolute left-[11px] top-8 bottom-[-16px] w-px bg-outline-variant/50"></div>
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <h4 className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-md uppercase tracking-wider">Hoje, 24 Out</h4>
              
              <div className="bg-surface border border-outline-variant/50 rounded-lg p-md hover:bg-surface-variant/30 transition-colors group cursor-pointer mb-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <Utensils size={18} className="text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="font-body-md text-[16px] font-medium text-on-surface">iFood *Restaurante</p>
                      <p className="font-body-md text-[13px] text-on-surface-variant mt-0.5">Alimentação</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numeral-lg text-[16px] text-on-surface">R$ 84,90</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Group 2 */}
            <div className="relative pl-xl">
              <div className="absolute left-[11px] top-8 bottom-[-16px] w-px bg-outline-variant/50"></div>
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-surface-variant"></div>
              </div>
              <h4 className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-md mt-lg uppercase tracking-wider">Segunda, 21 Out</h4>
              
              <div className="bg-surface border border-outline-variant/50 rounded-lg p-md hover:bg-surface-variant/30 transition-colors group cursor-pointer mb-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <Smartphone size={18} className="text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-sm">
                        <p className="font-body-md text-[16px] font-medium text-on-surface">Apple Store</p>
                        <span className="inline-flex items-center justify-center bg-secondary/10 text-secondary border border-secondary/30 font-label-md text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                          Parcelado
                        </span>
                      </div>
                      <p className="font-body-md text-[13px] text-on-surface-variant mt-0.5">Eletrônicos • Parcela 3/12</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numeral-lg text-[16px] text-on-surface">R$ 450,00</p>
                    <p className="font-numeral-lg text-[12px] text-on-surface-variant mt-0.5">de R$ 5.400</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-outline-variant/50 rounded-lg p-md hover:bg-surface-variant/30 transition-colors group cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <ShoppingBag size={18} className="text-tertiary-container" />
                    </div>
                    <div>
                      <div className="flex items-center gap-sm">
                        <p className="font-body-md text-[16px] font-medium text-on-surface">Amazon Prime</p>
                      </div>
                      <p className="font-body-md text-[13px] text-on-surface-variant mt-0.5">Assinaturas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numeral-lg text-[16px] text-on-surface">R$ 14,90</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Group 3 */}
            <div className="relative pl-xl pb-md">
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-surface-variant"></div>
              </div>
              <h4 className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-md mt-lg uppercase tracking-wider">15 Out</h4>
              
              <div className="bg-surface border border-outline-variant/50 rounded-lg p-md hover:bg-surface-variant/30 transition-colors group cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <Zap size={18} className="text-on-surface-variant" />
                    </div>
                    <div>
                      <div className="flex items-center gap-sm">
                        <p className="font-body-md text-[16px] font-medium text-on-surface">Mercado Livre</p>
                        <span className="inline-flex items-center justify-center bg-secondary/10 text-secondary border border-secondary/30 font-label-md text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                          Parcelado
                        </span>
                      </div>
                      <p className="font-body-md text-[13px] text-on-surface-variant mt-0.5">Casa • Parcela 1/3</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numeral-lg text-[16px] text-on-surface">R$ 120,00</p>
                    <p className="font-numeral-lg text-[12px] text-on-surface-variant mt-0.5">de R$ 360</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
