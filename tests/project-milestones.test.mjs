import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/projectMilestones.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { groupMilestonesByPhase } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const phases = [{ id: 'a' }, { id: 'b' }];

test('task phases group shared milestones once per phase, including completed tasks', () => {
  const milestones = [{ id: 'shared' }];
  const tasks = [
    { milestoneId: 'shared', phaseId: 'a', status: 'Pending' },
    { milestoneId: 'shared', phaseId: 'a', status: 'Pending' },
    { milestoneId: 'shared', phaseId: 'b', status: 'Done' },
  ];
  const result = groupMilestonesByPhase(phases, milestones, tasks);
  assert.deepEqual(result.byPhase.get('a'), milestones);
  assert.deepEqual(result.byPhase.get('b'), milestones);
  assert.deepEqual(result.unassigned, []);
  assert.equal(milestones[0].phaseId, undefined);
});

test('explicit phase wins over task phases and unused explicit milestones stay grouped', () => {
  const milestones = [{ id: 'explicit', phaseId: 'a' }, { id: 'unused', phaseId: 'a' }];
  const result = groupMilestonesByPhase(phases, milestones, [
    { milestoneId: 'explicit', phaseId: 'b', status: 'Pending' },
  ]);
  assert.deepEqual(result.byPhase.get('a'), milestones);
  assert.equal(result.byPhase.has('b'), false);
  assert.deepEqual(result.unassigned, []);
});

test('deleted tasks and invalid phases do not assign milestones; invalid parents can use task phases', () => {
  const milestones = [{ id: 'deleted' }, { id: 'invalid' }, { id: 'unused' }, { id: 'recovered', phaseId: 'missing' }];
  const result = groupMilestonesByPhase(phases, milestones, [
    { milestoneId: 'deleted', phaseId: 'a', status: 'Deleted' },
    { milestoneId: 'invalid', phaseId: 'missing', status: 'Pending' },
    { milestoneId: 'recovered', phaseId: 'b', status: 'Pending' },
  ]);
  assert.deepEqual(result.unassigned, milestones.slice(0, 3));
  assert.deepEqual(result.byPhase.get('b'), [milestones[3]]);
});
