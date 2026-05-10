import {
  ArrowDownToLine,
  Bitcoin,
  Building2,
  CircleDollarSign,
  Landmark,
  LineChart,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState, type ElementType } from 'react';
import { InvestmentDepositModal, InvestmentModal } from '../components/finance/FinanceModals';
import { RecordActionsMenu } from '../components/finance/RecordActionsMenu';
import { useInvestments } from '../hooks/useInvestments';
import { deleteInvestmentDeposit } from '../lib/financialActions';
import type { Investment, InvestmentCategory } from '../types/financial';

const catIcons: Record<InvestmentCategory, ElementType> = {
  renda_fixa: Landmark,
  acoes: TrendingUp,
  fiis: Building2,
  cripto: Bitcoin,
};

const catLabels: Record<InvestmentCategory, string> = {
  renda_fixa: 'Caixinha / Renda fixa',
  acoes: 'Ações',
  fiis: 'FIIs',
  cripto: 'Cripto',
};

const catColors: Record<InvestmentCategory, string> = {
  renda_fixa: '#75ff9e',
  acoes: '#00a6e0',
  fiis: '#ffba79',
  cripto: '#859585',
};

export function Investments() {
  const {
    investments,
    deposits,
    isLoading,
    totalInvested,
    totalCurrentValue,
    totalReturn,
    getInvestmentDeposits,
    getLastDeposit,
    refetch,
  } = useInvestments();
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [depositInvestment, setDepositInvestment] = useState<Investment | null>(null);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  if (investments.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[360px] sm:min-h-[400px] text-on-surface-variant gap-md px-4 text-center">
          <div className="bg-surface-variant p-lg rounded-full"><Wallet size={48} className="text-primary" /></div>
          <h2 className="font-h1 text-[24px] sm:text-[32px] font-semibold text-on-surface">Nenhum investimento cadastrado</h2>
          <p className="font-body-md text-[16px] max-w-[28rem] text-center">Adicione investimentos e caixinhas para acompanhar seu patrimônio.</p>
          <button
            onClick={() => setIsInvestmentModalOpen(true)}
            className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center justify-center gap-sm min-h-11 w-full sm:w-auto"
          >
            <Plus size={18} />Novo investimento
          </button>
        </div>
        {isInvestmentModalOpen && <InvestmentModal onClose={() => setIsInvestmentModalOpen(false)} />}
      </>
    );
  }

  return (
    <div className="space-y-lg lg:space-y-xl min-w-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="min-w-0">
          <h2 className="font-h1 text-[24px] sm:text-[32px] font-semibold text-on-surface">Investimentos e caixinhas</h2>
          <p className="text-on-surface-variant mt-xs">Acompanhe o saldo guardado e registre seus aportes mensais.</p>
        </div>
        <button
          onClick={() => setIsInvestmentModalOpen(true)}
          className="font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center justify-center gap-sm min-h-11 w-full md:w-auto"
        >
          <Plus size={18} />Novo investimento
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-sm sm:gap-lg">
        <SummaryCard title="Saldo guardado" value={`R$ ${fmt(totalCurrentValue)}`} icon={Wallet} tone="primary" />
        <SummaryCard title="Total aportado" value={`R$ ${fmt(totalInvested)}`} icon={ArrowDownToLine} tone="secondary" />
        <SummaryCard title="Retorno" value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`} icon={LineChart} tone={totalReturn >= 0 ? 'primary' : 'error'} />
        <SummaryCard title="Aportes" value={String(deposits.length)} icon={CircleDollarSign} tone="tertiary" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {investments.map(investment => {
          const investmentDeposits = getInvestmentDeposits(investment.id);
          const lastDeposit = getLastDeposit(investment.id);
          const Icon = catIcons[investment.category];
          const color = catColors[investment.category];

          return (
            <article key={investment.id} className="bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg relative overflow-hidden min-w-0">
              <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: color }}></div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-md sm:items-start mb-lg min-w-0">
                <div className="flex items-start gap-md min-w-0">
                  <div className="w-12 h-12 rounded-lg border border-outline-variant flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface truncate">{investment.name}</h3>
                    <p className="text-[14px] text-on-surface-variant">{catLabels[investment.category]}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDepositInvestment(investment)}
                  className="shrink-0 font-label-md text-[13px] font-semibold bg-primary text-on-primary px-md py-sm rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs min-h-11 w-full sm:w-auto"
                >
                  <Plus size={16} />Adicionar valor
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
                <Metric label="Saldo guardado" value={`R$ ${fmt(investment.current_value)}`} />
                <Metric label="Total aportado" value={`R$ ${fmt(investment.amount_invested)}`} />
                <Metric label="Retorno" value={`${investment.return_percentage >= 0 ? '+' : ''}${investment.return_percentage.toFixed(2)}%`} highlight={investment.return_percentage >= 0} />
              </div>

              <div className="bg-background/50 border border-outline-variant rounded-lg p-md">
                <div className="flex flex-col min-[390px]:flex-row min-[390px]:justify-between min-[390px]:items-center gap-xs mb-md">
                  <h4 className="font-label-md text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider">Histórico de aportes</h4>
                  {lastDeposit && (
                    <span className="text-[12px] text-on-surface-variant shrink-0">
                      Último: {new Date(`${lastDeposit.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                {investmentDeposits.length === 0 ? (
                  <p className="text-[14px] text-on-surface-variant py-sm">Nenhum aporte registrado ainda.</p>
                ) : (
                  <ul className="space-y-sm">
                    {investmentDeposits.slice(0, 4).map(deposit => (
                      <li key={deposit.id} className="flex justify-between items-center gap-md border-b border-outline-variant/40 pb-sm last:border-0 last:pb-0 min-w-0">
                        <div className="min-w-0">
                          <p className="text-on-surface">R$ {fmt(deposit.amount)}</p>
                          <p className="text-[12px] text-on-surface-variant">
                            {new Date(`${deposit.date}T00:00:00`).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-sm shrink-0">
                          <span className="text-primary font-label-md text-[13px] font-semibold">Guardado</span>
                          <RecordActionsMenu
                            label={`aporte de ${investment.name}`}
                            deleteLabel="Excluir aporte"
                            onDelete={async () => {
                              await deleteInvestmentDeposit({ deposit, investment });
                              await refetch();
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {isInvestmentModalOpen && <InvestmentModal onClose={() => setIsInvestmentModalOpen(false)} />}
      {depositInvestment && (
        <InvestmentDepositModal
          investment={depositInvestment}
          onClose={() => setDepositInvestment(null)}
        />
      )}
    </div>
  );
}

type SummaryTone = 'primary' | 'secondary' | 'tertiary' | 'error';

function SummaryCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: ElementType; tone: SummaryTone }) {
  const tones: Record<SummaryTone, string> = {
    primary: 'text-primary bg-primary/10 border-primary/30',
    secondary: 'text-secondary bg-secondary/10 border-secondary/30',
    tertiary: 'text-tertiary-container bg-tertiary-container/10 border-tertiary-container/30',
    error: 'text-error bg-error/10 border-error/30',
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl p-md sm:p-lg min-w-0">
      <div className="flex justify-between items-start mb-md">
        <span className="text-on-surface-variant">{title}</span>
        <div className={`p-sm rounded-md border ${tones[tone]}`}><Icon size={20} /></div>
      </div>
      <p className="font-numeral-lg text-[22px] sm:text-[28px] font-semibold text-on-surface break-words">{value}</p>
    </div>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-background/50 border border-outline-variant rounded-lg p-md min-w-0">
      <p className="text-[12px] text-on-surface-variant mb-xs uppercase tracking-wider">{label}</p>
      <p className={`font-numeral-lg text-[16px] sm:text-[18px] font-semibold break-words ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
}
