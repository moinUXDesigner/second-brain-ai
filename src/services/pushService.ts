import apiClient from './apiClient';

export const pushSupported = () => window.isSecureContext && 'serviceWorker' in navigator
  && 'PushManager' in window && 'Notification' in window;

export async function pushRegistration(): Promise<ServiceWorkerRegistration> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Notifications are still starting. Reload and try again.')), 10000);
      }),
    ]);
  } finally { clearTimeout(timeout); }
}

export const pushService = {
  async config(): Promise<{ enabled: boolean; publicKey: string | null }> {
    const { data } = await apiClient.get('/push/config');
    return data.data;
  },
  async save(subscription: PushSubscription) {
    await apiClient.post('/push/subscriptions', subscription.toJSON());
  },
  async remove(subscription: PushSubscription) {
    await apiClient.delete('/push/subscriptions', { data: { endpoint: subscription.endpoint } });
  },
  async test(subscription: PushSubscription) {
    await apiClient.post('/push/test', { endpoint: subscription.endpoint });
  },
};

export function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
