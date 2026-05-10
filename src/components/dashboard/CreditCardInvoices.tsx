import type { CreditCard } from '../../types/financial';

interface CreditCardInvoicesProps {
  data: CreditCard[];
}

export function CreditCardInvoices({ data }: CreditCardInvoicesProps) {
  if (data.length === 0) {
    return (
      <>
        <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-xs">Faturas de cartão</h3>
        <div className="glass-card rounded-xl p-md text-on-surface-variant text-center">
          <p>Nenhum cartão cadastrado ainda.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-xs">Faturas de cartão</h3>
      {data.map((card) => (
        <div key={card.id} className="glass-card rounded-xl p-md flex justify-between items-center gap-md min-w-0">
          <div className="flex items-center gap-sm min-w-0">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-[12px] shrink-0"
              style={{ backgroundColor: card.color }}
            >
              {card.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-on-background truncate">{card.name}</p>
              <p className="text-[12px] text-on-surface-variant">Vence dia {card.due_day}</p>
            </div>
          </div>
          <span className="font-numeral-lg text-[16px] text-on-background shrink-0">
            •••• {card.last_digits}
          </span>
        </div>
      ))}
    </>
  );
}
