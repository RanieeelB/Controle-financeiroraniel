import { ArrowDownRight, Calendar, Search, MoreVertical } from 'lucide-react';

export function Expenses() {
  return (
    <div className="flex flex-col gap-xl">
      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Total Gasto */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg relative overflow-hidden group shadow-[0_0_15px_rgba(255,180,171,0.05)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-error"></div>
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Total Gasto</h3>
            <div className="text-error bg-error/10 p-sm rounded-lg flex items-center justify-center">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-h2 text-body-md text-on-surface-variant">R$</span>
            <span className="font-display-lg text-[48px] font-bold text-on-surface tracking-tight">12.450,00</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-error font-body-md text-sm">
            <ArrowDownRight size={16} />
            <span>-5.2% em relação a Abril</span>
          </div>
        </div>

        {/* Total Pendente */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg relative group">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Pendente (A Pagar)</h3>
            <div className="text-secondary bg-secondary/10 p-sm rounded-lg flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-h2 text-body-md text-on-surface-variant">R$</span>
            <span className="font-h1 text-[32px] font-semibold text-on-surface tracking-tight">3.120,00</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant font-body-md text-sm">
            <span>5 contas aguardando</span>
          </div>
        </div>

        {/* Maior Gasto */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg relative group">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Maior Despesa</h3>
            <div className="text-tertiary-container bg-tertiary-container/10 p-sm rounded-lg flex items-center justify-center">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-h2 text-[24px] font-semibold text-on-surface">Aluguel</span>
            <span className="font-numeral-lg text-[24px] text-on-surface-variant tracking-tight">R$ 4.500,00</span>
          </div>
          <div className="mt-md flex items-center gap-xs text-on-surface-variant font-body-md text-sm">
            <span>36% do total gasto</span>
          </div>
        </div>
      </section>

      {/* Chart and Filters Area */}
      <section className="flex gap-lg flex-col xl:flex-row h-[400px]">
        {/* Placeholder for Chart */}
        <div className="flex-[2] bg-surface-container-low border border-outline-variant rounded-xl p-lg flex flex-col relative">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Evolução Mensal</h3>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
          <div className="flex-1 w-full flex items-center justify-center text-on-surface-variant">
            {/* Will be replaced by Recharts component */}
            Gráfico de Barras (Recharts)
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl p-lg flex flex-col">
          <h3 className="font-h2 text-[24px] font-semibold text-on-surface mb-lg">Filtros</h3>
          <div className="flex flex-col gap-md flex-1">
            <div>
              <label className="font-label-md text-[14px] text-on-surface-variant mb-sm block uppercase font-semibold">Categoria</label>
              <div className="flex flex-wrap gap-sm">
                <button className="px-md py-xs rounded-full border border-primary bg-primary/10 text-primary font-body-md text-sm transition-colors">Todos</button>
                <button className="px-md py-xs rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-md text-sm transition-colors">Moradia</button>
                <button className="px-md py-xs rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-md text-sm transition-colors">Alimentação</button>
                <button className="px-md py-xs rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-md text-sm transition-colors">Transporte</button>
              </div>
            </div>
            <div className="mt-md">
              <label className="font-label-md text-[14px] text-on-surface-variant mb-sm block uppercase font-semibold">Status</label>
              <div className="flex flex-wrap gap-sm">
                <button className="px-md py-xs rounded-full border border-primary bg-primary/10 text-primary font-body-md text-sm transition-colors">Ambos</button>
                <button className="px-md py-xs rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-md text-sm transition-colors flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Pago
                </button>
                <button className="px-md py-xs rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant hover:text-on-surface font-body-md text-sm transition-colors flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Pendente
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed List */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl flex flex-col overflow-hidden mb-xl">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-highest/30">
          <h3 className="font-h2 text-[24px] font-semibold text-on-surface">Lançamentos Detalhados</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              className="bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm text-on-surface font-body-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-64 placeholder-on-surface-variant/50" 
              placeholder="Buscar gasto..." 
              type="text"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/50">
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Data</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Descrição</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Categoria</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Status</th>
                <th className="py-md px-lg font-label-md text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold text-right">Valor</th>
                <th className="py-md px-lg w-16"></th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              <tr className="border-b border-outline-variant/30 hover:bg-surface-variant/50 transition-colors group">
                <td className="py-md px-lg text-on-surface">10 Mai, 2026</td>
                <td className="py-md px-lg text-on-surface font-medium">Supermercado</td>
                <td className="py-md px-lg">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-surface-bright text-on-surface border border-outline-variant/50">Alimentação</span>
                </td>
                <td className="py-md px-lg">
                  <span className="inline-flex items-center gap-1.5 text-primary text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_15px_rgba(0,230,118,0.5)]"></span>
                    Pago
                  </span>
                </td>
                <td className="py-md px-lg text-right font-numeral-lg text-[24px] font-medium text-on-surface">R$ 850,00</td>
                <td className="py-md px-lg text-right">
                  <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-primary transition-all">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
