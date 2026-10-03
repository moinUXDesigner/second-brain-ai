import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store/authStore';
import { QUERY_KEYS } from '@/constants';
import { applicationServerKey, pushRegistration, pushService, pushSupported } from '@/services/pushService';

export function usePushNotifications() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const supported = pushSupported();
  const [config, setConfig] = useState<{ enabled: boolean; publicKey: string | null } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [permission, setPermission] = useState(supported ? Notification.permission : 'default');

  useEffect(() => {
    if (!supported || !userId) return;
    let cancelled = false;
    setConfig(null);
    setEnabled(false);
    pushService.config().then(async (settings) => {
      if (cancelled) return;
      setConfig(settings);
      if (!settings.enabled || Notification.permission !== 'granted') return;
      const registration = await pushRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (cancelled || !subscription) return;
      // Reconcile an existing browser subscription on login, including shared-browser account changes.
      await pushService.save(subscription);
      if (!cancelled) {
        localStorage.setItem('push-owner', String(userId));
        setEnabled(true);
      }
    }).catch(() => { if (!cancelled) setMessage('Could not load push settings. Reload to try again.'); });
    const receive = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    };
    navigator.serviceWorker.addEventListener('message', receive);
    return () => { cancelled = true; navigator.serviceWorker.removeEventListener('message', receive); };
  }, [supported, userId, queryClient]);

  const toggle = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (!enabled) {
        // Ask only from the user's click, before awaiting other work (required on Safari).
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          setMessage(result === 'denied' ? 'Notifications are blocked. Allow them in your browser site settings.' : 'Permission was not granted. You can try again.');
          return;
        }
      }
      const registration = await pushRegistration();
      let subscription = await registration.pushManager.getSubscription();
      if (enabled && subscription) {
        await pushService.remove(subscription);
        await subscription.unsubscribe();
        localStorage.removeItem('push-owner');
        setEnabled(false);
      } else {
        if (!config?.publicKey) throw new Error('Push notifications are not configured.');
        subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(config.publicKey) });
        try { await pushService.save(subscription); }
        catch (error) { await subscription.unsubscribe(); throw error; }
        localStorage.setItem('push-owner', String(userId));
        setEnabled(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update push notifications.');
    } finally { setBusy(false); }
  };

  const test = async () => {
    setBusy(true);
    setMessage('');
    try {
      const subscription = await (await pushRegistration()).pushManager.getSubscription();
      if (!subscription) throw new Error('Enable push notifications first.');
      await pushService.test(subscription);
      setMessage('Test queued. It should arrive within a minute.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send a test notification.');
    } finally { setBusy(false); }
  };

  return { supported, configured: config?.enabled, loading: !config, enabled, busy, permission, message, toggle, test };
}
