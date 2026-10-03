import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { activateWaitingWorker, watchForUpdate } from '@/lib/pwaUpdate.mjs';

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;
    let stopWatching: (() => void) | undefined;
    navigator.serviceWorker.ready.then((reg) => {
      if (cancelled) return;
      setRegistration(reg);
      stopWatching = watchForUpdate(reg, () => setNeedRefresh(true));
    }).catch(() => { /* The app remains usable if service workers are unavailable. */ });
    return () => { cancelled = true; stopWatching?.(); };
  }, []);

  const handleUpdate = async () => {
    if (!registration || started.current) return;
    started.current = true;
    setError('');
    setUpdating(true);
    // Give the updating screen a chance to paint before activation starts.
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      await activateWaitingWorker(registration);
      try { sessionStorage.setItem('pwa-updating', 'true'); } catch { /* Startup also has a default loading screen. */ }
      window.location.reload();
    } catch (failure) {
      started.current = false;
      setUpdating(false);
      setError(failure instanceof Error ? failure.message : 'Unable to update. Please try again.');
    }
  };

  if (updating) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)] px-6" role="dialog" aria-modal="true" aria-labelledby="updating-title" aria-describedby="updating-description" aria-busy="true">
        <div className="w-full max-w-sm text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <svg className="h-9 w-9 animate-spin motion-reduce:animate-none text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".2" />
              <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 id="updating-title" className="text-xl font-semibold text-[var(--color-text)]">Updating your app</h2>
          <p id="updating-description" className="mt-2 text-sm text-[var(--color-text-secondary)]">Applying the latest version. The app will restart when it’s ready.</p>
          <div className="app-loading-track mt-6" role="progressbar" aria-label="App update in progress">
            <span />
          </div>
          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">Please keep this window open.</p>
        </div>
      </div>
    );
  }

  if (!needRefresh) return null;

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 card p-4 shadow-lg border-primary-200 dark:border-primary-700" role="region" aria-label="App update">
      <p className="text-body font-medium text-neutral-900 dark:text-neutral-50">Update available</p>
      <p className="text-caption text-neutral-500 mt-0.5">A new version of Second Brain AI is ready.</p>
      {error && <p className="mt-2 text-sm text-danger-600" role="alert">{error}</p>}
      <div className="flex items-center gap-2 mt-3">
        {error ? (
          <Button size="sm" variant="primary" onClick={handleUpdate}>Try again</Button>
        ) : (
          <Button size="sm" variant="primary" onClick={handleUpdate}>Update now</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => { setNeedRefresh(false); setError(''); }}>Later</Button>
      </div>
    </div>
  );
}
