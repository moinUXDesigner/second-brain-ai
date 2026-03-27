import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreatePage = location.pathname.endsWith('/create');

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />

      {/* Floating create button — hidden on create page and on desktop in sidebar */}
      {!isCreatePage && (
        <button
          onClick={() => navigate('/create')}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 lg:hidden"
          style={{ backgroundColor: 'var(--primary-600)', color: '#fff' }}
          aria-label="Create new"
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}
