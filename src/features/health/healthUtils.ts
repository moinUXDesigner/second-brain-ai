import type { DailyState, Project, Task } from '@/types';

const HEALTH_TERMS = [
  'health',
  'wellbeing',
  'wellness',
  'fitness',
  'exercise',
  'medical',
  'doctor',
  'sleep',
  'mental',
  'body',
  'gym',
];

function includesHealthTerm(value?: string) {
  const normalized = value?.toLowerCase() ?? '';
  return HEALTH_TERMS.some((term) => normalized.includes(term));
}

export function isHealthTask(task: Task) {
  return [
    task.area,
    task.category,
    task.type,
    task.title,
    task.notes,
    ...(task.tags ?? []),
  ].some(includesHealthTerm);
}

export function isHealthProject(project: Project) {
  return [
    project.domain,
    project.title,
    project.description,
    project.maslowLevel,
  ].some(includesHealthTerm);
}

export function averageDailyScore(states: DailyState[], field: 'energy' | 'mood' | 'focus') {
  if (states.length === 0) return 0;

  const total = states.reduce((sum, state) => sum + (state[field] || 0), 0);
  return Math.round((total / states.length) * 10) / 10;
}

export function completionRate(total: number, completed: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
