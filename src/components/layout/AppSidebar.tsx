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
            <img
              alt="Raniel Avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJuef7tu_ZVLwLcPOLjuyly6RLanLz-tmki58uZT54M3pCCLA0eGTMDioNjGR6pQ-YNd-94F8k_aeuuhokqzhgFX1YFMfRwrrJ3bKFWAEbiL-ZBXUE9rXX5UcbiKySuFDUMyaWlezRq9HGU_-6e8AmWR71jc3PryyezABCoj62jqlT3f7OZf8PzdO5xUzbl4vyvq8lqq0eMEI9xATCmmd-MNdZMzK16ItJipoym2nGdrXFPt5a1Vn3PkFuxkPYqqecQWVmTuEVC7c"
            />
          </div>
          <div>
            <p className="font-label-md text-[14px] font-semibold text-on-background">Raniel</p>
            <p className="text-[12px] text-on-surface-variant">raniel@saldoreal.com</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
