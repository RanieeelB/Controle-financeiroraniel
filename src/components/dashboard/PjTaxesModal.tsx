import { Building2, Check, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { createFinancialTransaction } from '../../lib/financialActions';
import { supabase } from '../../lib/supabase';
import type { MonthRange } from '../../lib/monthSelection';

interface PjTaxesModalProps {
  monthRange: MonthRange;
  onClose: () => void;
}

export function PjTaxesModal({ monthRange, onClose }: PjTaxesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [simplesRateStr, setSimplesRateStr] = useState('6.00');
  const [totalIncome, setTotalIncome] = useState(0);
  const { categories } = useCategories('gasto');

  useEffect(() => {
    async function fetchIncome() {
      try {
        const { data } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'entrada')
          .eq('status', 'recebido')
          .gte('date', monthRange.startDate)
          .lt('date', monthRange.endDate);
        
        const sum = data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
        setTotalIncome(sum);
      } catch (e) {
        console.error('Failed to fetch total income', e);
      }
    }
    void fetchIncome();
  }, [monthRange]);
  
  const isMei = totalIncome <= 6750; // Limite MEI
  const estimatedMei = 75.60;
  
  const parsedRate = parseFloat(simplesRateStr.replace(',', '.')) || 0;
  const estimatedSimples = totalIncome * (parsedRate / 100);

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
        categoryId: taxCategory?.id || null,
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao lançar imposto:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-md bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md min-w-[320px] overflow-hidden flex flex-col shadow-2xl transition-all">
        <div className="flex justify-between items-center p-lg border-b border-outline-variant">
          <div className="flex items-center gap-sm">
            <div className="p-sm bg-tertiary-container/20 rounded-lg">
              <Building2 className="text-tertiary-container" size={24} />
            </div>
            <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Gestão de Impostos PJ</h3>
          </div>
          <button onClick={onClose} className="p-sm text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-variant">
            <X size={20} />
          </button>
        </div>

        <div className="p-lg space-y-lg">
          <div className="bg-surface rounded-lg p-md border border-outline-variant/50 text-center">
            <p className="text-on-surface-variant text-[14px]">Faturamento deste mês</p>
            <p className="font-numeral-lg text-[28px] text-primary mt-1">R$ {fmt(totalIncome)}</p>
          </div>

          <div className="space-y-md">
            {/* Simples Nacional */}
            <div className="p-md bg-surface border border-outline-variant rounded-lg">
              <div className="flex justify-between items-center mb-md">
                <div>
                  <p className="font-semibold text-on-surface text-[15px]">Simples Nacional</p>
                  <p className="text-[12px] text-on-surface-variant">Calcular DAS (Anexo III, IV, etc)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-md mb-md">
                <div className="flex-1">
                  <label className="text-[12px] text-on-surface-variant mb-1 block">Alíquota (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={simplesRateStr}
                    onChange={(e) => setSimplesRateStr(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-md py-sm text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[12px] text-on-surface-variant mb-1 block">Valor Estimado</label>
                  <div className="w-full bg-surface-variant border border-outline-variant/30 rounded-lg px-md py-sm text-on-surface font-numeral-lg text-[16px]">
                    R$ {fmt(estimatedSimples)}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleLogTax(estimatedSimples, 'DAS Simples Nacional')}
                disabled={isSubmitting || totalIncome === 0 || estimatedSimples <= 0}
                className="w-full font-label-md text-[14px] font-semibold border border-tertiary-container text-tertiary-container py-sm rounded-lg hover:bg-tertiary-container/10 transition-colors flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {success ? <Check size={18} /> : <Plus size={18} />} {success ? 'Imposto Lançado!' : 'Lançar Pagamento'}
              </button>
            </div>

            {/* MEI */}
            <div className="p-md bg-surface border border-outline-variant rounded-lg">
              <div className="flex justify-between items-start mb-md">
                <div>
                  <p className="font-semibold text-on-surface text-[15px]">MEI (DAS)</p>
                  <p className="text-[12px] text-on-surface-variant">Valor fixo mensal padrão</p>
                </div>
                <div className="text-right">
                  <span className="font-numeral-lg text-[20px] text-on-surface">R$ {fmt(estimatedMei)}</span>
                  <div className="mt-1">
                    {isMei && totalIncome > 0 && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">No Limite</span>}
                    {!isMei && totalIncome > 0 && <span className="text-[10px] text-error bg-error/10 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Acima do Limite</span>}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleLogTax(estimatedMei, 'DAS MEI')}
                disabled={isSubmitting}
                className="w-full font-label-md text-[14px] font-semibold border border-outline-variant text-on-surface-variant py-sm rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-sm disabled:opacity-50"
              >
                {success ? <Check size={18} /> : <Plus size={18} />} {success ? 'Imposto Lançado!' : 'Lançar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
