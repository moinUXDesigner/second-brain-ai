import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/app/store/uiStore';

interface AccessibilityMenuProps {
  open: boolean;
  onClose: () => void;
}

export function AccessibilityMenu({ open, onClose }: AccessibilityMenuProps) {
  const { isDarkMode, toggleDarkMode, colorScheme, toggleColorScheme, aiEnabled, toggleAI } =
    useUiStore();

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex flex-col"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div
          className="flex h-14 items-center justify-between px-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
            Accessibility
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Dark / Light mode */}
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center gap-4 rounded-2xl p-4 transition-colors"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: isDarkMode ? 'var(--primary-100)' : 'var(--color-bg)',
                color: isDarkMode ? 'var(--primary-600)' : 'var(--color-text-secondary)',
              }}
            >
              {isDarkMode ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                Tap to switch to {isDarkMode ? 'light' : 'dark'} mode
              </p>
            </div>
            <div
              className="flex h-8 w-14 items-center rounded-full px-1 transition-colors"
              style={{ backgroundColor: isDarkMode ? 'var(--primary-600)' : 'var(--color-border)' }}
            >
              <motion.div
                className="h-6 w-6 rounded-full bg-white shadow"
                animate={{ x: isDarkMode ? 22 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </button>

          {/* Theme / Color Scheme */}
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <p className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
              Theme Color
            </p>
            <div className="flex gap-3">
              {/* Blue theme */}
              <button
                onClick={() => colorScheme !== 'blue' && toggleColorScheme()}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl p-3 border-2 transition-all"
                style={{
                  borderColor: colorScheme === 'blue' ? '#3b82f6' : 'var(--color-border)',
                  backgroundColor: colorScheme === 'blue' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                }}
              >
                <div
                  className="h-10 w-10 rounded-full shadow-sm"
                  style={{ backgroundColor: '#3b82f6' }}
                />
                <span
                  className="text-caption font-medium"
                  style={{ color: colorScheme === 'blue' ? '#3b82f6' : 'var(--color-text-secondary)' }}
                >
                  Blue
                </span>
                {colorScheme === 'blue' && (
                  <svg className="h-4 w-4" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Wellness theme */}
              <button
                onClick={() => colorScheme !== 'wellness' && toggleColorScheme()}
                className="flex flex-1 flex-col items-center gap-2 rounded-xl p-3 border-2 transition-all"
                style={{
                  borderColor: colorScheme === 'wellness' ? '#9eb384' : 'var(--color-border)',
                  backgroundColor: colorScheme === 'wellness' ? 'rgba(158, 179, 132, 0.08)' : 'transparent',
                }}
              >
                <div
                  className="h-10 w-10 rounded-full shadow-sm"
                  style={{ backgroundColor: '#9eb384' }}
                />
                <span
                  className="text-caption font-medium"
                  style={{ color: colorScheme === 'wellness' ? '#9eb384' : 'var(--color-text-secondary)' }}
                >
                  Wellness
                </span>
                {colorScheme === 'wellness' && (
                  <svg className="h-4 w-4" style={{ color: '#9eb384' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* AI Assistant toggle */}
          <button
            onClick={toggleAI}
            className="flex w-full items-center gap-4 rounded-2xl p-4 transition-colors"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: aiEnabled ? 'var(--primary-100)' : 'var(--color-bg)',
                color: aiEnabled ? 'var(--primary-600)' : 'var(--color-text-secondary)',
              }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.846 6.154A2.25 2.25 0 0115 22.5H9a2.25 2.25 0 01-2.154-1.846L5 14.5m14 0H5" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
                AI Assistant
              </p>
              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                {aiEnabled ? 'AI suggestions & auto-generation enabled' : 'AI features are turned off'}
              </p>
            </div>
            <div
              className="flex h-8 w-14 items-center rounded-full px-1 transition-colors"
              style={{ backgroundColor: aiEnabled ? 'var(--primary-600)' : 'var(--color-border)' }}
            >
              <motion.div
                className="h-6 w-6 rounded-full bg-white shadow"
                animate={{ x: aiEnabled ? 22 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
