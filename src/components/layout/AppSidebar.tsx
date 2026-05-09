import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ShoppingCart,
  CreditCard,
  ReceiptText,
  CalendarDays,
  TrendingUp,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils'; // I will create a utils file
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Entradas', icon: ArrowDownToLine, href: '/entradas' },
  { label: 'Gastos', icon: ShoppingCart, href: '/gastos' },
  { label: 'Cartões', icon: CreditCard, href: '/cartoes' },
  { label: 'Faturas', icon: ReceiptText, href: '/faturas' },
  { label: 'Contas Fixas', icon: CalendarDays, href: '/contas-fixas' },
  { label: 'Investimentos', icon: TrendingUp, href: '/investimentos' },
  { label: 'Metas', icon: Target, href: '/metas' },
  { label: 'Relatórios', icon: BarChart3, href: '/relatorios' },
  { label: 'Configurações', icon: Settings, href: '/configuracoes' },
];

export function AppSidebar() {
  const { user } = useAuth();
  const email = user?.email ?? 'sem-email@conta.local';
  const displayName = typeof user?.user_metadata?.name === 'string' && user.user_metadata.name.trim()
    ? user.user_metadata.name.trim()
    : email.split('@')[0];
  const avatarUrl = typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <nav className="bg-surface dark:bg-surface font-body-md text-body-md fixed left-0 top-0 h-screen w-64 border-r border-outline-variant dark:border-outline-variant flex flex-col py-lg px-md z-50">
      <div className="mb-xl px-sm">
        <h1 className="font-display-lg text-h1 font-bold text-primary dark:text-primary leading-none">
          Saldo Real
        </h1>
        <p className="text-on-surface-variant text-sm mt-xs">Wealth Management</p>
      </div>

      <div className="flex-1 space-y-xs overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }: { isActive: boolean }) => cn(
                "flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary dark:text-primary font-bold border-r-2 border-primary bg-primary-container/10" 
                  : "text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-variant dark:hover:bg-surface-variant"
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto pt-lg border-t border-outline-variant">
        <div className="flex items-center gap-sm px-sm">
          <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden border border-outline-variant">
            {avatarUrl ? (
              <img
                alt={`${displayName} Avatar`}
                className="w-full h-full object-cover"
                src={avatarUrl}
              />
            ) : (
              <span className="font-label-md text-[16px] font-semibold text-on-surface">{avatarInitial}</span>
            )}
          </div>
          <div>
            <p className="font-label-md text-[14px] font-semibold text-on-background">{displayName}</p>
            <p className="text-[12px] text-on-surface-variant">{email}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
