import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore } from '@/app/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/constants';
import { hasPermission } from '@/utils/permissions';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { to: '/today', label: 'Today', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/completed', label: 'Completed', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/notes-ideas', label: 'Notes & Ideas', icon: 'M12 6.5c-2.5 0-4.5 2-4.5 4.5S9.5 15.5 12 15.5 16.5 13.5 16.5 11 14.5 6.5 12 6.5z M21 18v2H3v-2c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2z' },
  { to: '/recurring', label: 'Recurring Tasks', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-8h-2v5h2V10zm0-4h-2v2h2V6z' },
  { to: '/projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { to: '/projects/deleted', label: 'Deleted Projects', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { to: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/daily-state', label: 'Daily State', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/activity', label: 'Activity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/bulk-upload', label: 'Bulk Upload', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' },
];

const adminItem = {
  to: '/admin',
  label: 'Admin',
  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
};

export function Sidebar() {
  const role = useAuthStore((s) => s.role);
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const allItems = role && hasPermission(role, 'admin:access')
    ? [...navItems, adminItem]
    : role === 'super_admin' || role === 'admin'
      ? [...navItems, adminItem]
      : navItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-200 w-64',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0',
        )}
        style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-body shrink-0">
            SB
          </div>
          <span className="text-body font-semibold truncate" style={{ color: 'var(--sidebar-fg)' }}>
            {APP_NAME}
          </span>
        </div>

        {/* Create button */}
        <div className="p-3">
          <button
            onClick={() => {
              navigate('/create');
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium transition-colors"
            style={{
              backgroundColor: 'var(--primary-600)',
              color: '#fff',
            }}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {allItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-body transition-colors',
                  isActive
                    ? 'font-medium'
                    : 'hover:opacity-80',
                )
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--sidebar-active-bg)' : undefined,
                color: isActive ? 'var(--sidebar-active-fg)' : 'var(--color-text-secondary)',
              })}
            >
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button
            onClick={() => {
              if (window.innerWidth < 1024) toggleSidebar();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-body transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="truncate">Logout</span>
          </button>
        </div>      </aside>
    </>
  );
}
