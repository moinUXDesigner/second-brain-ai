import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

const leftItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  },
  {
    to: '/today',
    label: 'Today',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
];

const rightItems = [
  {
    to: '/tasks',
    label: 'Tasks',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors',
          isActive ? 'text-primary-600' : '',
        )
      }
      style={({ isActive }) => ({ color: isActive ? undefined : 'var(--color-muted-fg)' })}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      <span>{label}</span>
    </NavLink>
  );
}

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center border-t h-16 lg:hidden safe-bottom" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* Left items */}
      {leftItems.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}

      {/* Center FAB spacer + button */}
      <div className="relative flex items-center justify-center flex-1 h-full">
        <button
          onClick={() => navigate('/create')}
          className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
          aria-label="Create new task"
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Right items */}
      {rightItems.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </nav>
  );
}
