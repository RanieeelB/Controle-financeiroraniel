import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
} from 'lucide-react';

export const navItems = [
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
