import type { Task } from '@/types';
import { parseLocalDate } from '@/utils/dateFormat';

function isPastDate(dateValue: string | undefined, today: Date) {
  if (!dateValue) return false;

  const parsed = parseLocalDate(dateValue);
  if (!parsed) return false;

  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

export function isTaskOverdue(task: Task, now = new Date()) {
  if (task.status !== 'Pending') return false;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return isPastDate(task.dueDate, today) || isPastDate(task.deadlineDate, today);
}
