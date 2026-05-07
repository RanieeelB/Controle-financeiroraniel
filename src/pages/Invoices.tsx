import { ReceiptText } from 'lucide-react';

export function Invoices() {
  return (
    <div className="flex flex-col gap-xl">
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant">
        <div className="bg-surface-variant p-lg rounded-full mb-md">
          <ReceiptText size={48} className="text-primary" />
        </div>
        <h2 className="font-h1 text-[32px] font-semibold text-on-surface mb-sm">Faturas</h2>
        <p className="font-body-md text-[16px] max-w-md text-center">
          A interface detalhada de Faturas será implementada aqui. Em breve você poderá gerenciar o histórico de faturas.
        </p>
      </section>
    </div>
  );
}
