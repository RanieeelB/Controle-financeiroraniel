import { Building2, Calculator, Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { createFinancialTransaction } from '../../lib/financialActions';

interface PjTaxesCardProps {
  totalIncome: number;
}

export function PjTaxesCard({ totalIncome }: PjTaxesCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { categories } = useCategories('gasto');
  
  // Estimativas simples
  const isMei = totalIncome <= 6750; // Limite mensal base do MEI atual (~81k/ano)
  const simplesRate = 0.06; // Simples Nacional Anexo III (6%)
  const estimatedSimples = totalIncome * simplesRate;
  const estimatedMei = 75.60; // Valor médio MEI

  async function handleLogTax(amount: number, description: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const taxCategory = categories.find(c => c.name === 'Impostos PJ');
      
      await createFinancialTransaction({
        type: 'gasto',
        description,
        amount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'pix',
        status: 'pago',
        categoryId: taxCategory?.id || null, // Se não achar a categoria, fica sem, mas como forçamos no bootstrap deve achar
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao lançar imposto:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-lg flex flex-col h-full">
      <div className="flex items-center gap-sm mb-lg">
        <div className="p-sm bg-tertiary-container/20 rounded-lg">
          <Building2 className="text-tertiary-container" size={24} />
        </div>
        <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Gestão PJ</h3>
      </div>
      
      <p className="text-on-surface-variant text-[14px] mb-md">
        Com base no faturamento de <span className="font-semibold text-on-surface">R$ {fmt(totalIncome)}</span> este mês:
      </p>

      <div className="space-y-md flex-grow">
        {/* Simples Nacional */}
        <div className="p-md bg-surface border border-outline-variant rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <div>
              <p className="font-semibold text-on-surface text-[14px]">Simples Nacional</p>
              <p className="text-[12px] text-on-surface-variant">Anexo III (6% ref. faturamento)</p>
            </div>
            <span className="font-numeral-lg text-[16px] text-on-surface">R$ {fmt(estimatedSimples)}</span>
          </div>
          <button 
            onClick={() => handleLogTax(estimatedSimples, 'DAS Simples Nacional')}
            disabled={isSubmitting || totalIncome === 0}
            className="w-full mt-2 font-label-md text-[12px] font-semibold border border-tertiary-container text-tertiary-container py-xs rounded hover:bg-tertiary-container/10 transition-colors flex items-center justify-center gap-xs disabled:opacity-50"
          >
            {success ? <Check size={14} /> : <Plus size={14} />} {success ? 'Lançado!' : 'Lançar Pagamento'}
          </button>
        </div>

        {/* MEI */}
        <div className="p-md bg-surface border border-outline-variant rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-sm">
            <div>
              <p className="font-semibold text-on-surface text-[14px]">MEI (DAS)</p>
              <p className="text-[12px] text-on-surface-variant">Valor fixo mensal</p>
            </div>
            <span className="font-numeral-lg text-[16px] text-on-surface">R$ {fmt(estimatedMei)}</span>
          </div>
          {isMei && totalIncome > 0 && (
            <div className="mb-2 text-[11px] text-primary bg-primary/10 px-2 py-1 rounded inline-block">Dentro do limite MEI</div>
          )}
          {!isMei && totalIncome > 0 && (
            <div className="mb-2 text-[11px] text-error bg-error/10 px-2 py-1 rounded inline-block">Atenção: Acima do limite mensal MEI</div>
          )}
          <button 
            onClick={() => handleLogTax(estimatedMei, 'DAS MEI')}
            disabled={isSubmitting}
            className="w-full mt-auto font-label-md text-[12px] font-semibold border border-outline-variant text-on-surface-variant py-xs rounded hover:bg-surface-variant transition-colors flex items-center justify-center gap-xs disabled:opacity-50"
          >
            {success ? <Check size={14} /> : <Plus size={14} />} {success ? 'Lançado!' : 'Lançar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
