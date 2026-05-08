import { Info, ArrowUp, ArrowDown, Landmark, Flame } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

export function Reports() {
  const { transactions: allTx, isLoading } = useTransactions();
  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const income = allTx.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
  const expense = allTx.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';

  // Top expense categories
  const catMap = new Map<string, number>();
  allTx.filter(t => t.type === 'gasto').forEach(t => {
    const name = t.category?.name || 'Outros';
    catMap.set(name, (catMap.get(name) || 0) + t.amount);
  });
  const topExpenses = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxExpense = topExpenses.length > 0 ? topExpenses[0][1] : 1;

  if (allTx.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant gap-md">
        <div className="bg-surface-variant p-lg rounded-full"><Flame size={48} className="text-primary" /></div>
        <h2 className="font-h1 text-[32px] font-semibold text-on-surface">Sem dados para relatório</h2>
        <p className="font-body-md text-[16px] max-w-md text-center">Cadastre entradas e gastos para visualizar seus relatórios financeiros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex justify-between items-end">
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant"><button className="px-lg py-sm rounded-md font-label-md text-[14px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-sm">Geral</button></div>
        <div className="flex items-center gap-sm text-on-surface-variant text-[16px]"><Info size={16} /><span>{allTx.length} transações analisadas</span></div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 group-hover:bg-primary transition-colors"></div>
          <div className="flex justify-between items-start mb-md"><p className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Receita Total</p><div className="text-primary bg-primary/10 p-sm rounded-md"><ArrowUp size={20} /></div></div>
          <h3 className="font-numeral-lg text-[24px] font-medium text-on-surface mb-xs">R$ {fmt(income)}</h3>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden group hover:border-tertiary-container/50 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-tertiary-container/30 group-hover:bg-tertiary-container transition-colors"></div>
          <div className="flex justify-between items-start mb-md"><p className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Despesa Total</p><div className="text-tertiary-container bg-tertiary-container/10 p-sm rounded-md"><ArrowDown size={20} /></div></div>
          <h3 className="font-numeral-lg text-[24px] font-medium text-on-surface mb-xs">R$ {fmt(expense)}</h3>
        </div>
        <div className="bg-surface-container border border-primary/30 rounded-xl p-lg relative overflow-hidden shadow-[0_0_30px_rgba(117,255,158,0.05)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(117,255,158,0.8)]"></div>
          <div className="flex justify-between items-start mb-md"><p className="font-label-md text-[14px] font-semibold text-on-surface-variant uppercase">Saldo</p><div className="text-primary bg-primary/10 p-sm rounded-md"><Landmark size={20} /></div></div>
          <h3 className={`font-numeral-lg text-[24px] font-medium mb-xs ${profit >= 0 ? 'text-primary' : 'text-error'}`}>R$ {fmt(profit)}</h3>
          <div className="w-full bg-surface-variant h-1 mt-md rounded-full overflow-hidden"><div className="bg-primary h-full" style={{ width: `${Math.min(Number(margin), 100)}%` }}></div></div>
          <p className="text-[12px] text-on-surface-variant mt-sm text-right">Margem de {margin}%</p>
        </div>
      </div>

      {/* Top Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-lg"><Flame className="text-tertiary-container" size={24} /><h3 className="font-h2 text-[24px] font-semibold text-on-surface">Maiores Gastos</h3></div>
          <div className="space-y-md">
            {topExpenses.map(([name, amount]) => (
              <div key={name} className="group">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-on-surface">{name}</span>
                  <span className="font-numeral-lg text-[16px] text-on-surface">R$ {fmt(amount)}</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden"><div className="bg-tertiary-container h-full" style={{ width: `${(amount / maxExpense) * 100}%` }}></div></div>
              </div>
            ))}
            {topExpenses.length === 0 && <p className="text-on-surface-variant">Sem gastos registrados.</p>}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-xl p-lg overflow-hidden">
          <div className="flex justify-between items-center mb-lg"><h3 className="font-h2 text-[24px] font-semibold text-on-surface">Últimas Transações</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-outline-variant"><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Descrição</th><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold">Tipo</th><th className="py-md px-sm text-[14px] text-on-surface-variant uppercase tracking-wider font-semibold text-right">Valor</th></tr></thead>
              <tbody className="divide-y divide-outline-variant/50">
                {allTx.slice(0, 5).map(t => (
                  <tr key={t.id} className="hover:bg-surface-variant/30 transition-colors">
                    <td className="py-md px-sm text-on-surface">{t.description}</td>
                    <td className="py-md px-sm"><span className={`text-sm ${t.type === 'entrada' ? 'text-primary' : 'text-tertiary-container'}`}>{t.type === 'entrada' ? 'Entrada' : 'Gasto'}</span></td>
                    <td className={`py-md px-sm text-right font-bold ${t.type === 'entrada' ? 'text-primary' : 'text-on-surface'}`}>{t.type === 'entrada' ? '+' : '-'} R$ {fmt(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
