import { Landmark, CheckCircle2, Clock, Filter, MoreVertical, Home, Zap, Building2, Wifi, GraduationCap, MonitorPlay, Plus, PieChart } from 'lucide-react';

export function FixedBills() {
  return (
    <div className="space-y-xl">
      {/* Summary Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        {/* Total Mensal Card */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          <div className="flex justify-between items-start mb-md relative z-10">
            <span className="font-body-md text-[16px] text-on-surface-variant">Total Mensal</span>
            <Landmark className="text-primary" size={24} />
          </div>
          <div className="relative z-10">
            <span className="font-numeral-lg text-[32px] text-on-surface">R$ 4.250,00</span>
            <div className="flex items-center gap-xs mt-xs text-primary">
              <span className="material-symbols-outlined text-[16px]">trending_down</span>
              <span className="font-label-md text-[12px] font-semibold">-2.5% vs. mês passado</span>
            </div>
          </div>
        </div>

        {/* Contas Pagas Card */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg relative overflow-hidden group hover:border-outline transition-colors">
          <div className="flex justify-between items-start mb-md">
            <span className="font-body-md text-[16px] text-on-surface-variant">Contas Pagas</span>
            <CheckCircle2 className="text-secondary" size={24} />
          </div>
          <div>
            <span className="font-numeral-lg text-[32px] text-on-surface">R$ 1.800,00</span>
            <div className="w-full bg-surface-variant rounded-full h-1.5 mt-md overflow-hidden">
              <div className="bg-secondary w-[42%] h-full rounded-full"></div>
            </div>
            <div className="flex justify-between mt-xs">
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">3 de 8 contas</span>
              <span className="font-label-md text-[12px] font-semibold text-secondary">42%</span>
            </div>
          </div>
        </div>

        {/* Próximos Vencimentos Card */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg relative overflow-hidden group hover:border-error-container transition-colors">
          <div className="flex justify-between items-start mb-md">
            <span className="font-body-md text-[16px] text-on-surface-variant">Próximos Vencimentos (7 dias)</span>
            <Clock className="text-tertiary-container" size={24} />
          </div>
          <div>
            <span className="font-numeral-lg text-[32px] text-on-surface">R$ 950,00</span>
            <div className="flex items-center gap-sm mt-md">
              <div className="w-2 h-2 rounded-full bg-tertiary-container"></div>
              <span className="font-body-md text-[14px] text-on-surface-variant">Condomínio - Amanhã</span>
            </div>
            <div className="flex items-center gap-sm mt-xs">
              <div className="w-2 h-2 rounded-full bg-surface-variant"></div>
              <span className="font-body-md text-[14px] text-on-surface-variant">Internet - em 3 dias</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Detailed Table Area */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden flex flex-col h-full">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-high/50">
              <h3 className="font-h2 text-[18px] font-semibold text-on-surface">Detalhamento</h3>
              <div className="flex gap-sm">
                <button className="p-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <Filter size={20} />
                </button>
                <button className="p-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-on-surface-variant font-label-md text-[14px] font-semibold uppercase tracking-wider">
                    <th className="py-md px-lg">Descrição</th>
                    <th className="py-md px-lg">Categoria</th>
                    <th className="py-md px-lg">Vencimento</th>
                    <th className="py-md px-lg text-right">Valor</th>
                    <th className="py-md px-lg text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-[16px] text-on-surface">
                  <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors">
                    <td className="py-md px-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <Home size={16} className="text-on-surface-variant" />
                      </div>
                      Aluguel
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">Moradia</td>
                    <td className="py-md px-lg">05/Nov</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ 1.500,00</td>
                    <td className="py-md px-lg text-center">
                      <span className="inline-flex items-center justify-center bg-primary-container/20 text-primary border border-primary/30 font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24">
                        Pago
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors">
                    <td className="py-md px-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <Zap size={16} className="text-on-surface-variant" />
                      </div>
                      Energia Elétrica
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">Moradia</td>
                    <td className="py-md px-lg">08/Nov</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ 300,00</td>
                    <td className="py-md px-lg text-center">
                      <span className="inline-flex items-center justify-center bg-primary-container/20 text-primary border border-primary/30 font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24">
                        Pago
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors bg-surface-container-high/20">
                    <td className="py-md px-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <Building2 size={16} className="text-tertiary-container" />
                      </div>
                      Condomínio
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">Moradia</td>
                    <td className="py-md px-lg text-tertiary-container">12/Nov</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ 800,00</td>
                    <td className="py-md px-lg text-center">
                      <span className="inline-flex items-center justify-center bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30 font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24">
                        Pendente
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors">
                    <td className="py-md px-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <Wifi size={16} className="text-on-surface-variant" />
                      </div>
                      Internet Fibra
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">Assinaturas</td>
                    <td className="py-md px-lg">15/Nov</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ 150,00</td>
                    <td className="py-md px-lg text-center">
                      <span className="inline-flex items-center justify-center bg-surface-variant text-on-surface border border-outline-variant font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24">
                        A Vencer
                      </span>
                    </td>
                  </tr>

                  <tr className="border-b border-outline-variant/50 hover:bg-surface-variant/30 transition-colors bg-error-container/5">
                    <td className="py-md px-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center border border-error/30">
                        <GraduationCap size={16} className="text-error" />
                      </div>
                      Mensalidade Pós
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">Educação</td>
                    <td className="py-md px-lg text-error font-medium">01/Nov</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ 950,00</td>
                    <td className="py-md px-lg text-center">
                      <span className="inline-flex items-center justify-center bg-error-container text-on-error-container border border-error/50 font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24">
                        Atrasado
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-variant/30 transition-colors">
                    <td className="py-md px-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <MonitorPlay size={16} className="text-on-surface-variant" />
                      </div>
                      Streaming Pack
                    </td>
                    <td className="py-md px-lg text-on-surface-variant">Assinaturas</td>
                    <td className="py-md px-lg">20/Nov</td>
                    <td className="py-md px-lg font-numeral-lg text-[16px] text-right">R$ 120,00</td>
                    <td className="py-md px-lg text-center">
                      <span className="inline-flex items-center justify-center bg-surface-variant text-on-surface border border-outline-variant font-label-md text-[11px] font-semibold px-sm py-[2px] rounded-full uppercase tracking-wider w-24">
                        A Vencer
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Distribution Chart Area */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-lg flex flex-col h-full">
            <div className="flex justify-between items-center mb-xl">
              <h3 className="font-h2 text-[18px] font-semibold text-on-surface">Distribuição</h3>
              <PieChart className="text-on-surface-variant" size={24} />
            </div>
            
            <div className="flex-grow flex flex-col gap-lg justify-center">
              <div>
                <div className="flex justify-between items-end mb-xs">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-sm bg-primary"></div>
                    <span className="font-body-md text-[16px] text-on-surface">Moradia</span>
                  </div>
                  <span className="font-numeral-lg text-[14px] text-on-surface-variant">R$ 2.600 (61%)</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(117,255,158,0.3)]" style={{ width: '61%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-xs">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-sm bg-secondary"></div>
                    <span className="font-body-md text-[16px] text-on-surface">Educação</span>
                  </div>
                  <span className="font-numeral-lg text-[14px] text-on-surface-variant">R$ 950 (22%)</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '22%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-xs">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-sm bg-tertiary-container"></div>
                    <span className="font-body-md text-[16px] text-on-surface">Assinaturas</span>
                  </div>
                  <span className="font-numeral-lg text-[14px] text-on-surface-variant">R$ 270 (6%)</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-container rounded-full" style={{ width: '6%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-xs">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-sm bg-outline"></div>
                    <span className="font-body-md text-[16px] text-on-surface">Outros</span>
                  </div>
                  <span className="font-numeral-lg text-[14px] text-on-surface-variant">R$ 430 (11%)</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-outline rounded-full" style={{ width: '11%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-xl pt-lg border-t border-outline-variant">
              <button className="w-full border border-outline-variant text-on-surface font-label-md text-[14px] font-semibold py-sm rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-sm">
                <Plus size={18} />
                Nova Categoria
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
