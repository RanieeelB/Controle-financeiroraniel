import {
  ArrowDownToLine,
  Bitcoin,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Coins,
  Crown,
  DollarSign,
  Edit3,
  Gift,
  Heart,
  Home,
  Landmark,
  Laptop,
  LineChart,
  Link2,
  type LucideIcon,
  Plane,
  PiggyBank,
  Plus,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  TrendingUp,
  Trash2,
  Wallet,
  Zap,
} from 'lucide-react';
import { useState, useEffect, useCallback, type ElementType } from 'react';
import { useOutletContext } from 'react-router-dom';
import { InvestmentDepositModal, InvestmentEditDepositModal, InvestmentModal } from '../components/finance/FinanceModals';
import { useInvestments } from '../hooks/useInvestments';
import { useFinancialGoals } from '../hooks/useFinancialGoals';
import { deleteInvestmentDeposit, updateInvestment } from '../lib/financialActions';
import { supabase } from '../lib/supabase';
import type { Investment, InvestmentCategory, InvestmentDeposit } from '../types/financial';
import type { LayoutContext } from '../components/layout/Layout';

const INVESTMENT_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'piggy-bank', icon: PiggyBank },
  { name: 'wallet', icon: Wallet },
  { name: 'coins', icon: Coins },
  { name: 'dollar-sign', icon: DollarSign },
  { name: 'landmark', icon: Landmark },
  { name: 'trending-up', icon: TrendingUp },
  { name: 'building', icon: Building2 },
  { name: 'bitcoin', icon: Bitcoin },
  { name: 'home', icon: Home },
  { name: 'heart', icon: Heart },
  { name: 'gift', icon: Gift },
  { name: 'trophy', icon: Trophy },
  { name: 'star', icon: Star },
  { name: 'crown', icon: Crown },
  { name: 'plane', icon: Plane },
  { name: 'laptop', icon: Laptop },
  { name: 'shield', icon: Shield },
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'zap', icon: Zap },
  { name: 'sparkles', icon: Sparkles },
];

function getIconByName(name: string): LucideIcon {
  const found = INVESTMENT_ICONS.find(i => i.name === name);
  return found?.icon ?? PiggyBank;
}

const catLabels: Record<InvestmentCategory, string> = {
  renda_fixa: 'Caixinha / Renda fixa',
  acoes: 'Ações',
  fiis: 'FIIs',
  cripto: 'Cripto',
};

const catColors: Record<InvestmentCategory, { primary: string; glow: string; gradient: string }> = {
  renda_fixa: { primary: '#75ff9e', glow: 'rgba(117, 255, 158, 0.4)', gradient: 'from-[#75ff9e]/20 to-[#00a6e0]/10' },
  acoes: { primary: '#00a6e0', glow: 'rgba(0, 166, 224, 0.4)', gradient: 'from-[#00a6e0]/20 to-[#ffba79]/10' },
  fiis: { primary: '#ffba79', glow: 'rgba(255, 186, 121, 0.4)', gradient: 'from-[#ffba79]/20 to-[#859585]/10' },
  cripto: { primary: '#859585', glow: 'rgba(133, 149, 133, 0.4)', gradient: 'from-[#859585]/20 to-[#75ff9e]/10' },
};

export function Investments() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
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
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<{ deposit: InvestmentDeposit; investment: Investment } | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [investments.length]);

  useEffect(() => {
    async function fetchMonthlyIncome() {
      const startDate = selectedMonthRange.startDate;
      const endDate = selectedMonthRange.endDate;

      console.log('[DEBUG] Fetching monthly income for:', { startDate, endDate, selectedMonthRange });

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'entrada')
        .eq('status', 'recebido')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('[DEBUG] Error fetching monthly income:', error);
        return;
      }

      if (data) {
        console.log('[DEBUG] Monthly income data:', data);
        const total = data.reduce((sum, tx) => sum + Number(tx.amount), 0);
        console.log('[DEBUG] Monthly income total:', total);
        setMonthlyIncome(total);
      }
    }
    void fetchMonthlyIncome();
  }, [selectedMonthRange]);

  const handleDepositAdded = useCallback(() => {
    setAnimationKey(prev => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-on-surface-variant font-body-md">Carregando seus investimentos...</p>
      </div>
    );
  }

  const fmt = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  if (investments.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
            <div className="relative bg-surface-container border border-outline-variant rounded-full p-8 animate-float">
              <Wallet size={64} className="text-primary" />
            </div>
          </div>
          <h2 className="font-h1 text-[28px] sm:text-[36px] font-bold text-on-surface mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Nenhum investimento cadastrado
          </h2>
          <p className="text-on-surface-variant font-body-md text-[16px] max-w-md mb-8">
            Comece a construir seu patrimônio! Adicione caixinhas e investimentos para acompanhar seu crescimento.
          </p>
          <button
            onClick={() => setIsInvestmentModalOpen(true)}
            className="group relative font-label-md text-[14px] font-semibold bg-primary text-on-primary px-8 py-4 rounded-full hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-[0_0_30px_rgba(117,255,158,0.3)] hover:shadow-[0_0_50px_rgba(117,255,158,0.5)]"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo investimento
          </button>
        </div>
        {isInvestmentModalOpen && <InvestmentModal onClose={() => setIsInvestmentModalOpen(false)} />}
      </>
    );
  }

  const isPositiveReturn = totalReturn >= 0;

  return (
    <div className="space-y-lg lg:space-y-xl min-w-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="min-w-0">
          <h2 className="font-h1 text-[24px] sm:text-[32px] font-semibold text-on-surface flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Investimentos e caixinhas
            </span>
          </h2>
          <p className="text-on-surface-variant mt-xs">Acompanhe o saldo guardado e registre seus aportes mensais.</p>
        </div>
        <button
          onClick={() => setIsInvestmentModalOpen(true)}
          className="group relative font-label-md text-[14px] font-semibold bg-primary text-on-primary px-lg py-sm rounded-full hover:bg-primary-container transition-all flex items-center justify-center gap-sm min-h-11 w-full md:w-auto shadow-[0_0_20px_rgba(117,255,158,0.2)] hover:shadow-[0_0_30px_rgba(117,255,158,0.4)]"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Novo investimento
        </button>
      </div>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-sm sm:gap-lg">
        <SummaryCard
          key={`wallet-${animationKey}`}
          title="Saldo guardado"
          value={`R$ ${fmt(totalCurrentValue)}`}
          icon={Wallet}
          tone="primary"
          delay={0}
          glow="rgba(117, 255, 158, 0.3)"
          gradient="from-[#75ff9e]/20 to-transparent"
        />
        <SummaryCard
          key={`invested-${animationKey}`}
          title="Total aportado"
          value={`R$ ${fmt(totalInvested)}`}
          icon={ArrowDownToLine}
          tone="secondary"
          delay={100}
          glow="rgba(0, 166, 224, 0.3)"
          gradient="from-[#00a6e0]/20 to-transparent"
        />
        <SummaryCard
          key={`return-${animationKey}`}
          title="Retorno"
          value={`${isPositiveReturn ? '+' : ''}${totalReturn.toFixed(2)}%`}
          icon={isPositiveReturn ? TrendingUp : LineChart}
          tone={isPositiveReturn ? 'primary' : 'error'}
          delay={200}
          glow={isPositiveReturn ? 'rgba(117, 255, 158, 0.4)' : 'rgba(255, 180, 171, 0.4)'}
          gradient={isPositiveReturn ? 'from-[#75ff9e]/30 to-transparent' : 'from-[#ffb4ab]/20 to-transparent'}
          pulse={isPositiveReturn}
        />
        <SummaryCard
          key={`deposits-${animationKey}`}
          title="Aportes"
          value={String(deposits.length)}
          icon={CircleDollarSign}
          tone="tertiary"
          delay={300}
          glow="rgba(255, 186, 121, 0.3)"
          gradient="from-[#ffba79]/20 to-transparent"
        />
      </section>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-tertiary/5 rounded-3xl blur-3xl" />
        <section className="relative grid grid-cols-1 xl:grid-cols-3 gap-md sm:gap-lg">
          {investments.map((investment, index) => {
            const investmentDeposits = getInvestmentDeposits(investment.id);
            const lastDeposit = getLastDeposit(investment.id);
            const colorScheme = catColors[investment.category];
            const IconComponent = getIconByName(investment.icon);
            const isPositive = investment.return_percentage >= 0;

            return (
              <InvestmentCard
                key={`${investment.id}-${animationKey}`}
                investment={investment}
                IconComponent={IconComponent}
                colorScheme={colorScheme}
                investmentDeposits={investmentDeposits}
                lastDeposit={lastDeposit}
                isPositive={isPositive}
                delay={index * 100}
                monthlyIncome={monthlyIncome}
                onDeposit={() => {
                  setDepositInvestment(investment);
                  handleDepositAdded();
                }}
                onEdit={() => setEditInvestment(investment)}
                onEditDeposit={(deposit) => setEditingDeposit({ deposit, investment })}
                onDeleteDeposit={async (deposit: ReturnType<typeof getInvestmentDeposits>[number]) => {
                  await deleteInvestmentDeposit({ deposit, investment });
                  await refetch();
                }}
                fmt={fmt}
              />
            );
          })}
        </section>
      </div>

      {isInvestmentModalOpen && <InvestmentModal onClose={() => setIsInvestmentModalOpen(false)} />}
      {depositInvestment && (
        <InvestmentDepositModal
          investment={depositInvestment}
          monthlyIncome={monthlyIncome}
          onClose={() => setDepositInvestment(null)}
        />
      )}
      {editInvestment && (
        <InvestmentEditModal
          investment={editInvestment}
          onClose={() => setEditInvestment(null)}
        />
      )}
      {editingDeposit && (
        <InvestmentEditDepositModal
          deposit={editingDeposit.deposit}
          investment={editingDeposit.investment}
          onClose={() => setEditingDeposit(null)}
        />
      )}
    </div>
  );
}

type SummaryTone = 'primary' | 'secondary' | 'tertiary' | 'error';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ElementType;
  tone: SummaryTone;
  delay: number;
  glow: string;
  gradient: string;
  pulse?: boolean;
}

function SummaryCard({ title, value, icon: Icon, tone, delay, glow, gradient, pulse }: SummaryCardProps) {
  const tones: Record<SummaryTone, { border: string; iconBg: string; iconColor: string }> = {
    primary: { border: 'border-primary/30', iconBg: 'bg-primary/20', iconColor: 'text-primary' },
    secondary: { border: 'border-secondary/30', iconBg: 'bg-secondary/20', iconColor: 'text-secondary' },
    tertiary: { border: 'border-[#ffba79]/30', iconBg: 'bg-[#ffba79]/20', iconColor: 'text-[#ffba79]' },
    error: { border: 'border-error/30', iconBg: 'bg-error/20', iconColor: 'text-error' },
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} border ${tones[tone].border} rounded-2xl p-md sm:p-lg min-w-0 overflow-hidden group animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative flex justify-between items-start mb-md">
        <span className="text-on-surface-variant text-[13px] font-medium">{title}</span>
        <div className={`relative p-sm rounded-xl ${tones[tone].iconBg} ${tones[tone].iconColor} ${pulse ? 'animate-pulse-glow' : ''}`}
          style={{ boxShadow: `0 0 20px ${glow}` }}>
          <Icon size={22} />
        </div>
      </div>
      <p className="font-numeral-lg text-[20px] min-[390px]:text-[24px] sm:text-[28px] font-bold text-on-surface break-words">
        {value}
      </p>
    </div>
  );
}

interface InvestmentCardProps {
  investment: Investment;
  IconComponent: LucideIcon;
  colorScheme: { primary: string; glow: string; gradient: string };
  investmentDeposits: ReturnType<ReturnType<typeof useInvestments>['getInvestmentDeposits']>;
  lastDeposit: ReturnType<ReturnType<typeof useInvestments>['getLastDeposit']>;
  isPositive: boolean;
  delay: number;
  monthlyIncome: number;
  onDeposit: () => void;
  onEdit: () => void;
  onEditDeposit: (deposit: ReturnType<ReturnType<typeof useInvestments>['getInvestmentDeposits']>[number]) => void;
  onDeleteDeposit: (deposit: ReturnType<ReturnType<typeof useInvestments>['getInvestmentDeposits']>[number]) => Promise<void>;
  fmt: (value: number) => string;
}

function InvestmentCard({
  investment,
  IconComponent,
  colorScheme,
  investmentDeposits,
  lastDeposit,
  isPositive,
  delay,
  monthlyIncome,
  onDeposit,
  onEdit,
  onEditDeposit,
  onDeleteDeposit,
  fmt,
}: InvestmentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const suggestedPercentage = Number(investment.suggested_investment_percentage) || 0;
  const suggestedValue = suggestedPercentage > 0
    ? (monthlyIncome * suggestedPercentage) / 100
    : 0;

  return (
    <article
      className="relative bg-surface-container border border-outline-variant rounded-3xl overflow-hidden animate-slide-up group"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[currentColor] to-transparent opacity-50"
        style={{ color: colorScheme.primary }} />

      <div className="relative p-md sm:p-lg">
        <div className="flex items-start justify-between gap-md mb-md">
          <div className="flex items-start gap-md">
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${colorScheme.primary}20`,
                color: colorScheme.primary,
                boxShadow: isHovered ? `0 0 30px ${colorScheme.glow}` : `0 0 15px ${colorScheme.glow}50`,
              }}
            >
              <IconComponent size={24} className={isHovered ? 'animate-bounce-subtle' : ''} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface flex items-center justify-center border-2"
                style={{ borderColor: colorScheme.primary }}>
                <Star size={8} fill={colorScheme.primary} color={colorScheme.primary} />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-h2 text-[16px] sm:text-[18px] font-bold text-on-surface truncate">{investment.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <IconComponent size={10} />
                  {catLabels[investment.category]}
                </span>
                {investment.ticker && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {investment.ticker}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 p-2 rounded-xl hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-primary"
            title="Editar investimento"
          >
            <Edit3 size={16} />
          </button>
        </div>

        <div className="bg-background/50 border border-outline-variant/50 rounded-2xl p-md mb-md">
          <div className="flex items-end justify-between gap-md mb-2">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Saldo guardado</p>
              <p className="font-numeral-lg text-[20px] sm:text-[24px] font-bold text-on-surface">
                R$ {fmt(investment.current_value)}
              </p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${isPositive ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
              {isPositive ? <TrendingUp size={12} /> : <LineChart size={12} />}
              {isPositive ? '+' : ''}{investment.return_percentage.toFixed(2)}%
            </div>
          </div>

          {suggestedValue > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 mb-2">
              <Wallet size={12} className="text-primary" />
              <span className="text-[11px] font-medium text-primary">
                Sugerido: R$ {fmt(suggestedValue)} ({investment.suggested_investment_percentage}%)
              </span>
            </div>
          )}

          <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{
                width: `${Math.min(100, Math.max(5, ((investment.current_value - investment.amount_invested) / (investment.amount_invested || 1)) * 100 + 50))}%`,
                background: `linear-gradient(90deg, ${colorScheme.primary}, ${isPositive ? '#00a6e0' : '#ffb4ab'})`,
                boxShadow: `0 0 8px ${colorScheme.glow}`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
            <span>Investido: R$ {fmt(investment.amount_invested)}</span>
            <span>+{fmt(investment.current_value - investment.amount_invested)}</span>
          </div>
        </div>

        <div className="flex gap-sm mb-md">
          <button
            onClick={onDeposit}
            className="flex-1 relative font-label-md text-[12px] font-semibold bg-primary text-on-primary px-md py-sm rounded-xl hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs min-h-10 overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            <Plus size={16} className="group-hover/btn:rotate-90 transition-transform duration-300" />
            <span>Adicionar valor</span>
          </button>
          {investment.monthly_contribution > 0 && (
            <div className="flex items-center gap-1 px-2 py-sm rounded-xl bg-surface-variant/50 border border-outline-variant/30">
              <Zap size={12} className="text-secondary" />
              <span className="text-[11px] font-medium text-on-surface-variant">
                +R$ {fmt(investment.monthly_contribution)}
              </span>
            </div>
          )}
        </div>

        <div className="bg-surface/30 border border-outline-variant/30 rounded-xl p-sm">
          <div className="flex items-center justify-between mb-sm">
            <h4 className="font-label-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              <Coins size={12} />
              Histórico
            </h4>
            {lastDeposit && (
              <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                <Sparkles size={8} />
                {new Date(`${lastDeposit.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
          {investmentDeposits.length === 0 ? (
            <div className="text-center py-2">
              <PiggyBank size={24} className="mx-auto mb-1 text-on-surface-variant/50" />
              <p className="text-[11px] text-on-surface-variant">Nenhum aporte ainda.</p>
            </div>
          ) : (
            <ul className="space-y-xs max-h-28 overflow-y-auto pr-1">
              {investmentDeposits.slice(0, 3).map(deposit => (
                <li key={deposit.id} className="flex justify-between items-center gap-md border-b border-outline-variant/30 pb-xs last:border-0 last:pb-0 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-on-surface text-[12px] font-medium">R$ {fmt(deposit.amount)}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {new Date(`${deposit.date}T00:00:00`).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditDeposit(deposit)}
                      className="p-1 rounded-md hover:bg-surface-variant transition-colors text-on-surface-variant hover:text-primary"
                      title="Editar aporte"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(`Excluir aporte de R$ ${fmt(deposit.amount)}?`);
                        if (confirmed) {
                          await onDeleteDeposit(deposit);
                        }
                      }}
                      className="p-1 rounded-md hover:bg-error/10 transition-colors text-on-surface-variant hover:text-error"
                      title="Excluir aporte"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

interface InvestmentEditModalProps {
  investment: Investment;
  onClose: () => void;
}

function InvestmentEditModal({ investment, onClose }: InvestmentEditModalProps) {
  const [name, setName] = useState(investment.name);
  const [ticker, setTicker] = useState(investment.ticker || '');
  const [icon, setIcon] = useState(investment.icon);
  const [goalId, setGoalId] = useState(investment.goal_id || '');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [suggestedInvestmentPercentage, setSuggestedInvestmentPercentage] = useState(investment.suggested_investment_percentage || 0);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { refetch } = useInvestments();
  const { goals } = useFinancialGoals();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Informe o nome do investimento.');
      return;
    }

    setIsSaving(true);
    try {
      await updateInvestment(investment.id, {
        name,
        ticker: ticker.trim() || null,
        icon,
        goalId: goalId || null,
        suggestedInvestmentPercentage: suggestedInvestmentPercentage,
      });
      await refetch();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar.');
    } finally {
      setIsSaving(false);
    }
  }

  const SelectedIcon = getIconByName(icon);
  const colorScheme = catColors[investment.category];
  const selectedGoal = goals.find(g => g.id === goalId);

  return (
    <div className="fixed inset-0 z-[999] isolate flex items-stretch sm:items-center justify-center bg-background/85 backdrop-blur-md p-0 sm:p-md overflow-hidden">
      <div className="w-full sm:max-w-[28rem] h-[100dvh] sm:h-auto sm:max-h-[85dvh] bg-surface-container-low border border-outline-variant rounded-none sm:rounded-xl shadow-2xl overflow-hidden relative flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${colorScheme.primary}, ${colorScheme.primary}80)` }} />

        <div className="flex items-start justify-between gap-md px-md sm:px-lg py-md border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h2 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">Editar investimento</h2>
            <p className="font-body-md text-[14px] text-on-surface-variant">Altere o nome, ticker, ícone ou meta vinculada.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <Plus size={22} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-md sm:p-lg space-y-md">
          <div className="flex items-center justify-center py-md">
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: `${colorScheme.primary}20`,
                color: colorScheme.primary,
                boxShadow: `0 0 30px ${colorScheme.glow}`,
              }}
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              <SelectedIcon size={36} />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Edit3 size={12} className="text-on-primary" />
              </div>
            </div>
          </div>

          {showIconPicker && (
            <div className="grid grid-cols-5 gap-2 p-md bg-surface rounded-xl border border-outline-variant max-h-48 overflow-y-auto">
              {INVESTMENT_ICONS.map(({ name: iconName, icon: IconComp }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    setIcon(iconName);
                    setShowIconPicker(false);
                  }}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${icon === iconName ? 'bg-primary/30 ring-2 ring-primary' : 'hover:bg-surface-variant'}`}
                >
                  <IconComp size={22} className={icon === iconName ? 'text-primary' : 'text-on-surface-variant'} />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-md">
            <label>
              <span className="block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Nome</span>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className="w-full min-h-12 bg-background border border-outline-variant rounded-xl px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                placeholder="Ex: Reserva de emergência"
              />
            </label>

            <label>
              <span className="block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Ticker (opcional)</span>
              <input
                value={ticker}
                onChange={event => setTicker(event.target.value)}
                className="w-full min-h-12 bg-background border border-outline-variant rounded-xl px-md py-sm text-on-surface font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none uppercase"
                placeholder="Ex: SDIV11"
              />
            </label>

            <label>
              <span className="block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Percentual de investimento (% da renda mensal)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestedInvestmentPercentage}
                onChange={event => setSuggestedInvestmentPercentage(Math.max(0, Math.min(100, Number(event.target.value))))}
                className="w-full min-h-12 bg-background border border-outline-variant rounded-xl px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none text-center"
                placeholder="0"
              />
            </label>

            <label>
              <span className="block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider">Vincular a uma meta</span>
              <div className="relative">
                <select
                  value={goalId}
                  onChange={event => setGoalId(event.target.value)}
                  className="w-full min-h-12 bg-background border border-outline-variant rounded-xl px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none appearance-none pr-xl"
                >
                  <option value="">Nenhuma meta (uso livre)</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} (R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={18} />
              </div>
              {selectedGoal && (
                <div className="mt-sm p-sm rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-sm">
                  <Link2 size={16} className="text-primary" />
                  <span className="text-[13px] text-on-surface">
                    Vinculado à meta: <strong className="text-primary">{selectedGoal.title}</strong>
                  </span>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]">
              {error}
            </div>
          )}

          <div className="sticky bottom-0 -mx-md sm:-mx-lg px-md sm:px-lg py-md bg-surface-container-low/95 backdrop-blur border-t border-outline-variant flex justify-end gap-md pt-md">
            <button
              type="button"
              onClick={onClose}
              className="px-lg py-sm border border-outline-variant rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors min-h-12"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-xl hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs min-h-12 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
