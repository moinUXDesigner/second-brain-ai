import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { activateWaitingWorker, watchForUpdate } from '../src/lib/pwaUpdate.mjs';

class Worker extends EventTarget {
  state = 'installed';
  messages = [];
  postMessage(message) { this.messages.push(message); }
  transition(state) { this.state = state; this.dispatchEvent(new Event('statechange')); }
}
class Registration extends EventTarget {
  waiting = null;
  installing = null;
}

test('update waits through activation instead of resolving at skipWaiting', async () => {
  const worker = new Worker();
  const registration = { waiting: worker };
  let reloads = 0;
  const done = activateWaitingWorker(registration).then(() => { reloads++; });
  assert.deepEqual(worker.messages, [{ type: 'SKIP_WAITING' }]);
  await Promise.resolve();
  assert.equal(reloads, 0);
  worker.transition('activating');
  await Promise.resolve();
  assert.equal(reloads, 0);
  worker.transition('activated');
  await done;
  assert.equal(reloads, 1);
  worker.transition('activated');
  assert.equal(reloads, 1);
});

test('missing or discarded updates fail without reloading', async () => {
  await assert.rejects(activateWaitingWorker({ waiting: null }), /no longer ready/);
  const worker = new Worker();
  const done = activateWaitingWorker({ waiting: worker });
  worker.transition('redundant');
  await assert.rejects(done, /could not be installed/);
});

test('activation timeout releases listeners so a late event cannot trigger reload', async () => {
  const worker = new Worker();
  let reloads = 0;
  const done = activateWaitingWorker({ waiting: worker }, 5).then(() => { reloads++; });
  await assert.rejects(done, /longer than expected/);
  worker.transition('activated');
  await Promise.resolve();
  assert.equal(reloads, 0);
});

test('update already waiting at startup is discovered', () => {
  const registration = new Registration();
  registration.waiting = new Worker();
  let prompts = 0;
  const cleanup = watchForUpdate(registration, () => { prompts++; });
  assert.equal(prompts, 1);
  cleanup();
  registration.dispatchEvent(new Event('updatefound'));
  assert.equal(prompts, 1);
});

test('first installation does not prompt; later waiting update does; cleanup removes listeners', () => {
  const registration = new Registration();
  registration.installing = new Worker();
  let prompts = 0;
  const cleanup = watchForUpdate(registration, () => { prompts++; });
  registration.installing.transition('installed');
  assert.equal(prompts, 0);
  const update = new Worker();
  registration.installing = update;
  registration.dispatchEvent(new Event('updatefound'));
  registration.waiting = update;
  update.transition('installed');
  assert.equal(prompts, 1);
  cleanup();
  update.transition('installed');
  assert.equal(prompts, 1);
});

function startup(updating = false, cssReady = true) {
  const html = readFileSync('index.html', 'utf8');
  const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]).find((code) => code.includes("getElementById('app-startup')"));
  const nodes = new Map(['app-startup', 'startup-title', 'startup-message', 'startup-progress', 'startup-retry'].map((id) => [id, {
    hidden: id === 'startup-retry', textContent: '', attributes: {}, listeners: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(key, fn) { this.listeners[key] = fn; },
  }]));
  const events = {};
  let timeout;
  let interval;
  const classes = new Set();
  const stylesheet = { addEventListener: (key, fn) => { events["css-" + key] = fn; } };
  let reloads = 0;
  const storage = new Map(updating ? [['pwa-updating', 'true']] : []);
  vm.runInNewContext(source, {
    document: {
      getElementById: (id) => nodes.get(id),
      documentElement: { classList: { add: (name) => classes.add(name) } },
      querySelectorAll: () => [stylesheet],
    },
    sessionStorage: { getItem: (key) => storage.get(key), removeItem: (key) => storage.delete(key) },
    setTimeout: (fn) => { timeout = fn; return 1; }, clearTimeout: () => { timeout = undefined; },
    setInterval: (fn) => { interval = fn; return 2; }, clearInterval: () => { interval = undefined; },
    window: {
      addEventListener: (key, fn) => { events[key] = fn; }, location: { reload: () => { reloads++; } },
      getComputedStyle: () => ({ getPropertyValue: () => cssReady ? '1' : '' }),
    },
  });
  return { nodes, events, storage, classes, setCssReady: () => { cssReady = true; }, tick: () => interval?.(), triggerTimeout: () => timeout?.(), reloads: () => reloads };
}

test('restart keeps updating UI until React signals readiness', () => {
  const app = startup(true);
  assert.equal(app.nodes.get('startup-title').textContent, 'Updating your app');
  assert.equal(app.nodes.get('app-startup').hidden, false);
  app.events['app-ready']();
  assert.equal(app.nodes.get('app-startup').hidden, true);
  assert.equal(app.storage.has('pwa-updating'), false);
  app.triggerTimeout();
  assert.equal(app.nodes.get('startup-retry').hidden, true);
});

test('missing bundle gives recovery action rather than a blank page or reload loop', () => {
  const app = startup();
  app.triggerTimeout();
  assert.match(app.nodes.get('startup-title').textContent, /couldn’t finish loading/);
  assert.equal(app.nodes.get('app-startup').hidden, false);
  assert.equal(app.nodes.get('startup-progress').hidden, true);
  assert.equal(app.nodes.get('startup-retry').hidden, false);
  assert.equal(app.reloads(), 0);
  app.nodes.get('startup-retry').listeners.click();
  assert.equal(app.reloads(), 1);
  // Slow bundles may still load successfully after the timeout.
  app.events['app-ready']();
  assert.equal(app.nodes.get('app-startup').hidden, true);
});


test('React mounting without CSS never exposes giant unstyled icons', () => {
  const app = startup(true, false);
  app.events['app-ready']();
  app.tick();
  assert.equal(app.nodes.get('app-startup').hidden, false);
  assert.equal(app.classes.has('app-ready'), false);
  assert.equal(app.storage.has('pwa-updating'), true);
  app.triggerTimeout();
  assert.equal(app.nodes.get('startup-retry').hidden, false);
  assert.equal(app.nodes.get('app-startup').hidden, false);
  app.setCssReady();
  app.events['css-load']();
  assert.equal(app.nodes.get('app-startup').hidden, true);
  assert.equal(app.classes.has('app-ready'), true);
});

test('late CSS reveals mounted app, while CSS alone cannot reveal an unmounted app', () => {
  const app = startup(false, false);
  app.setCssReady();
  app.events['css-load']();
  assert.equal(app.nodes.get('app-startup').hidden, false);
  app.events['app-ready']();
  assert.equal(app.nodes.get('app-startup').hidden, true);
  assert.equal(app.classes.has('app-ready'), true);
});
