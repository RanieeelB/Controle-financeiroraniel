import { Nfc, CreditCard as CreditCardIcon, Calendar, ShoppingBag, Utensils, Plane, Fuel, MonitorPlay } from 'lucide-react';

export function Cards() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-xl w-full">
      {/* Nubank Card Section */}
      <section className="flex flex-col gap-lg">
        <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-sm">
          <span className="w-3 h-3 rounded-full bg-[#8A05BE]"></span> Nubank Ultravioleta
        </h3>
        
        {/* Credit Card Visual */}
        <div className="relative w-full h-56 rounded-xl bg-gradient-to-br from-[#4A0072] to-[#8A05BE] p-lg flex flex-col justify-between border border-[#8A05BE]/50 shadow-[0_0_30px_rgba(138,5,190,0.15)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex justify-between items-start">
            <Nfc className="text-white/80" size={32} />
            <span className="font-label-md text-[14px] font-semibold text-white/90 uppercase tracking-widest">Mastercard Black</span>
          </div>
          <div className="relative z-10">
            <p className="font-numeral-lg text-[24px] font-medium text-white/90 tracking-[0.2em] mb-xs">•••• •••• •••• 4092</p>
            <div className="flex justify-between items-end">
              <p className="font-label-md text-[14px] font-semibold text-white/70">RANIEL C SILVA</p>
              <CreditCardIcon className="text-white/80" size={32} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg relative overflow-hidden group hover:border-[#8A05BE]/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#8A05BE]"></div>
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs">Fatura Atual</p>
            <p className="font-numeral-lg text-[24px] font-medium text-on-surface">R$ 4.250,00</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg relative overflow-hidden group hover:border-primary transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs">Limite Disponível</p>
            <p className="font-numeral-lg text-[24px] font-medium text-primary">R$ 15.750,00</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs flex items-center gap-xs">
              <Calendar size={16} /> Vencimento
            </p>
            <p className="font-body-md text-[16px] text-on-surface">15 de Novembro</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs flex items-center gap-xs">
              <ShoppingBag size={16} /> Melhor Dia
            </p>
            <p className="font-body-md text-[16px] text-[#7bd0ff]">08 de Novembro</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg mt-sm">
          <h4 className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-md uppercase tracking-wider">Lançamentos Recentes</h4>
          <ul className="flex flex-col gap-sm">
            <li className="flex justify-between items-center py-xs border-b border-outline-variant/50 last:border-0">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                  <Utensils size={18} />
                </div>
                <div>
                  <p className="font-body-md text-[16px] text-on-surface">Madero Steakhouse</p>
                  <p className="font-label-md text-[14px] font-semibold text-on-surface-variant">Alimentação • 22 Out</p>
                </div>
              </div>
              <span className="font-numeral-lg text-[16px] font-medium text-on-surface">R$ 185,90</span>
            </li>
            <li className="flex justify-between items-center py-xs border-b border-outline-variant/50 last:border-0">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                  <Plane size={18} />
                </div>
                <div>
                  <p className="font-body-md text-[16px] text-on-surface">Latam Airlines</p>
                  <p className="font-label-md text-[14px] font-semibold text-on-surface-variant">Viagem • 20 Out • 1/3</p>
                </div>
              </div>
              <span className="font-numeral-lg text-[16px] font-medium text-on-surface">R$ 450,00</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Inter Card Section */}
      <section className="flex flex-col gap-lg">
        <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-sm">
          <span className="w-3 h-3 rounded-full bg-[#FF7A00]"></span> Inter Black
        </h3>
        
        {/* Credit Card Visual */}
        <div className="relative w-full h-56 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-lg flex flex-col justify-between border border-[#FF7A00]/30 shadow-[0_0_30px_rgba(255,122,0,0.05)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10 flex justify-between items-start">
            <Nfc className="text-white/80" size={32} />
            <div className="flex flex-col items-end">
              <span className="font-label-md text-[14px] font-semibold text-[#FF7A00] uppercase tracking-widest mb-1">Inter</span>
              <span className="font-label-md text-[14px] font-semibold text-white/60 uppercase tracking-widest text-xs">Mastercard Black</span>
            </div>
          </div>
          <div className="relative z-10">
            <p className="font-numeral-lg text-[24px] font-medium text-white/90 tracking-[0.2em] mb-xs">•••• •••• •••• 8122</p>
            <div className="flex justify-between items-end">
              <p className="font-label-md text-[14px] font-semibold text-white/70">RANIEL C SILVA</p>
              <CreditCardIcon className="text-white/80" size={32} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg relative overflow-hidden group hover:border-[#FF7A00]/50 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#FF7A00]"></div>
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs">Fatura Atual</p>
            <p className="font-numeral-lg text-[24px] font-medium text-on-surface">R$ 1.840,50</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg relative overflow-hidden group hover:border-primary transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs">Limite Disponível</p>
            <p className="font-numeral-lg text-[24px] font-medium text-primary">R$ 28.159,50</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs flex items-center gap-xs">
              <Calendar size={16} /> Vencimento
            </p>
            <p className="font-body-md text-[16px] text-on-surface">05 de Novembro</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs flex items-center gap-xs">
              <ShoppingBag size={16} /> Melhor Dia
            </p>
            <p className="font-body-md text-[16px] text-[#7bd0ff]">26 de Outubro</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg mt-sm">
          <h4 className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-md uppercase tracking-wider">Lançamentos Recentes</h4>
          <ul className="flex flex-col gap-sm">
            <li className="flex justify-between items-center py-xs border-b border-outline-variant/50 last:border-0">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                  <Fuel size={18} />
                </div>
                <div>
                  <p className="font-body-md text-[16px] text-on-surface">Posto Ipiranga</p>
                  <p className="font-label-md text-[14px] font-semibold text-on-surface-variant">Transporte • 24 Out</p>
                </div>
              </div>
              <span className="font-numeral-lg text-[16px] font-medium text-on-surface">R$ 250,00</span>
            </li>
            <li className="flex justify-between items-center py-xs border-b border-outline-variant/50 last:border-0">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                  <MonitorPlay size={18} />
                </div>
                <div>
                  <p className="font-body-md text-[16px] text-on-surface">Netflix</p>
                  <p className="font-label-md text-[14px] font-semibold text-on-surface-variant">Assinaturas • 21 Out</p>
                </div>
              </div>
              <span className="font-numeral-lg text-[16px] font-medium text-on-surface">R$ 55,90</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
