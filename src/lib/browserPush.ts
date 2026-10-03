export async function removeBrowserPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (subscription) await subscription.unsubscribe();
  localStorage.removeItem('push-owner');
}
