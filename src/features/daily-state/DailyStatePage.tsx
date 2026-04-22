import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { today } from '@/utils/date';
import { getEnergyEmoji, getFocusEmoji, getMoodEmoji } from '@/utils/wellbeing';
import toast from 'react-hot-toast';

const TIME_PRESETS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '2h', mins: 120 },
  { label: '3h', mins: 180 },
  { label: '4h', mins: 240 },
  { label: '6h', mins: 360 },
  { label: '8h', mins: 480 },
];

function formatTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DailyStatePage() {
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [focus, setFocus] = useState(5);
  const [availableTime, setAvailableTime] = useState(120);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dailyStateService
      .get(today())
      .then((res) => {
        if (res.data) {
          setEnergy(res.data.energy || 5);
          setMood(res.data.mood || 5);
          setFocus(res.data.focus || 5);
          setAvailableTime(res.data.availableTime || 120);
          setNotes(res.data.notes || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dailyStateService.save({
        date: today(),
        energy,
        mood,
        focus,
        availableTime,
        notes: notes || undefined,
      });
      toast.success('Daily state saved');
    } catch {
      toast.error('Failed to save. Backend may not be connected.');
    } finally {
      setSaving(false);
    }
  };

  const adjustTime = (delta: number) => {
    setAvailableTime((prev) => Math.max(15, Math.min(720, prev + delta)));
  };

  const sliders = [
    { label: 'Energy', value: energy, set: setEnergy, emoji: getEnergyEmoji(energy) },
    { label: 'Mood', value: mood, set: setMood, emoji: getMoodEmoji(mood) },
    { label: 'Focus', value: focus, set: setFocus, emoji: getFocusEmoji(focus) },
  ];

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-2xl">
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>
          Daily State
        </h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          How are you feeling today?
        </p>
      </div>

      <Card className="space-y-6">
        {sliders.map((s) => (
          <div key={s.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                {s.emoji} {s.label}
              </label>
              <span
                className="flex h-8 min-w-[56px] items-center justify-center rounded-full px-2 text-body font-bold"
                style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
              >
                {s.value}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ backgroundColor: 'var(--color-muted)' }}
            />
            <div className="flex justify-between text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
            Time Available Today
          </h2>
          <p className="text-caption mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            How much time can you dedicate to tasks? The AI will pick tasks that fit your schedule.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          <button
            onClick={() => adjustTime(-15)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-colors"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
          >
            -
          </button>
          <span
            className="min-w-[120px] text-center text-2xl font-bold tabular-nums"
            style={{ color: 'var(--primary-600)' }}
          >
            {formatTime(availableTime)}
          </span>
          <button
            onClick={() => adjustTime(15)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-colors"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text)' }}
          >
            +
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.mins}
              onClick={() => setAvailableTime(p.mins)}
              className="px-3.5 py-1.5 rounded-full text-small font-medium transition-colors"
              style={{
                backgroundColor: availableTime === p.mins ? 'var(--primary-600)' : 'var(--color-muted)',
                color: availableTime === p.mins ? '#fff' : 'var(--color-text)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any thoughts about today..."
          className="input-base min-h-[80px] resize-y text-body"
        />
      </Card>

      <Button onClick={handleSave} isLoading={saving} className="w-full">
        Save Daily State
      </Button>
    </motion.div>
  );
}
