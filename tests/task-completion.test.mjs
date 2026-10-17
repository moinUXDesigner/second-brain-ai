import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';

function setup() {
  const client = new QueryClient();
  const keys = { tasks: ['tasks'], todayTasks: ['tasks', 'today'], smartTodayTasks: ['tasks', 'today', 'smart'], projects: ['projects'] };
  let callbacks;
  const dependencies = {
    '@tanstack/react-query': { useQueryClient: () => client, useMutation: (options) => { callbacks = options; } },
    '@/app/store/taskStore': { useTaskStore: () => ({ updateTaskInStore() {} }) },
    './useAudit': { useAudit: () => ({ log() {} }) },
    '@/constants': { QUERY_KEYS: keys },
  };
  const source = ts.transpileModule(readFileSync(new URL('../src/hooks/useTasks.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => dependencies[name] ?? {} });
  exports.useUpdateTaskStatus();
  return { client, callbacks };
}

test('saved completion removes an overdue task from cached pending lists before refetch', () => {
  const { client, callbacks } = setup();
  const task = { id: '1', status: 'Pending', dueDate: '2026-01-01' };
  const keys = [['tasks'], ['tasks', 'today', '2026-10-17'], ['tasks', 'today', 'smart', '2026-10-17']];
  keys.forEach((key) => client.setQueryData(key, [task]));
  const saved = { ...task, status: 'Done', completedAt: '2026-10-17T10:00:00Z', completionNotes: 'Finished' };
  callbacks.onSuccess({ data: saved }, { id: '1', status: 'Done' });
  keys.forEach((key) => {
    const tasks = client.getQueryData(key);
    assert.equal(tasks.filter((item) => item.status === 'Pending').length, 0);
    assert.equal(tasks[0].completedAt, saved.completedAt);
    assert.equal(tasks[0].completionNotes, 'Finished');
  });
});

test('cancelling completion keeps the overdue task pending', () => {
  const { client, callbacks } = setup();
  const task = { id: '1', status: 'Pending', dueDate: '2026-01-01' };
  client.setQueryData(['tasks'], [task]);
  callbacks.onSuccess({ data: task }, { id: '1', status: 'Done' });
  assert.equal(client.getQueryData(['tasks'])[0].status, 'Pending');
});
