import type { ProjectPhase, ProjectMilestone, Task } from '@/types';

export function groupMilestonesByPhase(
  phases: ProjectPhase[], milestones: ProjectMilestone[], tasks: Task[],
) {
  const validPhases = new Set(phases.map((phase) => phase.id));
  const byPhase = new Map<string, ProjectMilestone[]>();
  const unassigned: ProjectMilestone[] = [];
  for (const milestone of milestones) {
    const phaseIds = new Set<string>();
    if (milestone.phaseId && validPhases.has(milestone.phaseId)) {
      phaseIds.add(milestone.phaseId);
    } else {
      for (const task of tasks) {
        if (task.status !== 'Deleted' && task.milestoneId === milestone.id
          && task.phaseId && validPhases.has(task.phaseId)) phaseIds.add(task.phaseId);
      }
    }
    if (phaseIds.size === 0) unassigned.push(milestone);
    for (const phaseId of phaseIds) {
      const group = byPhase.get(phaseId) ?? [];
      group.push(milestone);
      byPhase.set(phaseId, group);
    }
  }
  return { byPhase, unassigned };
}
