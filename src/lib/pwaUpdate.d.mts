export function activateWaitingWorker(registration: ServiceWorkerRegistration, timeoutMs?: number): Promise<void>;
export function watchForUpdate(registration: ServiceWorkerRegistration, onWaiting: () => void): () => void;
