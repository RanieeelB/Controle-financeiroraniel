import { Nfc, CreditCard as CreditCardIcon, Calendar, ShoppingBag } from 'lucide-react';
import { useCreditCards } from '../hooks/useCreditCards';

export function Cards() {
  const { cards, isLoading, getCardItems, getCardTotal } = useCreditCards();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant gap-md">
        <div className="bg-surface-variant p-lg rounded-full"><CreditCardIcon size={48} className="text-primary" /></div>
        <h2 className="font-h1 text-[32px] font-semibold text-on-surface">Nenhum cartão cadastrado</h2>
        <p className="font-body-md text-[16px] max-w-md text-center">Adicione seu primeiro cartão de crédito para começar a gerenciar suas faturas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-xl w-full">
      {cards.map(card => {
        const cardTotal = getCardTotal(card.id);
        const available = card.credit_limit - cardTotal;
        const recentItems = getCardItems(card.id).slice(0, 3);

        return (
          <section key={card.id} className="flex flex-col gap-lg">
            <h3 className="font-h2 text-[24px] font-semibold text-on-surface flex items-center gap-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }}></span> {card.name}
            </h3>
            
            {/* Credit Card Visual */}
            <div className="relative w-full h-56 rounded-xl p-lg flex flex-col justify-between border overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${card.color}40, ${card.color}90)`,
                borderColor: `${card.color}50`,
                boxShadow: `0 0 30px ${card.color}15`
              }}>
              <div className="relative z-10 flex justify-between items-start">
                <Nfc className="text-white/80" size={32} />
                <span className="font-label-md text-[14px] font-semibold text-white/90 uppercase tracking-widest">{card.brand}</span>
              </div>
              <div className="relative z-10">
                <p className="font-numeral-lg text-[24px] font-medium text-white/90 tracking-[0.2em] mb-xs">•••• •••• •••• {card.last_digits}</p>
                <div className="flex justify-between items-end">
                  <p className="font-label-md text-[14px] font-semibold text-white/70">{card.card_holder}</p>
                  <CreditCardIcon className="text-white/80" size={32} />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-md">
              <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg relative overflow-hidden group" style={{ borderTopColor: card.color }}>
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: card.color }}></div>
                <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs">Fatura Atual</p>
                <p className="font-numeral-lg text-[24px] font-medium text-on-surface">R$ {fmt(cardTotal)}</p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg relative overflow-hidden group hover:border-primary transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs">Limite Disponível</p>
                <p className="font-numeral-lg text-[24px] font-medium text-primary">R$ {fmt(available)}</p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
                <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs flex items-center gap-xs">
                  <Calendar size={16} /> Vencimento
                </p>
                <p className="font-body-md text-[16px] text-on-surface">Dia {card.due_day}</p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
                <p className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-xs flex items-center gap-xs">
                  <ShoppingBag size={16} /> Fechamento
                </p>
                <p className="font-body-md text-[16px] text-[#7bd0ff]">Dia {card.closing_day}</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg mt-sm">
              <h4 className="font-label-md text-[14px] font-semibold text-on-surface-variant mb-md uppercase tracking-wider">Lançamentos Recentes</h4>
              {recentItems.length === 0 ? (
                <p className="text-on-surface-variant text-center py-md">Nenhum lançamento neste cartão.</p>
              ) : (
                <ul className="flex flex-col gap-sm">
                  {recentItems.map(item => (
                    <li key={item.id} className="flex justify-between items-center py-xs border-b border-outline-variant/50 last:border-0">
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="font-body-md text-[16px] text-on-surface">{item.description}</p>
                          <p className="font-label-md text-[14px] font-semibold text-on-surface-variant">
                            {item.category?.name || 'Sem categoria'} • {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            {item.total_installments > 1 && ` • ${item.current_installment}/${item.total_installments}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-numeral-lg text-[16px] font-medium text-on-surface">R$ {fmt(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
