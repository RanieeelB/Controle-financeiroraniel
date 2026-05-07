import { Wallet, TrendingUp, CircleDollarSign, ArrowUp, ArrowRight, Landmark, LineChart, Building2, Bitcoin } from 'lucide-react';

export function Investments() {
  return (
    <div className="space-y-xl">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        {/* Patrimônio Total */}
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg border-t-2 border-t-primary shadow-[0_0_30px_rgba(117,255,158,0.03)] relative overflow-hidden group hover:border-primary/50 transition-colors duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <div className="flex justify-between items-start mb-md relative z-10">
            <span className="font-body-md text-[16px] text-on-surface-variant">Patrimônio Total</span>
            <Wallet className="text-primary" size={24} />
          </div>
          <div className="font-numeral-lg text-[48px] font-bold text-on-surface mb-xs relative z-10">R$ 1.245.890,00</div>
          <div className="flex items-center gap-xs text-primary font-label-md text-[14px] font-semibold relative z-10">
            <TrendingUp size={16} />
            <span>+12.4% este ano</span>
          </div>
        </div>

        {/* Rentabilidade Mensal */}
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg relative overflow-hidden group hover:border-outline transition-colors duration-300">
          <div className="flex justify-between items-start mb-md relative z-10">
            <span className="font-body-md text-[16px] text-on-surface-variant">Rentabilidade Mensal</span>
            <LineChart className="text-secondary" size={24} />
          </div>
          <div className="font-numeral-lg text-[48px] font-bold text-primary mb-xs relative z-10">+1,85%</div>
          <div className="flex items-center gap-xs text-on-surface-variant font-label-md text-[14px] font-semibold relative z-10">
            <span>Acima do CDI (1,05%)</span>
          </div>
        </div>

        {/* Proventos Recebidos */}
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg relative overflow-hidden group hover:border-outline transition-colors duration-300">
          <div className="flex justify-between items-start mb-md relative z-10">
            <span className="font-body-md text-[16px] text-on-surface-variant">Proventos Recebidos</span>
            <CircleDollarSign className="text-tertiary-container" size={24} />
          </div>
          <div className="font-numeral-lg text-[48px] font-bold text-on-surface mb-xs relative z-10">R$ 4.320,50</div>
          <div className="flex items-center gap-xs text-primary font-label-md text-[14px] font-semibold relative z-10">
            <ArrowUp size={16} />
            <span>+5% vs mês anterior</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
        {/* Evolução do Patrimônio */}
        <div className="lg:col-span-2 bg-surface-container rounded-xl border border-outline-variant p-lg">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Evolução do Patrimônio</h3>
            <div className="flex gap-sm bg-surface-dim rounded-lg p-xs border border-outline-variant">
              <button className="px-sm py-xs rounded text-on-surface-variant font-label-md text-[14px] font-semibold hover:text-on-surface transition-colors">1M</button>
              <button className="px-sm py-xs rounded text-on-surface-variant font-label-md text-[14px] font-semibold hover:text-on-surface transition-colors">6M</button>
              <button className="px-sm py-xs rounded bg-surface-variant text-on-surface font-label-md text-[14px] font-semibold shadow-sm">1A</button>
              <button className="px-sm py-xs rounded text-on-surface-variant font-label-md text-[14px] font-semibold hover:text-on-surface transition-colors">TUDO</button>
            </div>
          </div>
          <div className="w-full h-64 relative border-b border-l border-outline-variant/30 flex items-end pt-md">
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-primary/10 to-transparent opacity-50"></div>
            <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,80 Q10,70 20,75 T40,60 T60,40 T80,30 T100,10 L100,100 L0,100 Z" fill="url(#chart-gradient)" opacity="0.1"></path>
              <path className="drop-shadow-[0_0_5px_rgba(117,255,158,0.5)]" d="M0,80 Q10,70 20,75 T40,60 T60,40 T80,30 T100,10" fill="none" stroke="#75ff9e" strokeWidth="0.5"></path>
              <defs>
                <linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#75ff9e"></stop>
                  <stop offset="100%" stopColor="transparent"></stop>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute left-[-40px] h-full flex flex-col justify-between py-sm text-on-surface-variant font-label-md text-[10px]">
              <span>1.5M</span>
              <span>1.0M</span>
              <span>500K</span>
              <span>0</span>
            </div>
            <div className="absolute -bottom-6 w-full flex justify-between text-on-surface-variant font-label-md text-[10px] px-sm">
              <span>Jan</span>
              <span>Mar</span>
              <span>Mai</span>
              <span>Jul</span>
              <span>Set</span>
              <span>Nov</span>
            </div>
          </div>
        </div>

        {/* Alocação de Ativos */}
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg flex flex-col">
          <h3 className="font-h2 text-[24px] font-semibold text-on-surface mb-lg">Alocação de Ativos</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-48 h-48 rounded-full relative flex items-center justify-center" style={{ background: 'conic-gradient(from 0deg, #75ff9e 0% 45%, #00a6e0 45% 75%, #ffba79 75% 90%, #859585 90% 100%)', boxShadow: 'inset 0 0 0 1px #243041' }}>
              <div className="w-36 h-36 bg-surface-container rounded-full absolute z-10 flex flex-col items-center justify-center border border-outline-variant shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <span className="font-label-md text-[14px] font-semibold text-on-surface-variant">Total</span>
                <span className="font-numeral-lg text-[24px] font-semibold text-on-surface mt-xs">100%</span>
              </div>
            </div>
          </div>
          <div className="mt-lg flex flex-col gap-sm w-full">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="font-body-md text-[16px] text-on-surface">Renda Fixa</span>
              </div>
              <span className="font-numeral-lg text-[16px] text-on-surface">45%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-[#00a6e0]"></div>
                <span className="font-body-md text-[16px] text-on-surface">Ações</span>
              </div>
              <span className="font-numeral-lg text-[16px] text-on-surface">30%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
                <span className="font-body-md text-[16px] text-on-surface">FIIs</span>
              </div>
              <span className="font-numeral-lg text-[16px] text-on-surface">15%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full bg-outline"></div>
                <span className="font-body-md text-[16px] text-on-surface">Cripto</span>
              </div>
              <span className="font-numeral-lg text-[16px] text-on-surface">10%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Carteira Detalhada */}
      <section>
        <div className="flex justify-between items-end mb-lg">
          <h3 className="font-h1 text-[32px] font-semibold text-on-surface">Carteira Detalhada</h3>
          <button className="text-primary font-label-md text-[14px] font-semibold hover:underline flex items-center gap-xs">
            Ver todos <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Renda Fixa */}
          <div className="bg-surface-container/50 backdrop-blur-sm rounded-xl border border-outline-variant p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/50">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                <Landmark size={18} className="text-primary" />
              </div>
              <h4 className="font-h2 text-[24px] font-semibold text-on-surface">Renda Fixa</h4>
              <span className="ml-auto font-numeral-lg text-[18px] text-on-surface">R$ 560.650,50</span>
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <span className="font-body-md text-[16px] text-on-surface-variant">Tesouro IPCA+ 2035</span>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 240.000,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+8.2%</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <span className="font-body-md text-[16px] text-on-surface-variant">CDB Banco Master 120% CDI</span>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 150.650,50</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+11.4%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-surface-container/50 backdrop-blur-sm rounded-xl border border-outline-variant p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/50">
              <div className="w-8 h-8 rounded bg-[#00a6e0]/20 flex items-center justify-center">
                <TrendingUp size={18} className="text-[#00a6e0]" />
              </div>
              <h4 className="font-h2 text-[24px] font-semibold text-on-surface">Ações</h4>
              <span className="ml-auto font-numeral-lg text-[18px] text-on-surface">R$ 373.767,00</span>
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <div className="flex items-center gap-md">
                  <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">WEGE3</span>
                  <span className="font-body-md text-[16px] text-on-surface-variant hidden sm:inline">WEG S.A.</span>
                </div>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 85.400,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+15.3%</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <div className="flex items-center gap-md">
                  <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">ITUB4</span>
                  <span className="font-body-md text-[16px] text-on-surface-variant hidden sm:inline">Itaú Unibanco</span>
                </div>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 120.000,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-error">-2.1%</div>
                </div>
              </div>
            </div>
          </div>

          {/* FIIs */}
          <div className="bg-surface-container/50 backdrop-blur-sm rounded-xl border border-outline-variant p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/50">
              <div className="w-8 h-8 rounded bg-tertiary-container/20 flex items-center justify-center">
                <Building2 size={18} className="text-tertiary-container" />
              </div>
              <h4 className="font-h2 text-[24px] font-semibold text-on-surface">FIIs</h4>
              <span className="ml-auto font-numeral-lg text-[18px] text-on-surface">R$ 186.883,50</span>
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <div className="flex items-center gap-md">
                  <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">HGLG11</span>
                  <span className="font-body-md text-[16px] text-on-surface-variant hidden sm:inline">CGHG Logística</span>
                </div>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 90.500,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+4.5%</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <div className="flex items-center gap-md">
                  <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">KNRI11</span>
                  <span className="font-body-md text-[16px] text-on-surface-variant hidden sm:inline">Kinea Renda Imob.</span>
                </div>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 50.300,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+1.2%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cripto */}
          <div className="bg-surface-container/50 backdrop-blur-sm rounded-xl border border-outline-variant p-md">
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/50">
              <div className="w-8 h-8 rounded bg-outline/20 flex items-center justify-center">
                <Bitcoin size={18} className="text-outline" />
              </div>
              <h4 className="font-h2 text-[24px] font-semibold text-on-surface">Cripto</h4>
              <span className="ml-auto font-numeral-lg text-[18px] text-on-surface">R$ 124.589,00</span>
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <div className="flex items-center gap-md">
                  <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">BTC</span>
                  <span className="font-body-md text-[16px] text-on-surface-variant hidden sm:inline">Bitcoin</span>
                </div>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 95.000,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+45.8%</div>
                </div>
              </div>
              <div className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                <div className="flex items-center gap-md">
                  <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">ETH</span>
                  <span className="font-body-md text-[16px] text-on-surface-variant hidden sm:inline">Ethereum</span>
                </div>
                <div className="text-right">
                  <div className="font-numeral-lg text-[16px] text-on-surface">R$ 29.589,00</div>
                  <div className="font-numeral-lg text-[14px] font-semibold text-primary">+22.1%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
