import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CircleEllipsis, X } from 'lucide-react';
import { navItems } from './navigationItems';
import { cn } from '../../lib/utils';

const primaryHrefs = new Set(['/', '/entradas', '/gastos', '/cartoes']);

export function MobileFloatingNav() {
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const location = useLocation();
  const isMoreOpen = openPathname === location.pathname;

  const primaryItems = useMemo(
    () => navItems.filter(item => primaryHrefs.has(item.href)),
    [],
  );
  const overflowItems = useMemo(
    () => navItems.filter(item => !primaryHrefs.has(item.href)),
    [],
  );
  const isOverflowActive = overflowItems.some(item => item.href === location.pathname);

  return (
    <div className="lg:hidden">
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-32 bg-gradient-to-t from-background via-background/85 to-transparent" />
      <div className="pointer-events-none fixed left-8 right-8 bottom-2 z-40 h-20 rounded-full bg-primary/15 blur-2xl" />

      {isMoreOpen && (
        <button
          aria-label="Fechar menu de navegação"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
          onClick={() => setOpenPathname(null)}
          type="button"
        />
      )}

      <div className={cn(
        "fixed left-4 right-4 bottom-24 z-50 rounded-[28px] border border-primary/20 bg-surface/95 p-sm shadow-[0_24px_70px_rgba(0,0,0,0.46)] backdrop-blur-xl transition-all duration-200",
        isMoreOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}>
        <div className="grid grid-cols-2 gap-xs">
          {overflowItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex min-h-12 items-center gap-sm rounded-2xl border px-sm text-[13px] font-semibold transition-all active:scale-95",
                  isActive
                    ? "border-primary/40 bg-primary-container/20 text-primary"
                    : "border-outline-variant/60 bg-surface-container-low/70 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <nav
        aria-label="Navegação principal mobile"
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto grid max-w-[460px] grid-cols-5 gap-1 rounded-full border border-primary/25 bg-surface/92 p-1.5 shadow-[0_0_28px_rgba(0,230,118,0.22),0_18px_46px_rgba(0,0,0,0.42)] backdrop-blur-xl"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              aria-label={item.label}
              className={({ isActive }) => cn(
                "flex min-h-12 min-w-0 flex-col items-center justify-center rounded-full text-[10px] font-semibold leading-none transition-all active:scale-95",
                isActive
                  ? "bg-primary text-on-primary shadow-[0_0_18px_rgba(0,230,118,0.34)]"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
              )}
            >
              <Icon size={19} />
              <span className="mt-1 max-w-full truncate px-1">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          aria-expanded={isMoreOpen}
          aria-label={isMoreOpen ? "Fechar mais abas" : "Abrir mais abas"}
          className={cn(
            "flex min-h-12 min-w-0 flex-col items-center justify-center rounded-full text-[10px] font-semibold leading-none transition-all active:scale-95",
            isMoreOpen || isOverflowActive
              ? "bg-primary text-on-primary shadow-[0_0_18px_rgba(0,230,118,0.34)]"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
          )}
          onClick={() => setOpenPathname(prev => prev === location.pathname ? null : location.pathname)}
          type="button"
        >
          {isMoreOpen ? <X size={19} /> : <CircleEllipsis size={19} />}
          <span className="mt-1">Mais</span>
        </button>
      </nav>
    </div>
  );
}
