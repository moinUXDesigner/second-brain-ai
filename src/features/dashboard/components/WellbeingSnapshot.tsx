import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { formatDateTime, today } from '@/utils/date';
import { getEnergyEmoji, getFocusEmoji, getMoodEmoji } from '@/utils/wellbeing';

type Snapshot = {
  energy: number;
  mood: number;
  focus: number;
  updatedAt: string;
};

const DEFAULT_SNAPSHOT: Snapshot = {
  energy: 5,
  mood: 5,
  focus: 5,
  updatedAt: '',
};

function MetricCard({
  label,
  value,
  emoji,
  accent,
}: {
  label: string;
  value: number;
  emoji: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg p-2.5 md:p-3 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
      <div className="text-lg md:text-2xl mb-1">{emoji}</div>
      <div className="text-lg md:text-2xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[10px] md:text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

export function WellbeingSnapshot() {
  const [currentDate, setCurrentDate] = useState(today());
  const [state, setState] = useState<Snapshot>(DEFAULT_SNAPSHOT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextDate = today();
      setCurrentDate((prev) => (prev === nextDate ? prev : nextDate));
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    dailyStateService
      .get(currentDate)
      .then((res) => {
        if (!active) return;

        if (res.data) {
          setState({
            energy: res.data.energy || 5,
            mood: res.data.mood || 5,
            focus: res.data.focus || 5,
            updatedAt: res.data.updatedAt || '',
          });
        } else {
          setState(DEFAULT_SNAPSHOT);
        }
      })
      .catch(() => {
        if (active) setState(DEFAULT_SNAPSHOT);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentDate]);

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Today&apos;s State</CardTitle>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Your current mood, energy, and focus levels
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {state.updatedAt ? `Last updated ${formatDateTime(state.updatedAt)}` : 'Not updated today'}
          </p>
        </div>
      </CardHeader>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 md:gap-4 px-4 pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg p-2.5 md:p-3 animate-pulse" style={{ backgroundColor: 'var(--color-muted)' }}>
              <div className="h-6 w-8 rounded mx-auto mb-1" style={{ backgroundColor: 'var(--color-surface)' }} />
              <div className="h-6 w-12 rounded mx-auto mb-1" style={{ backgroundColor: 'var(--color-surface)' }} />
              <div className="h-3 w-10 rounded mx-auto" style={{ backgroundColor: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:gap-4 px-4 pb-4">
          <MetricCard
            label="Mood"
            value={state.mood}
            emoji={getMoodEmoji(state.mood)}
            accent="var(--warning-600, #d97706)"
          />
          <MetricCard
            label="Energy"
            value={state.energy}
            emoji={getEnergyEmoji(state.energy)}
            accent="var(--success-600, #16a34a)"
          />
          <MetricCard
            label="Focus"
            value={state.focus}
            emoji={getFocusEmoji(state.focus)}
            accent="var(--primary-600)"
          />
        </div>
      )}
    </Card>
  );
}
