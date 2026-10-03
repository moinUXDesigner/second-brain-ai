/** Resolve only after the waiting worker has finished activation and cache cleanup. */
export function activateWaitingWorker(registration, timeoutMs = 20000) {
  const worker = registration.waiting;
  if (!worker) return Promise.reject(new Error('The update is no longer ready. Please reload and try again.'));
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      clearTimeout(timer);
      worker.removeEventListener('statechange', changed);
      if (error) reject(error);
      else resolve();
    };
    const changed = () => {
      if (worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('The update could not be installed. Please try again.'));
    };
    worker.addEventListener('statechange', changed);
    timer = setTimeout(() => finish(new Error('The update is taking longer than expected. Check your connection and try again.')), timeoutMs);
    try {
      if (worker.state === 'activated' || worker.state === 'redundant') changed();
      else worker.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      finish(new Error('The update could not be started. Please try again.'));
    }
  });
}

/** Track both updates already waiting on load and ones installed later. */
export function watchForUpdate(registration, onWaiting) {
  const workers = new Map();
  const inspect = () => {
    if (registration.waiting) onWaiting();
  };
  const track = () => {
    const worker = registration.installing;
    if (worker && !workers.has(worker)) {
      const changed = () => {
        if (worker.state === 'installed') inspect();
      };
      workers.set(worker, changed);
      worker.addEventListener('statechange', changed);
    }
    inspect();
  };
  registration.addEventListener('updatefound', track);
  track();
  return () => {
    registration.removeEventListener('updatefound', track);
    for (const [worker, changed] of workers) worker.removeEventListener('statechange', changed);
  };
}
