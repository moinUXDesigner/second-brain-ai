import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { formatDateTime, today } from '@/utils/date';
import { getEnergyEmoji, getFocusEmoji, getMoodEmoji } from '@/utils/wellbeing';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(today());
  const [state, setState] = useState<Snapshot>(DEFAULT_SNAPSHOT);
  const [hasTodayState, setHasTodayState] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');
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

    async function loadSnapshot() {
      try {
        const res = await dailyStateService.get(currentDate);
        if (!active) return;

        if (res.data) {
          setState({
            energy: res.data.energy || 5,
            mood: res.data.mood || 5,
            focus: res.data.focus || 5,
            updatedAt: res.data.updatedAt || '',
          });
          setHasTodayState(true);
          setLastUpdatedAt(res.data.updatedAt || '');
          return;
        }

        setState(DEFAULT_SNAPSHOT);
        setHasTodayState(false);

        const history = await dailyStateService.history(3650);
        if (!active) return;

        const latest = [...history.data]
          .filter((item) => item.updatedAt)
          .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];

        setLastUpdatedAt(latest?.updatedAt || '');
      } catch {
        if (active) {
          setState(DEFAULT_SNAPSHOT);
          setHasTodayState(false);
          setLastUpdatedAt('');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSnapshot();

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
            {hasTodayState ? 'Your current mood, energy, and focus levels' : "Log today's mood, energy, and focus levels"}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {lastUpdatedAt ? `Last updated ${formatDateTime(lastUpdatedAt)}` : 'No previous state logged'}
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
      ) : hasTodayState ? (
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
      ) : (
        <div className="px-4 pb-4">
          <Button title="Log your state" onClick={() => navigate('/daily-state')}>
            Log your state
          </Button>
        </div>
      )}
    </Card>
  );
}
