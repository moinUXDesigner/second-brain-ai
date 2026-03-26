import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useTaskStore } from '@/app/store/taskStore';

export function AnalyticsPage() {
  const { tasks } = useTaskStore();

  // Mock weekly data from tasks
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = days.map((day, i) => ({
    day,
    completed: Math.max(0, tasks.filter((t) => t.status === 'Done').length - i),
    created: Math.max(0, tasks.length - i),
  }));

  const productivityData = days.map((day, i) => ({
    day,
    score: 60 + Math.round(Math.random() * 30),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Analytics</h1>
        <p className="text-body text-neutral-500 mt-1">Track your productivity trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Activity</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" fontSize={12} tick={{ fill: '#6b7280' }} />
                <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="#dcfce7" />
                <Area type="monotone" dataKey="created" stroke="#6172f3" fill="#e0e9ff" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Score</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" fontSize={12} tick={{ fill: '#6b7280' }} />
                <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6172f3" strokeWidth={2} dot={{ fill: '#6172f3' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
