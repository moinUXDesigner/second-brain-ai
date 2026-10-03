import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function worker(windows = []) {
  const handlers = {};
  const shown = [];
  const opened = [];
  const self = {
    location: { origin: 'https://secondbrain.example' },
    addEventListener: (name, fn) => { handlers[name] = fn; },
    registration: { showNotification: async (...args) => shown.push(args) },
    clients: { matchAll: async () => windows, openWindow: async (url) => opened.push(url) },
  };
  vm.runInNewContext(readFileSync('public/push-sw.js', 'utf8'), { self, URL });
  const dispatch = async (type, event) => {
    let completion;
    handlers[type]({ ...event, waitUntil: (promise) => { completion = promise; } });
    await completion;
  };
  return { dispatch, shown, opened };
}

test('background push displays payload and refreshes open app notifications', async () => {
  const messages = [];
  const sw = worker([{ postMessage: (message) => messages.push(message) }]);
  await sw.dispatch('push', { data: { json: () => ({ title: 'Due today', message: 'Finish report', tag: 'task-1', url: '/tasks?edit=1' }) } });
  assert.equal(sw.shown[0][0], 'Due today');
  assert.equal(sw.shown[0][1].body, 'Finish report');
  assert.equal(sw.shown[0][1].tag, 'task-1');
  assert.equal(sw.shown[0][1].data.url, '/tasks?edit=1');
  assert.equal(messages[0].type, 'PUSH_RECEIVED');
});

test('malformed and empty payloads still show a notification', async () => {
  const sw = worker();
  await sw.dispatch('push', { data: { json: () => { throw new Error('Malformed'); } } });
  await sw.dispatch('push', { data: null });
  await sw.dispatch('push', { data: { json: () => null } });
  assert.equal(sw.shown.length, 3);
  assert.equal(sw.shown[0][0], 'Second Brain AI');
});

test('click focuses existing app and opens reminder task', async () => {
  const events = [];
  const sw = worker([{ url: 'https://secondbrain.example/today', navigate: async (url) => events.push(url), focus: async () => events.push('focus') }]);
  await sw.dispatch('notificationclick', { notification: { close: () => events.push('close'), data: { url: '/tasks?edit=42' } } });
  assert.deepEqual(events, ['close', 'https://secondbrain.example/tasks?edit=42', 'focus']);
  assert.equal(sw.opened.length, 0);
});

test('click never opens arbitrary external or non-task URLs', async () => {
  for (const url of ['https://evil.example/tasks', 'javascript:alert(1)', '/login', '/tasks?edit=3']) {
    const sw = worker();
    await sw.dispatch('notificationclick', { notification: { close() {}, data: { url } } });
    assert.equal(sw.opened[0], url === '/tasks?edit=3' ? 'https://secondbrain.example/tasks?edit=3' : 'https://secondbrain.example/tasks');
  }
});
