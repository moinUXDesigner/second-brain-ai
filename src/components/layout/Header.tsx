import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore } from '@/app/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { AccessibilityMenu } from './AccessibilityMenu';
import { Badge } from '@/components/ui/Badge';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar, toggleSidebarCollapse, isSidebarCollapsed, aiEnabled, toggleAI } = useUiStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showA11y, setShowA11y] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b px-3 lg:px-6 gap-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-surface) 80%, transparent)', backdropFilter: 'blur(8px)' }}>
        {/* Left — hamburger for mobile, collapse toggle for desktop */}
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

        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-opacity-80"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
          }}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M9 3v18"></path>
            <path d={isSidebarCollapsed ? 'm15 9 3 3-3 3' : 'm16 15-3-3 3-3'}></path>
          </svg>
        </button>

        {/* Spacer for mobile so right-side items push right */}
        <div className="flex-1 lg:hidden" />

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Accessibility icon — mobile only */}
          <button
            onClick={() => setShowA11y(true)}
            className="rounded-md p-2 transition-colors md:hidden"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Accessibility settings"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* AI toggle — desktop only, improved with clear label */}
          <button
            onClick={toggleAI}
            className="hidden md:flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1.5 text-caption font-semibold transition-all"
            style={{
              backgroundColor: aiEnabled ? 'var(--primary-100)' : 'var(--color-muted)',
              color: aiEnabled ? 'var(--primary-700)' : 'var(--color-muted-fg)',
            }}
            aria-label={aiEnabled ? 'AI enabled — click to disable' : 'AI disabled — click to enable'}
            title={aiEnabled ? 'AI enabled — click to disable' : 'AI disabled — click to enable'}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black leading-none"
              style={{
                backgroundColor: aiEnabled ? 'var(--primary-600)' : 'var(--color-text-secondary)',
                color: '#fff',
              }}
            >
              AI
            </span>
            <span>{aiEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Theme toggle — desktop only */}
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop user info */}
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="primary">{user.role.replace('_', ' ')}</Badge>
                <div className="text-right">
                  <p className="text-body font-medium leading-tight" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
                </div>
              </div>

              {/* Avatar for mobile — navigates to profile */}
              <button
                onClick={() => navigate('/profile')}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-caption"
                aria-label="Go to profile"
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </button>

              {/* Logout — desktop only */}
              <button
                onClick={logout}
                className="hidden md:block rounded-md p-2 transition-colors"
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

      {/* Full-screen accessibility menu — mobile */}
      <AccessibilityMenu open={showA11y} onClose={() => setShowA11y(false)} />
    </>
  );
}
