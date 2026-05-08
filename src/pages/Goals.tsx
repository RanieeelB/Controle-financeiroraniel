import { Target, Plus } from 'lucide-react';
import { useState } from 'react';
import { FinancialGoalModal } from '../components/finance/FinanceModals';
import { useFinancialGoals } from '../hooks/useFinancialGoals';

export function Goals() {
  const { goals, isLoading, totalTarget, totalSaved, overallProgress } = useFinancialGoals();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  if (goals.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant gap-md">
          <div className="bg-surface-variant p-lg rounded-full"><Target size={48} className="text-primary" /></div>
          <h2 className="font-h1 text-[32px] font-semibold text-on-surface">Nenhuma meta cadastrada</h2>
          <p className="font-body-md text-[16px] max-w-[28rem] text-center">Crie sua primeira meta financeira para começar a acompanhar seus objetivos.</p>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="mt-md font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all shadow-[0_0_15px_rgba(117,255,158,0.2)] flex items-center gap-sm"
          >
            <Plus size={18} />Nova Meta
          </button>
        </div>
        {isGoalModalOpen && <FinancialGoalModal onClose={() => setIsGoalModalOpen(false)} />}
      </>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex justify-end">
        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center gap-sm"
        >
          <Plus size={18} />Nova Meta
        </button>
      </div>

      {/* Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary"></div>
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Total Acumulado</span><Target className="text-primary" size={24} /></div>
          <span className="font-numeral-lg text-[32px] text-on-surface">R$ {fmt(totalSaved)}</span>
          <div className="w-full bg-surface-variant rounded-full h-2 mt-md overflow-hidden"><div className="bg-primary h-full rounded-full" style={{ width: `${overallProgress}%` }}></div></div>
          <div className="flex justify-between mt-xs"><span className="text-[12px] text-on-surface-variant">de R$ {fmt(totalTarget)}</span><span className="text-[12px] text-primary">{overallProgress}%</span></div>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Metas Ativas</span></div>
          <span className="font-numeral-lg text-[48px] font-bold text-on-surface">{goals.length}</span>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
          <div className="flex justify-between items-start mb-md"><span className="text-on-surface-variant">Falta para completar</span></div>
          <span className="font-numeral-lg text-[32px] text-on-surface">R$ {fmt(totalTarget - totalSaved)}</span>
        </div>
      </section>

      {/* Goals Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {goals.map(goal => {
          const progress = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
          return (
            <div key={goal.id} className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 group-hover:bg-primary transition-colors"></div>
              <div className="flex justify-between items-start mb-lg">
                <h3 className="font-h2 text-[20px] font-semibold text-on-surface">{goal.title}</h3>
                <span className="font-label-md text-[14px] font-semibold text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2 mb-md overflow-hidden">
                <div className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(117,255,158,0.3)] transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-on-surface-variant">R$ {fmt(goal.current_amount)}</span>
                <span className="text-[14px] text-on-surface">R$ {fmt(goal.target_amount)}</span>
              </div>
              {goal.deadline && (
                <p className="text-[12px] text-on-surface-variant mt-md">Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          );
        })}

        {/* Add New Goal Card */}
        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="bg-surface-container border border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center gap-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors min-h-[200px]"
        >
          <Plus size={32} />
          <span className="font-label-md text-[14px] font-semibold">Nova Meta</span>
        </button>
      </section>

      {isGoalModalOpen && <FinancialGoalModal onClose={() => setIsGoalModalOpen(false)} />}
    </div>
  );
}
