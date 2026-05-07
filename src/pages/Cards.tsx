import { CreditCard } from 'lucide-react';

export function Cards() {
  return (
    <div className="flex flex-col gap-xl">
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant">
        <div className="bg-surface-variant p-lg rounded-full mb-md">
          <CreditCard size={48} className="text-primary" />
        </div>
        <h2 className="font-h1 text-[32px] font-semibold text-on-surface mb-sm">Cartões</h2>
        <p className="font-body-md text-[16px] max-w-md text-center">
          A interface detalhada de Cartões será implementada aqui. Em breve você poderá gerenciar limites e fechamentos.
        </p>
      </section>
    </div>
  );
}
