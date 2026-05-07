import { CreditCardInvoice } from '../../types/financial';

interface CreditCardInvoicesProps {
  data: CreditCardInvoice[];
}

export function CreditCardInvoices({ data }: CreditCardInvoicesProps) {
  return (
    <>
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-xs">Faturas de cartão</h3>
      {data.map((invoice) => (
        <div key={invoice.id} className="glass-card rounded-xl p-md flex justify-between items-center">
          <div className="flex items-center gap-sm">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-[12px]"
              style={{ backgroundColor: invoice.color }}
            >
              {invoice.initial}
            </div>
            <div>
              <p className="text-[14px] font-medium text-on-background">{invoice.name}</p>
              <p className="text-[12px] text-on-surface-variant">{invoice.dueDate}</p>
            </div>
          </div>
          <span className="font-numeral-lg text-[16px] text-on-background">
            R$ {invoice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </>
  );
}
