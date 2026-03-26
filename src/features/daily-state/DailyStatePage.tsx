import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { dailyStateService } from '@/services/endpoints/dailyStateService';
import { today } from '@/utils/date';
import toast from 'react-hot-toast';

export function DailyStatePage() {
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [focus, setFocus] = useState(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dailyStateService.save({
        date: today(),
        energy,
        mood,
        focus,
        notes: notes || undefined,
      });
      toast.success('Daily state saved');
    } catch {
      toast.error('Failed to save. Backend may not be connected.');
    } finally {
      setSaving(false);
    }
  };

  const sliders = [
    { label: 'Energy', value: energy, set: setEnergy, emoji: '⚡', color: 'accent-warning-500' },
    { label: 'Mood', value: mood, set: setMood, emoji: '😊', color: 'accent-success-500' },
    { label: 'Focus', value: focus, set: setFocus, emoji: '🎯', color: 'accent-primary-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-2xl">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-neutral-50">Daily State</h1>
        <p className="text-body text-neutral-500 mt-1">How are you feeling today?</p>
      </div>

      <Card className="space-y-6">
        {sliders.map((s) => (
          <div key={s.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-body font-medium text-neutral-700 dark:text-neutral-300">
                {s.emoji} {s.label}
              </label>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20 text-body font-bold text-primary-600">
                {s.value}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={s.value}
              onChange={(e) => s.set(Number(e.target.value))}
              className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-caption text-neutral-400">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-body font-medium text-neutral-700 dark:text-neutral-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any thoughts about today..."
            className="input-base min-h-[80px] resize-y"
          />
        </div>

        <Button onClick={handleSave} isLoading={saving} className="w-full">
          Save Daily State
        </Button>
      </Card>
    </motion.div>
  );
}
