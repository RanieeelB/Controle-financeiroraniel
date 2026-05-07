import { ShieldCheck, PlaneTakeoff, Car, Calculator, RefreshCw, PiggyBank } from 'lucide-react';

export function Goals() {
  return (
    <div className="space-y-xl">
      {/* Progress Cards Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Reserva de Emergência */}
        <div className="bg-surface/80 backdrop-blur-md border border-outline-variant rounded-xl p-lg shadow-[0_0_15px_rgba(117,255,158,0.05)] relative overflow-hidden flex flex-col justify-between h-[280px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
          <div className="flex justify-between items-start mb-md">
            <div>
              <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-2">
                <ShieldCheck className="text-primary" size={24} />
                Reserva de Emergência
              </h3>
              <p className="font-body-md text-[16px] text-on-surface-variant mt-1">Garantia para 6 meses</p>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-[14px] font-semibold">
              85% Concluído
            </div>
          </div>
          <div className="mt-auto space-y-sm">
            <div className="flex justify-between font-numeral-lg text-[24px] font-medium">
              <span className="text-on-surface">R$ 42.500</span>
              <span className="text-on-surface-variant text-[16px]">de R$ 50.000</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="font-body-md text-[14px] text-[#7bd0ff] text-right mt-2">Faltam R$ 7.500</p>
          </div>
        </div>

        {/* Viagem */}
        <div className="bg-surface/80 backdrop-blur-md border border-outline-variant rounded-xl p-lg shadow-[0_0_15px_rgba(0,166,224,0.05)] relative overflow-hidden flex flex-col justify-between h-[280px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00a6e0]"></div>
          <div className="flex justify-between items-start mb-md">
            <div>
              <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-2">
                <PlaneTakeoff className="text-[#00a6e0]" size={24} />
                Eurotrip
              </h3>
              <p className="font-body-md text-[16px] text-on-surface-variant mt-1">Férias 2025</p>
            </div>
            <div className="bg-[#00a6e0]/10 text-[#00a6e0] px-3 py-1 rounded-full font-label-md text-[14px] font-semibold">
              40% Concluído
            </div>
          </div>
          <div className="mt-auto space-y-sm">
            <div className="flex justify-between font-numeral-lg text-[24px] font-medium">
              <span className="text-on-surface">R$ 12.000</span>
              <span className="text-on-surface-variant text-[16px]">de R$ 30.000</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
              <div className="bg-[#00a6e0] h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
            <p className="font-body-md text-[14px] text-[#7bd0ff] text-right mt-2">Faltam R$ 18.000</p>
          </div>
        </div>

        {/* Carro Novo */}
        <div className="bg-surface/80 backdrop-blur-md border border-outline-variant rounded-xl p-lg shadow-[0_0_15px_rgba(255,186,121,0.05)] relative overflow-hidden flex flex-col justify-between h-[280px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-tertiary-container"></div>
          <div className="flex justify-between items-start mb-md">
            <div>
              <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-2">
                <Car className="text-tertiary-container" size={24} />
                Carro Novo
              </h3>
              <p className="font-body-md text-[16px] text-on-surface-variant mt-1">Troca de veículo</p>
            </div>
            <div className="bg-tertiary-container/10 text-tertiary-container px-3 py-1 rounded-full font-label-md text-[14px] font-semibold">
              15% Concluído
            </div>
          </div>
          <div className="mt-auto space-y-sm">
            <div className="flex justify-between font-numeral-lg text-[24px] font-medium">
              <span className="text-on-surface">R$ 18.000</span>
              <span className="text-on-surface-variant text-[16px]">de R$ 120.000</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
              <div className="bg-tertiary-container h-full rounded-full" style={{ width: '15%' }}></div>
            </div>
            <p className="font-body-md text-[14px] text-[#7bd0ff] text-right mt-2">Faltam R$ 102.000</p>
          </div>
        </div>
      </section>

      {/* Simulador Section */}
      <section className="bg-surface/80 backdrop-blur-md border border-outline-variant rounded-xl p-xl shadow-[0_0_15px_rgba(117,255,158,0.05)] relative mt-xl flex flex-col md:flex-row gap-xl items-center">
        <div className="flex-1 space-y-lg w-full">
          <div>
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-2 mb-2">
              <Calculator className="text-primary" size={24} />
              Simulador de Metas
            </h3>
            <p className="font-body-md text-[16px] text-on-surface-variant">Calcule o esforço mensal necessário para atingir seus próximos objetivos financeiros.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="space-y-sm">
              <label className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Valor da Meta (R$)</label>
              <input 
                className="w-full bg-[#080B12] border border-[#243041] rounded-lg px-md py-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-numeral-lg text-lg" 
                type="text" 
                defaultValue="50.000,00"
              />
            </div>
            <div className="space-y-sm">
              <label className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Prazo (Meses)</label>
              <input 
                className="w-full bg-[#080B12] border border-[#243041] rounded-lg px-md py-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-numeral-lg text-lg" 
                type="number" 
                defaultValue="24"
              />
            </div>
            <div className="space-y-sm md:col-span-2">
              <label className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Rendimento Estimado (% a.a.)</label>
              <input 
                className="w-full bg-[#080B12] border border-[#243041] rounded-lg px-md py-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-numeral-lg text-lg" 
                type="number" 
                defaultValue="10.5"
              />
            </div>
          </div>
          <button className="w-full py-md rounded-lg bg-surface-container-high border border-[#243041] text-on-surface hover:border-primary hover:text-primary transition-colors font-label-md text-[14px] font-semibold uppercase tracking-wider flex justify-center items-center gap-2">
            <RefreshCw size={20} />
            Recalcular Projeção
          </button>
        </div>
        
        {/* Simulator Result */}
        <div className="w-full md:w-1/3 bg-[#080B12] rounded-xl border border-[#243041] p-lg flex flex-col items-center justify-center text-center space-y-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <PiggyBank className="text-primary mb-2" size={48} />
          
          <h4 className="font-body-lg text-[18px] text-on-surface-variant">Aporte Mensal Necessário</h4>
          <div className="font-display-lg text-[48px] font-bold text-primary tracking-tighter">
            R$ 1.845<span className="text-h2 text-[24px] font-semibold text-on-surface-variant">,50</span>
          </div>
          <p className="font-body-md text-[16px] text-on-surface-variant text-sm mt-4">
            Investindo em uma taxa de 10.5% a.a., você atingirá R$ 50.000 em exatos 24 meses.
          </p>
          <button className="mt-4 px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-[14px] font-semibold w-full shadow-[0_0_15px_rgba(117,255,158,0.1)]">
            Criar Nova Meta
          </button>
        </div>
      </section>
    </div>
  );
}
