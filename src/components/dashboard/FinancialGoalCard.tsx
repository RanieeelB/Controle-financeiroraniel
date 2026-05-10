import type { FinancialGoal } from '../../types/financial';

interface FinancialGoalCardProps {
  data: FinancialGoal[];
}

export function FinancialGoalCard({ data }: FinancialGoalCardProps) {
  if (data.length === 0) {
    return (
      <>
        <h3 className="font-h2 text-[24px] font-semibold text-on-background mt-sm mb-xs">Metas financeiras</h3>
        <div className="glass-card rounded-xl p-md text-on-surface-variant text-center">
          <p>Nenhuma meta cadastrada ainda.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mt-sm mb-xs">Metas financeiras</h3>
      {data.map((goal) => {
        const progress = goal.target_amount > 0
          ? Math.round((goal.current_amount / goal.target_amount) * 100)
          : 0;

        return (
          <div key={goal.id} className="glass-card-premium rounded-xl p-md min-w-0">
            <div className="flex justify-between items-center gap-md mb-sm">
              <span className="text-[14px] font-medium text-on-background truncate min-w-0">{goal.title}</span>
              <span className="text-[12px] text-primary font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1.5 mb-xs">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-[12px] text-on-surface-variant text-right break-words">
              R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        );
      })}
    </>
  );
}
