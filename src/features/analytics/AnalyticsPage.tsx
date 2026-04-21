import { motion } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend,
} from 'recharts';
import { useTaskStore } from '@/app/store/taskStore';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { useTasks } from '@/hooks/useTasks';
import type { Task, DailyState } from '@/types';

export function AnalyticsPage() {
  useTasks();
  const { tasks } = useTaskStore();
  const [wellbeingData, setWellbeingData] = useState<{ day: string; mood: number; energy: number; focus: number }[]>([]);

  useEffect(() => {
    dailyStateService.history(14).then((res) => {
      if (res.data) {
        const mapped = (res.data as DailyState[]).map((s) => ({
          day: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          mood: s.mood,
          energy: s.energy,
          focus: s.focus,
        }));
        setWellbeingData(mapped);
      }
    }).catch(() => {});
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const weeklyData = last7Days.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const completed = tasks.filter((t) => 
        t.status === 'Done' && 
        t.completedAt && 
        t.completedAt.split('T')[0] === dateStr
      ).length;
      
      const created = tasks.filter((t) => 
        t.createdAt && 
        t.createdAt.split('T')[0] === dateStr
      ).length;

      return { day: dayName, completed, created, date: dateStr };
    });

    // Calculate productivity score based on completion rate and task priority
    const productivityData = last7Days.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayTasks = tasks.filter((t) => 
        t.createdAt && 
        t.createdAt.split('T')[0] <= dateStr &&
        (!t.completedAt || t.completedAt.split('T')[0] >= dateStr)
      );
      
      const completedToday = tasks.filter((t) => 
        t.status === 'Done' && 
        t.completedAt && 
        t.completedAt.split('T')[0] === dateStr
      );

      const highPriorityCompleted = completedToday.filter((t) => 
        (t.priority && t.priority >= 8) || t.urgency === 'High'
      ).length;

      const totalCompleted = completedToday.length;
      const totalTasks = dayTasks.length;

      // Score calculation: completion rate (70%) + high priority bonus (30%)
      const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) : 0;
      const priorityBonus = totalCompleted > 0 ? (highPriorityCompleted / totalCompleted) : 0;
      const score = Math.round((completionRate * 70) + (priorityBonus * 30));

      return { day: dayName, score, date: dateStr };
    });

    // Task status distribution
    const statusData = [
      { name: 'Pending', value: tasks.filter((t) => t.status === 'Pending').length, color: '#6172f3' },
      { name: 'Done', value: tasks.filter((t) => t.status === 'Done').length, color: '#22c55e' },
      { name: 'Note', value: tasks.filter((t) => t.status === 'Note').length, color: '#f59e0b' },
      { name: 'Idea', value: tasks.filter((t) => t.status === 'Idea').length, color: '#8b5cf6' },
    ].filter((s) => s.value > 0);

    // Priority distribution
    const priorityData = [
      { name: 'High', value: tasks.filter((t) => t.urgency === 'High' || (t.priority && t.priority >= 8)).length, color: '#ef4444' },
      { name: 'Medium', value: tasks.filter((t) => t.priority && t.priority >= 5 && t.priority < 8).length, color: '#f59e0b' },
      { name: 'Low', value: tasks.filter((t) => t.priority && t.priority < 5).length, color: '#22c55e' },
    ].filter((p) => p.value > 0);

    // Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgCompletionTime = calculateAvgCompletionTime(tasks);

    return {
      weeklyData,
      productivityData,
      statusData,
      priorityData,
      stats: { totalTasks, completedTasks, completionRate, avgCompletionTime },
    };
  }, [tasks]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Analytics</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>Track your productivity trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={analytics.stats.totalTasks} color="var(--primary-600)" />
        <StatCard label="Completed" value={analytics.stats.completedTasks} color="var(--success-600, #16a34a)" />
        <StatCard label="Completion Rate" value={`${analytics.stats.completionRate}%`} color="var(--warning-600, #d97706)" />
        <StatCard label="Avg. Time" value={analytics.stats.avgCompletionTime} color="var(--color-text-secondary)" />
      </div>

      {wellbeingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mood · Energy · Focus (last 14 days)</CardTitle>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wellbeingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]} fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
                <Legend />
                <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={false} name="Mood" />
                <Line type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={2} dot={false} name="Energy" />
                <Line type="monotone" dataKey="focus" stroke="#6172f3" strokeWidth={2} dot={false} name="Focus" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Activity</CardTitle>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="#dcfce7" name="Completed" />
                <Area type="monotone" dataKey="created" stroke="#6172f3" fill="#e0e9ff" name="Created" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Score</CardTitle>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
                <Line type="monotone" dataKey="score" stroke="#6172f3" strokeWidth={2} dot={{ fill: '#6172f3' }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
                <Bar dataKey="value" fill="#6172f3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <YAxis fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analytics.priorityData.map((entry, index) => (
                    <Bar key={`cell-${index}`} dataKey="value" fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function calculateAvgCompletionTime(tasks: Task[]): string {
  const completedTasks = tasks.filter((t) => t.status === 'Done' && t.createdAt && t.completedAt);
  
  if (completedTasks.length === 0) return 'N/A';

  const totalHours = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt!);
    const completed = new Date(task.completedAt!);
    const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  const avgHours = totalHours / completedTasks.length;
  
  if (avgHours < 24) {
    return `${Math.round(avgHours)}h`;
  } else {
    return `${Math.round(avgHours / 24)}d`;
  }
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
