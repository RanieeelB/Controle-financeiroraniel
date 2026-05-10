import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils'; // I will create a utils file
import { useAuth } from '../../hooks/useAuth';
import { navItems } from './navigationItems';

interface AppSidebarProps {
  onCloseMobile?: () => void;
}

export function AppSidebar({ onCloseMobile }: AppSidebarProps) {
  const { user } = useAuth();
  const email = user?.email ?? 'sem-email@conta.local';
  const displayName = typeof user?.user_metadata?.name === 'string' && user.user_metadata.name.trim()
    ? user.user_metadata.name.trim()
    : email.split('@')[0];
  const avatarUrl = typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <nav className="bg-surface dark:bg-surface font-body-md text-body-md h-[100dvh] lg:h-[100dvh] w-[min(18rem,85vw)] lg:w-64 border-r border-outline-variant dark:border-outline-variant flex flex-col py-lg px-md z-50">
      <div className="mb-xl px-sm">
        <img src="/logo-principal.png" alt="Saldo Real" className="h-12 w-auto object-contain" />
      </div>

      <div className="flex-1 space-y-xs overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink onClick={onCloseMobile}
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
          <div className="min-w-0">
            <p className="font-label-md text-[14px] font-semibold text-on-background truncate">{displayName}</p>
            <p className="text-[12px] text-on-surface-variant truncate">{email}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

