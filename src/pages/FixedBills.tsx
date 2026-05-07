import { CalendarDays } from 'lucide-react';

export function FixedBills() {
  return (
    <div className="flex flex-col gap-xl">
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant">
        <div className="bg-surface-variant p-lg rounded-full mb-md">
          <CalendarDays size={48} className="text-primary" />
        </div>
        <h2 className="font-h1 text-[32px] font-semibold text-on-surface mb-sm">Contas Fixas</h2>
        <p className="font-body-md text-[16px] max-w-md text-center">
          A interface detalhada de Contas Fixas será implementada aqui. Em breve você poderá acompanhar suas assinaturas e gastos recorrentes.
        </p>
      </section>
    </div>
  );
}
