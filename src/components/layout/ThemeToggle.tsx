import { useUiStore } from '@/app/store/uiStore';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode, colorScheme, toggleColorScheme } = useUiStore();

  return (
    <div className="flex items-center gap-1">
      {/* Color scheme toggle (blue / wellness) */}
      <button
        onClick={toggleColorScheme}
        className="rounded-md p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label="Toggle color scheme"
        title={colorScheme === 'blue' ? 'Switch to Wellness theme' : 'Switch to Blue theme'}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`block h-4 w-4 rounded-full border-2 transition-all ${
              colorScheme === 'blue'
                ? 'border-blue-600 scale-110 ring-2 ring-blue-200'
                : 'border-transparent opacity-50'
            }`}
            style={{ backgroundColor: '#3b82f6' }}
          />
          <span
            className={`block h-4 w-4 rounded-full border-2 transition-all ${
              colorScheme === 'wellness'
                ? 'border-green-700 scale-110 ring-2 ring-green-200'
                : 'border-transparent opacity-50'
            }`}
            style={{ backgroundColor: '#9eb384' }}
          />
        </div>
      </button>

      {/* Dark / Light toggle */}
      <button
        onClick={toggleDarkMode}
        className="rounded-md p-2 transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}
