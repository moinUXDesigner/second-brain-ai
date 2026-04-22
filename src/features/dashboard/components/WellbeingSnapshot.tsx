import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { today } from '@/utils/date';
import { getEnergyEmoji, getFocusEmoji, getMoodEmoji } from '@/utils/wellbeing';

type Snapshot = {
  energy: number;
  mood: number;
  focus: number;
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
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-muted)' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>
            {value}/10
          </p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: 'var(--color-surface)' }}
          aria-label={`${label} emoji ${emoji}`}
        >
          {emoji}
        </div>
      </div>
    </div>
  );
}

export function WellbeingSnapshot() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dailyStateService
      .get(today())
      .then((res) => {
        if (res.data) {
          setState({
            energy: res.data.energy || 5,
            mood: res.data.mood || 5,
            focus: res.data.focus || 5,
          });
        } else {
          setState({ energy: 5, mood: 5, focus: 5 });
        }
      })
      .catch(() => {
        setState({ energy: 5, mood: 5, focus: 5 });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Today&apos;s State</CardTitle>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Mood, Energy, and Focus based on today&apos;s saved daily state
          </p>
        </div>
      </CardHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ backgroundColor: 'var(--color-muted)' }}>
              <div className="h-4 w-20 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
              <div className="mt-3 h-8 w-16 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>
      ) : state ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No daily state found yet.
        </div>
      )}
    </Card>
  );
}
