import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 card p-4 shadow-lg border-primary-200 dark:border-primary-700 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold shrink-0">
          SB
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-neutral-900 dark:text-neutral-50">Install Second Brain AI</p>
          <p className="text-caption text-neutral-500 mt-0.5">Add to home screen for quick access</p>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" variant="primary" onClick={handleInstall}>Install</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowBanner(false)}>Not now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
