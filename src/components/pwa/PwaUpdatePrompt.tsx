import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 card p-4 shadow-lg border-primary-200 dark:border-primary-700">
      <p className="text-body font-medium text-neutral-900 dark:text-neutral-50">Update available</p>
      <p className="text-caption text-neutral-500 mt-0.5">A new version of Second Brain AI is ready.</p>
      <div className="flex items-center gap-2 mt-3">
        <Button size="sm" variant="primary" onClick={handleUpdate}>Update now</Button>
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>Later</Button>
      </div>
    </div>
  );
}
