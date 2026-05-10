import { useState } from 'react';
import { useProjections, type MonthProjection } from '../../hooks/useProjections';
import { ProjectionDetailsModal } from '../finance/FinanceModals';
import { TrendingUp, ArrowUpRight, Calendar } from 'lucide-react';

export function ProjectionsSection() {
  const { projections } = useProjections();
  const [selectedProjection, setSelectedProjection] = useState<MonthProjection | null>(null);

  const fmt = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <section className="space-y-md mt-xl min-w-0">
      <div className="flex items-center gap-sm min-w-0">
        <TrendingUp className="text-primary" size={24} />
        <h3 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-background">Projeções Financeiras</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {projections.map((proj) => (
          <div key={proj.monthKey} className="glass-card rounded-xl p-md sm:p-lg flex flex-col gap-md border border-outline-variant/30 hover:border-primary/30 transition-all group min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-xs text-on-surface-variant">
                <Calendar size={16} />
                <span className="font-label-md uppercase tracking-wider text-[12px]">{proj.label}</span>
              </div>
              <ArrowUpRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
            
            <div>
              <span className="text-on-surface-variant text-[14px]">Gasto estimado</span>
              <p className="font-numeral-lg text-[24px] sm:text-[28px] font-bold text-on-surface break-words">R$ {fmt(proj.total)}</p>
            </div>

            <div className="space-y-xs">
              <div className="flex justify-between gap-md text-[13px] min-w-0">
                <span className="text-on-surface-variant">Cartão:</span>
                <span className="font-medium text-primary text-right">R$ {fmt(proj.breakdown.creditCards)}</span>
              </div>
              <div className="flex justify-between gap-md text-[13px] min-w-0">
                <span className="text-on-surface-variant">Fixos + Aportes:</span>
                <span className="font-medium text-on-surface text-right">R$ {fmt(proj.breakdown.fixedBills + proj.breakdown.investments)}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedProjection(proj)}
              className="mt-sm w-full py-sm bg-surface-container-highest rounded-lg text-on-surface font-semibold hover:bg-primary hover:text-on-primary transition-all text-[14px] min-h-11"
            >
              Ver detalhes
            </button>
          </div>
        ))}
      </div>

      {selectedProjection && (
        <ProjectionDetailsModal 
          projection={selectedProjection} 
          onClose={() => setSelectedProjection(null)} 
        />
      )}
    </section>
  );
}
