import { FinancialGoal } from '../../types/financial';

interface FinancialGoalCardProps {
  data: FinancialGoal[];
}

export function FinancialGoalCard({ data }: FinancialGoalCardProps) {
  return (
    <>
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mt-sm mb-xs">Metas financeiras</h3>
      {data.map((goal) => (
        <div key={goal.id} className="glass-card-premium rounded-xl p-md">
          <div className="flex justify-between items-center mb-sm">
            <span className="text-[14px] font-medium text-on-background">{goal.title}</span>
            <span className="text-[12px] text-primary font-bold">{goal.progressPercentage}%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 mb-xs">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${goal.progressPercentage}%` }}></div>
          </div>
          <p className="text-[12px] text-on-surface-variant text-right">
            R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      ))}
    </>
  );
}
