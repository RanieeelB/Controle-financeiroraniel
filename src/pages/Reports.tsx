import { Info, ArrowUp, ArrowDown, Landmark, TrendingUp, AlertTriangle, MoreVertical, Flame, Users, Monitor, Megaphone } from 'lucide-react';

export function Reports() {
  return (
    <div className="space-y-xl">
      {/* Controls Row */}
      <div className="flex justify-between items-end mb-xl">
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant backdrop-blur-md">
          <button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors">Ano</button>
          <button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors">Trimestre</button>
          <button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-sm">Mês</button>
        </div>
        <div className="flex items-center gap-sm text-on-surface-variant font-body-md text-[16px]">
          <Info size={16} />
          <span>Período analisado: Outubro 2026</span>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        {/* Entradas */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg backdrop-blur-md relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 group-hover:bg-primary transition-colors"></div>
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Receita Total</p>
            <div className="text-primary bg-primary/10 p-sm rounded-md">
              <ArrowUp size={20} />
            </div>
          </div>
          <h3 className="font-numeral-lg text-[24px] font-medium text-on-surface mb-xs">R$ 145.892,00</h3>
          <p className="font-body-md text-[14px] text-primary flex items-center gap-xs">
            <TrendingUp size={16} />
            +12.5% vs mês anterior
          </p>
        </div>

        {/* Saidas */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg backdrop-blur-md relative overflow-hidden group hover:border-tertiary-container/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-tertiary-container/30 group-hover:bg-tertiary-container transition-colors"></div>
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Despesa Total</p>
            <div className="text-tertiary-container bg-tertiary-container/10 p-sm rounded-md">
              <ArrowDown size={20} />
            </div>
          </div>
          <h3 className="font-numeral-lg text-[24px] font-medium text-on-surface mb-xs">R$ 82.340,50</h3>
          <p className="font-body-md text-[14px] text-tertiary-container flex items-center gap-xs">
            <AlertTriangle size={16} />
            +4.2% vs mês anterior
          </p>
        </div>

        {/* Lucro */}
        <div className="bg-surface-container border border-primary/30 rounded-xl p-lg backdrop-blur-md relative overflow-hidden shadow-[0_0_30px_rgba(117,255,158,0.05)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(117,255,158,0.8)]"></div>
          <div className="flex justify-between items-start mb-md">
            <p className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Lucro Líquido</p>
            <div className="text-primary bg-primary/10 p-sm rounded-md">
              <Landmark size={20} />
            </div>
          </div>
          <h3 className="font-numeral-lg text-[24px] font-medium text-primary mb-xs">R$ 63.551,50</h3>
          <div className="w-full bg-surface-variant h-1 mt-md rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[65%]"></div>
          </div>
          <p className="font-body-md text-[12px] text-on-surface-variant mt-sm text-right">Margem de 43.5%</p>
        </div>
      </div>

      {/* Large Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-xl h-[400px]">
        {/* Comparativo Barras */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Entradas vs Saídas</h3>
            <div className="flex gap-md font-label-md text-[14px] font-semibold text-sm">
              <div className="flex items-center gap-xs"><span className="w-3 h-3 rounded-sm bg-primary"></span> Entradas</div>
              <div className="flex items-center gap-xs"><span className="w-3 h-3 rounded-sm bg-tertiary-container"></span> Saídas</div>
            </div>
          </div>
          {/* CSS Bar Chart Mockup */}
          <div className="flex-1 flex items-end justify-between px-md pb-md relative border-b border-outline-variant/50">
            {/* Y Axis Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-on-surface-variant font-numeral-lg -ml-md pb-md">
              <span>150k</span>
              <span>100k</span>
              <span>50k</span>
              <span>0</span>
            </div>
            {/* Bars */}
            <div className="flex gap-xs items-end h-full w-12 group">
              <div className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm" style={{ height: '85%' }}></div>
              <div className="w-full bg-tertiary-container/80 group-hover:bg-tertiary-container transition-colors rounded-t-sm" style={{ height: '40%' }}></div>
            </div>
            <div className="flex gap-xs items-end h-full w-12 group">
              <div className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm" style={{ height: '65%' }}></div>
              <div className="w-full bg-tertiary-container/80 group-hover:bg-tertiary-container transition-colors rounded-t-sm" style={{ height: '45%' }}></div>
            </div>
            <div className="flex gap-xs items-end h-full w-12 group">
              <div className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm" style={{ height: '90%' }}></div>
              <div className="w-full bg-tertiary-container/80 group-hover:bg-tertiary-container transition-colors rounded-t-sm" style={{ height: '55%' }}></div>
            </div>
            <div className="flex gap-xs items-end h-full w-12 group">
              <div className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm" style={{ height: '75%' }}></div>
              <div className="w-full bg-tertiary-container/80 group-hover:bg-tertiary-container transition-colors rounded-t-sm" style={{ height: '30%' }}></div>
            </div>
            <div className="flex gap-xs items-end h-full w-12 group">
              <div className="w-full bg-primary shadow-[0_0_10px_rgba(117,255,158,0.3)] rounded-t-sm" style={{ height: '95%' }}></div>
              <div className="w-full bg-tertiary-container rounded-t-sm" style={{ height: '60%' }}></div>
            </div>
          </div>
          {/* X Axis Labels */}
          <div className="flex justify-between px-md pt-sm text-xs text-on-surface-variant font-label-md">
            <span>Jun</span>
            <span>Jul</span>
            <span>Ago</span>
            <span>Set</span>
            <span className="text-primary font-bold">Out</span>
          </div>
        </div>

        {/* Fluxo de Caixa Area */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Fluxo de Caixa Mensal</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
          {/* CSS Area Chart Mockup */}
          <div className="flex-1 relative border-b border-l border-outline-variant/50 ml-xl mb-md flex items-end">
            <div className="absolute -left-12 top-0 h-full flex flex-col justify-between text-xs text-on-surface-variant font-numeral-lg pb-md">
              <span>+80k</span>
              <span>+40k</span>
              <span>0</span>
              <span>-20k</span>
            </div>
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#75ff9e" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#75ff9e" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <line stroke="#3b4a3d" strokeDasharray="2" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"></line>
              <line stroke="#3b4a3d" strokeDasharray="2" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50"></line>
              <line stroke="#3b4a3d" strokeDasharray="2" strokeWidth="0.5" x1="0" x2="100" y1="75" y2="75"></line>
              <path d="M0,60 L20,40 L40,45 L60,20 L80,30 L100,10 L100,100 L0,100 Z" fill="url(#areaGradient)"></path>
              <path d="M0,60 L20,40 L40,45 L60,20 L80,30 L100,10" fill="none" stroke="#75ff9e" strokeWidth="2"></path>
              <circle cx="20" cy="40" fill="#0d150e" r="1.5" stroke="#75ff9e" strokeWidth="1"></circle>
              <circle cx="60" cy="20" fill="#0d150e" r="1.5" stroke="#75ff9e" strokeWidth="1"></circle>
              <circle className="shadow-[0_0_10px_#75ff9e]" cx="100" cy="10" fill="#75ff9e" r="2" stroke="#75ff9e" strokeWidth="1"></circle>
            </svg>
          </div>
          <div className="flex justify-between pl-xl pr-sm pt-sm text-xs text-on-surface-variant font-label-md">
            <span>S1</span>
            <span>S2</span>
            <span>S3</span>
            <span>S4</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Offenders & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Maiores Ofensores */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-lg backdrop-blur-md">
          <div className="flex items-center gap-sm mb-lg">
            <Flame className="text-tertiary-container" size={24} />
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Maiores Ofensores</h3>
          </div>
          <div className="space-y-md">
            <div className="group">
              <div className="flex justify-between items-center mb-xs">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded bg-surface border border-outline-variant flex items-center justify-center">
                    <Landmark size={16} className="text-on-surface-variant group-hover:text-tertiary-container transition-colors" />
                  </div>
                  <span className="font-body-md text-[16px] text-on-surface">Impostos</span>
                </div>
                <span className="font-numeral-lg text-[16px] text-on-surface">R$ 24.500</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full w-[45%]"></div>
              </div>
            </div>
            
            <div className="group">
              <div className="flex justify-between items-center mb-xs">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded bg-surface border border-outline-variant flex items-center justify-center">
                    <Users size={16} className="text-on-surface-variant group-hover:text-tertiary-container transition-colors" />
                  </div>
                  <span className="font-body-md text-[16px] text-on-surface">Folha Pag.</span>
                </div>
                <span className="font-numeral-lg text-[16px] text-on-surface">R$ 18.200</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary-container/80 h-full w-[35%]"></div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-xs">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded bg-surface border border-outline-variant flex items-center justify-center">
                    <Monitor size={16} className="text-on-surface-variant group-hover:text-tertiary-container transition-colors" />
                  </div>
                  <span className="font-body-md text-[16px] text-on-surface">Software SaaS</span>
                </div>
                <span className="font-numeral-lg text-[16px] text-on-surface">R$ 9.400</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary-container/60 h-full w-[15%]"></div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-xs">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded bg-surface border border-outline-variant flex items-center justify-center">
                    <Megaphone size={16} className="text-on-surface-variant group-hover:text-tertiary-container transition-colors" />
                  </div>
                  <span className="font-body-md text-[16px] text-on-surface">Marketing</span>
                </div>
                <span className="font-numeral-lg text-[16px] text-on-surface">R$ 5.100</span>
              </div>
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary-container/40 h-full w-[8%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Fechamento */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-lg backdrop-blur-md overflow-hidden">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Fechamento Orçamentário</h3>
            <button className="font-label-md text-[14px] font-semibold text-primary hover:underline">Ver completo</button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-md px-sm font-label-md text-[14px] font-semibold text-on-surface-variant uppercase tracking-wider">Categoria</th>
                  <th className="py-md px-sm font-label-md text-[14px] font-semibold text-on-surface-variant uppercase tracking-wider text-right">Planejado</th>
                  <th className="py-md px-sm font-label-md text-[14px] font-semibold text-on-surface-variant uppercase tracking-wider text-right">Executado</th>
                  <th className="py-md px-sm font-label-md text-[14px] font-semibold text-on-surface-variant uppercase tracking-wider text-right">Variação</th>
                </tr>
              </thead>
              <tbody className="font-numeral-lg text-[16px] divide-y divide-outline-variant/50">
                <tr className="hover:bg-surface-variant/30 transition-colors">
                  <td className="py-md px-sm font-body-md text-[16px] text-on-surface">Vendas Diretas</td>
                  <td className="py-md px-sm text-right text-on-surface-variant">R$ 80.000</td>
                  <td className="py-md px-sm text-right text-on-surface">R$ 95.200</td>
                  <td className="py-md px-sm text-right text-primary font-bold">+19.0%</td>
                </tr>
                <tr className="hover:bg-surface-variant/30 transition-colors">
                  <td className="py-md px-sm font-body-md text-[16px] text-on-surface">Serviços Recorrentes</td>
                  <td className="py-md px-sm text-right text-on-surface-variant">R$ 45.000</td>
                  <td className="py-md px-sm text-right text-on-surface">R$ 50.692</td>
                  <td className="py-md px-sm text-right text-primary font-bold">+12.6%</td>
                </tr>
                <tr className="hover:bg-surface-variant/30 transition-colors bg-error/5">
                  <td className="py-md px-sm font-body-md text-[16px] text-on-surface flex items-center gap-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Infraestrutura
                  </td>
                  <td className="py-md px-sm text-right text-on-surface-variant">R$ 15.000</td>
                  <td className="py-md px-sm text-right text-on-surface">R$ 18.500</td>
                  <td className="py-md px-sm text-right text-error font-bold">-23.3%</td>
                </tr>
                <tr className="hover:bg-surface-variant/30 transition-colors">
                  <td className="py-md px-sm font-body-md text-[16px] text-on-surface">Marketing</td>
                  <td className="py-md px-sm text-right text-on-surface-variant">R$ 6.000</td>
                  <td className="py-md px-sm text-right text-on-surface">R$ 5.100</td>
                  <td className="py-md px-sm text-right text-primary font-bold">+15.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
