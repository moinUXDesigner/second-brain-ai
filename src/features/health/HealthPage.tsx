import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTodayRollover } from '@/hooks/useTodayRollover';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { profileService } from '@/services/endpoints/profileService';
import { formatDate } from '@/utils/dateFormat';
import type { DailyState, Profile } from '@/types';
import { averageDailyScore, completionRate, isHealthProject, isHealthTask } from './healthUtils';

const DEFAULT_PROFILE: Profile = {
  userId: '',
  name: '',
  workType: '',
  routineType: '',
  commuteTime: '',
  usePersonalData: false,
  age: '',
  dob: '',
  financialStatus: '',
  healthStatus: '',
  customNotes: '',
};

function MetricTile({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-muted)' }}>
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {detail}
      </p>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percent = Math.max(0, Math.min(100, value * 10));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{value || '-'}/10</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function HealthPage() {
  const navigate = useNavigate();
  const currentDate = useTodayRollover();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [dailyStates, setDailyStates] = useState<DailyState[]>([]);
  const [loadingHealthData, setLoadingHealthData] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingHealthData(true);

    Promise.all([
      profileService.getProfile().catch(() => ({ data: null })),
      dailyStateService.history(14).catch(() => ({ data: [] })),
    ])
      .then(([profileRes, historyRes]) => {
        if (!active) return;
        setProfile({ ...DEFAULT_PROFILE, ...(profileRes.data ?? {}) });
        setDailyStates(historyRes.data ?? []);
      })
      .finally(() => {
        if (active) setLoadingHealthData(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const healthTasks = useMemo(() => tasks.filter(isHealthTask), [tasks]);
  const healthProjects = useMemo(() => projects.filter(isHealthProject), [projects]);
  const activeHealthProjects = healthProjects.filter((project) => project.status === 'Active');
  const completedHealthTasks = healthTasks.filter((task) => task.status === 'Done');
  const pendingHealthTasks = healthTasks.filter((task) => task.status === 'Pending');
  const todayState = dailyStates.find((state) => state.date === currentDate);
  const averageMood = averageDailyScore(dailyStates, 'mood');
  const averageEnergy = averageDailyScore(dailyStates, 'energy');
  const averageFocus = averageDailyScore(dailyStates, 'focus');
  const taskCompletionRate = completionRate(healthTasks.length, completedHealthTasks.length);
  const projectProgress = activeHealthProjects.length
    ? Math.round(activeHealthProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / activeHealthProjects.length)
    : 0;
  const loading = loadingTasks || loadingProjects || loadingHealthData;

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>
            Health
          </h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            A read-only health overview from profile, daily state, projects, and tasks.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/profile/health')}>
          Update Profile Health
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Profile health"
          value={profile.healthStatus || 'Not set'}
          detail={profile.updatedAt ? `Profile updated ${formatDate(profile.updatedAt)}` : 'Set this from Profile'}
        />
        <MetricTile
          label="Today state"
          value={todayState ? `${todayState.mood}/${todayState.energy}/${todayState.focus}` : 'Not logged'}
          detail={todayState ? 'Mood / Energy / Focus' : 'Log daily state to refresh this'}
        />
        <MetricTile
          label="Health tasks"
          value={pendingHealthTasks.length}
          detail={`${completedHealthTasks.length} done, ${taskCompletionRate}% completion`}
        />
        <MetricTile
          label="Health projects"
          value={activeHealthProjects.length}
          detail={`${projectProgress}% average active progress`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily State Trends</CardTitle>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Last 14 days from Daily State entries
            </p>
          </CardHeader>
          <div className="space-y-4">
            <ScoreBar label="Average mood" value={averageMood} color="var(--warning-600, #d97706)" />
            <ScoreBar label="Average energy" value={averageEnergy} color="var(--success-600, #16a34a)" />
            <ScoreBar label="Average focus" value={averageFocus} color="var(--primary-600)" />
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1">
            {dailyStates.slice(-7).map((state) => (
              <div key={state.id || state.date} className="rounded-md p-2 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
                <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatDate(state.date).slice(0, 6)}
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {Math.round(((state.mood + state.energy + state.focus) / 3) * 10) / 10}
                </p>
              </div>
            ))}
            {dailyStates.length === 0 && (
              <p className="col-span-7 py-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No Daily State entries yet.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Projects</CardTitle>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Projects whose domain, title, or notes match Health
            </p>
          </CardHeader>
          <div className="space-y-3">
            {activeHealthProjects.slice(0, 5).map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-black/[.025] dark:hover:bg-white/[.035]"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {project.title}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--primary-600)' }}>
                    {project.progress || 0}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${project.progress || 0}%`, backgroundColor: 'var(--primary-600)' }} />
                </div>
              </button>
            ))}
            {activeHealthProjects.length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No active Health projects found.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health Tasks</CardTitle>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Pending tasks from Health areas, wellness labels, or health-related text
          </p>
        </CardHeader>
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
          {pendingHealthTasks.length > 0 ? (
            pendingHealthTasks.slice(0, 8).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/tasks?category=${encodeURIComponent(task.category || 'Uncategorized')}`)}
                className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-black/[.025] dark:hover:bg-white/[.035]"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {task.title}
                  </span>
                  <span className="mt-1 block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {task.area || 'No area'} / {task.category || 'Uncategorized'}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  {task.dueDate ? formatDate(task.dueDate) : 'No date'}
                </span>
              </button>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No pending Health tasks found.
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
