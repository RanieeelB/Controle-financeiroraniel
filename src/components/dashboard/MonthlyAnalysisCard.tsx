import type { MonthlyAnalysis } from '../../types/financial';

interface MonthlyAnalysisCardProps {
  data: MonthlyAnalysis;
  committedPercentage: number;
}

export function MonthlyAnalysisCard({ data, committedPercentage }: MonthlyAnalysisCardProps) {
  return (
    <div className="glass-card rounded-xl p-lg border-l-2 border-l-tertiary-container bg-tertiary-container/5 mt-md">
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-xs">Renda comprometida</h3>
      <div className="flex items-center justify-between mb-sm">
        <span className="text-on-surface-variant text-[14px]">{committedPercentage}% do total</span>
      </div>
      <div className="w-full bg-surface-container-high rounded-full h-2 mb-sm">
        <div className="bg-tertiary-container h-2 rounded-full" style={{ width: `${committedPercentage}%` }}></div>
      </div>
      <p className="text-[12px] text-tertiary-container">{data.description}</p>
    </div>
  );
}
