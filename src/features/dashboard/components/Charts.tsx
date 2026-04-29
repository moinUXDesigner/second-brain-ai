import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import type { Project, Task } from '@/types';

const COLORS = ['#6172f3', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

type CategoryDatum = {
  name: string;
  value: number;
  percent: number;
};

type CompletionRateDatum = {
  month: string;
  rate: number;
  completed: number;
  total: number;
};

const PROJECT_ACCENTS = [
  { bg: '#dbeafe', text: '#2563eb' },
  { bg: '#d1fae5', text: '#059669' },
  { bg: '#cffafe', text: '#0891b2' },
  { bg: '#ffedd5', text: '#ea580c' },
  { bg: '#ffe4e6', text: '#e11d48' },
];

function getProjectTaskStats(project: Project) {
  const tasks = project.subtasks?.filter((task) => task.status !== 'Deleted' && task.status !== 'Note') ?? [];
  const completed = tasks.filter((task) => task.status === 'Done').length;
  const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : project.progress || 0;

  return {
    total: tasks.length,
    completed,
    rate,
  };
}

function getTaskMonthKey(task: Task) {
  const sourceDate = task.createdAt || task.completedAt || task.dueDate;
  if (!sourceDate) return null;

  const date = new Date(sourceDate);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${date.getMonth()}`;
}

function getCompletedMonthKey(task: Task) {
  if (!task.completedAt) return null;

  const date = new Date(task.completedAt);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${date.getMonth()}`;
}

function CompletionRateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CompletionRateDatum }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      <div className="font-semibold">{item.month}</div>
      <div>{item.rate}% completion rate</div>
      <div>{item.completed}/{item.total} tasks completed</div>
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategoryDatum }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      <div className="font-semibold">{item.name}</div>
      <div>{item.value} pending tasks</div>
      <div>{item.percent}% of pending</div>
    </div>
  );
}

function renderCategoryLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  value,
}: PieLabelRenderProps) {
  if (
    typeof cx !== 'number' ||
    typeof cy !== 'number' ||
    typeof midAngle !== 'number' ||
    typeof outerRadius !== 'number' ||
    typeof percent !== 'number' ||
    typeof value !== 'number' ||
    percent < 0.08
  ) {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-text-secondary)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${value} (${Math.round(percent * 100)}%)`}
    </text>
  );
}

export function Charts() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  const pendingTasks = tasks.filter((t) => t.status === 'Pending');
  const categoryMap = pendingTasks.reduce<Record<string, number>>((acc, t) => {
    const category = t.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const pendingTotal = pendingTasks.length;
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value,
      percent: pendingTotal > 0 ? Math.round((value / pendingTotal) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const statusData = [
    { name: 'Pending', count: tasks.filter((t) => t.status === 'Pending').length },
    { name: 'Done', count: tasks.filter((t) => t.status === 'Done').length },
  ];

  const now = new Date();
  const completedTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));

    const dateStr = date.toISOString().split('T')[0];
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const completed = tasks.filter(
      (t) => t.status === 'Done' && t.completedAt && t.completedAt.split('T')[0] === dateStr,
    ).length;

    return { day, completed };
  });

  const runningProjects = projects
    .filter((project) => project.status === 'Active')
    .map((project) => ({
      ...project,
      stats: getProjectTaskStats(project),
    }))
    .sort((a, b) => b.stats.rate - a.stats.rate)
    .slice(0, 5);

  const monthlyCompletionRateData: CompletionRateDatum[] = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i), 1);
    date.setHours(0, 0, 0, 0);

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const monthTasks = tasks.filter((task) => task.status !== 'Deleted' && task.status !== 'Note' && getTaskMonthKey(task) === key);
    const completed = tasks.filter((task) => task.status === 'Done' && getCompletedMonthKey(task) === key).length;
    const rate = monthTasks.length > 0 ? Math.round((completed / monthTasks.length) * 100) : 0;

    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      rate: Math.min(rate, 100),
      completed,
      total: monthTasks.length,
    };
  });

  if (isLoading || loadingProjects) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 w-32 rounded mb-4" style={{ backgroundColor: 'var(--color-muted)' }} />
            <div className="h-64 rounded" style={{ backgroundColor: 'var(--color-muted)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="overflow-hidden !p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <CardTitle>Running Projects</CardTitle>
          <select
            value="completion"
            aria-label="Project analytics metric"
            className="h-9 rounded-md border px-3 text-sm outline-none"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            onChange={() => undefined}
          >
            <option value="completion">Completion Rate</option>
          </select>
        </div>

        {runningProjects.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {runningProjects.map((project, index) => {
              const accent = PROJECT_ACCENTS[index % PROJECT_ACCENTS.length];
              const initial = project.title.trim().charAt(0).toUpperCase() || 'P';

              return (
                <div key={project.id} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: accent.bg, color: accent.text }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {project.title}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}
                      >
                        {project.stats.rate}%
                      </span>
                    </div>
                    <div className="mt-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {project.stats.completed}/{project.stats.total} tasks completed
                    </div>
                  </div>
                  <div className="hidden w-28 shrink-0 sm:block">
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${project.stats.rate}%`, backgroundColor: 'var(--primary-600)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No active projects yet.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden !p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <CardTitle>Task Completion Rate</CardTitle>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Month-wise completion percentage
            </p>
          </div>
          <select
            value="last12"
            aria-label="Completion rate range"
            className="h-9 rounded-md border px-3 text-sm outline-none"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            onChange={() => undefined}
          >
            <option value="last12">Last 12 Months</option>
          </select>
        </div>
        <div className="h-72 px-3 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyCompletionRateData} margin={{ top: 12, right: 20, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="completionRateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f7cf6" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#2f7cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#dbe5f2" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <Tooltip content={<CompletionRateTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#2f7cf6"
                fill="url(#completionRateFill)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-surface)', stroke: '#2f7cf6' }}
                activeDot={{ r: 5, strokeWidth: 2, fill: '#2f7cf6', stroke: '#fff' }}
                name="Completion Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks by Status</CardTitle>
        </CardHeader>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} />
              <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6172f3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Tasks by Category</CardTitle>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Based on pending tasks only
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
          >
            {pendingTotal} pending
          </span>
        </CardHeader>

        {categoryData.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={42}
                    paddingAngle={2}
                    labelLine
                    label={renderCategoryLabel}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {categoryData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span
                      className="truncate text-xs font-medium"
                      style={{ color: 'var(--color-text)' }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.value} · {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No pending tasks to chart yet.
          </div>
        )}
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Completed Tasks Trend</CardTitle>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Tasks completed over the last 7 days
          </p>
        </CardHeader>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={completedTrendData}>
              <defs>
                <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" fontSize={12} tick={{ fill: '#6b7280' }} />
              <YAxis allowDecimals={false} fontSize={12} tick={{ fill: '#6b7280' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                fill="url(#completedFill)"
                strokeWidth={2}
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
