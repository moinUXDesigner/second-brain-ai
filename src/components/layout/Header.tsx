import { useAuthStore } from '@/app/store/authStore';
import { useUiStore } from '@/app/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '@/components/ui/Badge';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar } = useUiStore();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b px-3 lg:px-6 gap-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-surface) 80%, transparent)', backdropFilter: 'blur(8px)' }}>
      {/* Left — hamburger for mobile/tablet */}
      <button
        onClick={toggleSidebar}
        className="rounded-md p-2 lg:hidden shrink-0 transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search placeholder — mobile-visible */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-caption" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-fg)' }}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="primary">{user.role.replace('_', ' ')}</Badge>
              <div className="text-right">
                <p className="text-body font-medium leading-tight" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
              </div>
            </div>
            {/* Avatar for mobile */}
            <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-caption">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={logout}
              className="rounded-md p-2 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Logout"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
