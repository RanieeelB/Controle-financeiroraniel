import { Wallet, TrendingUp, CircleDollarSign, Landmark, LineChart, Building2, Bitcoin, Plus } from 'lucide-react';
import { useState } from 'react';
import { InvestmentModal } from '../components/finance/FinanceModals';
import { useInvestments } from '../hooks/useInvestments';

export function Investments() {
  const { investments, isLoading, totalCurrentValue, totalReturn, categoryTotals } = useInvestments();
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const catIcons: Record<string, React.ElementType> = { renda_fixa: Landmark, acoes: TrendingUp, fiis: Building2, cripto: Bitcoin };
  const catColors: Record<string, string> = { renda_fixa: '#75ff9e', acoes: '#00a6e0', fiis: '#ffba79', cripto: '#859585' };

  if (investments.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant gap-md">
          <div className="bg-surface-variant p-lg rounded-full"><Wallet size={48} className="text-primary" /></div>
          <h2 className="font-h1 text-[32px] font-semibold text-on-surface">Nenhum investimento cadastrado</h2>
          <p className="font-body-md text-[16px] max-w-md text-center">Adicione investimentos e caixinhas para acompanhar seu patrimônio.</p>
          <button
            onClick={() => setIsInvestmentModalOpen(true)}
            className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center gap-sm"
          >
            <Plus size={18} />Novo investimento
          </button>
        </div>
        {isInvestmentModalOpen && <InvestmentModal onClose={() => setIsInvestmentModalOpen(false)} />}
      </>
    );
  }

  // Build conic gradient from category percentages
  const conicParts: string[] = [];
  let acc = 0;
  categoryTotals.forEach(ct => {
    const start = acc;
    acc += ct.percentage;
    conicParts.push(`${catColors[ct.category] || '#555'} ${start}% ${acc}%`);
  });
  const conicGradient = conicParts.length > 0 ? `conic-gradient(from 0deg, ${conicParts.join(', ')})` : '#19221a';

  return (
    <div className="space-y-xl">
      <div className="flex justify-end">
        <button
          onClick={() => setIsInvestmentModalOpen(true)}
          className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center gap-sm"
        >
          <Plus size={18} />Novo investimento
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg border-t-2 border-t-primary shadow-[0_0_30px_rgba(117,255,158,0.03)] relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Patrimônio Total</span><Wallet className="text-primary" size={24} /></div>
          <div className="font-numeral-lg text-[48px] font-bold text-on-surface mb-xs">R$ {fmt(totalCurrentValue)}</div>
          <div className="flex items-center gap-xs text-primary font-label-md text-[14px] font-semibold"><TrendingUp size={16} /><span>{totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}% retorno</span></div>
        </div>
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg"><div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Rentabilidade</span><LineChart className="text-secondary" size={24} /></div><div className="font-numeral-lg text-[48px] font-bold text-primary mb-xs">{totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%</div></div>
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg"><div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Categorias</span><CircleDollarSign className="text-tertiary-container" size={24} /></div><div className="font-numeral-lg text-[48px] font-bold text-on-surface mb-xs">{categoryTotals.length}</div></div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 bg-surface-container rounded-xl border border-outline-variant p-lg">
          <h3 className="font-h2 text-[24px] font-semibold text-on-surface mb-lg">Distribuição</h3>
          <div className="flex flex-col gap-md">
            {categoryTotals.map(ct => (
              <div key={ct.category} className="flex justify-between items-center py-sm">
                <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColors[ct.category] }}></div><span className="text-on-surface">{ct.label}</span></div>
                <div className="flex items-center gap-lg"><span className="text-on-surface-variant">R$ {fmt(ct.total)}</span><span className="font-label-md text-[14px] font-semibold" style={{ color: catColors[ct.category] }}>{ct.percentage}%</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface-container rounded-xl border border-outline-variant p-lg flex flex-col items-center justify-center">
          <div className="w-48 h-48 rounded-full relative flex items-center justify-center" style={{ background: conicGradient }}>
            <div className="w-36 h-36 bg-surface-container rounded-full absolute z-10 flex flex-col items-center justify-center border border-outline-variant"><span className="text-on-surface-variant text-sm">Total</span><span className="font-numeral-lg text-[24px] font-semibold text-on-surface mt-xs">100%</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-lg"><h3 className="font-h1 text-[32px] font-semibold text-on-surface">Carteira Detalhada</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {categoryTotals.map(ct => {
            const Icon = catIcons[ct.category] || Landmark;
            return (
              <div key={ct.category} className="bg-surface-container/50 backdrop-blur-sm rounded-xl border border-outline-variant p-md">
                <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant/50">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${catColors[ct.category]}20` }}><Icon size={18} style={{ color: catColors[ct.category] }} /></div>
                  <h4 className="font-h2 text-[24px] font-semibold text-on-surface">{ct.label}</h4>
                  <span className="ml-auto font-numeral-lg text-[18px] text-on-surface">R$ {fmt(ct.total)}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  {ct.items.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center py-sm hover:bg-surface-variant/50 px-sm rounded transition-colors">
                      <div className="flex items-center gap-md">
                        {inv.ticker && <span className="font-label-md text-[14px] font-semibold text-on-surface bg-surface-dim px-xs py-1 rounded border border-outline-variant">{inv.ticker}</span>}
                        <span className="text-on-surface-variant">{inv.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-numeral-lg text-[16px] text-on-surface">R$ {fmt(inv.current_value)}</div>
                        <div className={`font-numeral-lg text-[14px] font-semibold ${inv.return_percentage >= 0 ? 'text-primary' : 'text-error'}`}>{inv.return_percentage >= 0 ? '+' : ''}{inv.return_percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isInvestmentModalOpen && <InvestmentModal onClose={() => setIsInvestmentModalOpen(false)} />}
    </div>
  );
}
