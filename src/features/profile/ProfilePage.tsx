import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { profileService } from '@/services/endpoints/profileService';
import { useAuthStore } from '@/app/store/authStore';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

const TIME_OPTIONS: Profile['availableTime'][] = ['Low', 'Medium', 'High'];

export function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [goals, setGoals] = useState('');
  const [availableTime, setAvailableTime] = useState<Profile['availableTime']>('Medium');

  useEffect(() => {
    profileService.getProfile()
      .then((res) => {
        if (res.data) {
          setName(res.data.name || authUser?.name || '');
          setEmail(res.data.email || authUser?.email || '');
          setRole(res.data.role || '');
          setGoals(res.data.goals || '');
          setAvailableTime(res.data.availableTime || 'Medium');
        } else {
          setName(authUser?.name || '');
          setEmail(authUser?.email || '');
        }
      })
      .catch(() => {
        setName(authUser?.name || '');
        setEmail(authUser?.email || '');
      })
      .finally(() => setLoading(false));
  }, [authUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.saveProfile({ name, email, role, goals, availableTime });
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 w-full max-w-2xl"
    >
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>Profile</h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your personal info and preferences
        </p>
      </div>

      {/* Avatar + Name header */}
      <Card className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shrink-0"
          style={{ backgroundColor: 'var(--primary-600)' }}
        >
          {name ? name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="min-w-0">
          <p className="text-body font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {name || 'No name set'}
          </p>
          <p className="text-caption truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {email}
          </p>
        </div>
      </Card>

      {/* Profile form */}
      <Card className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input-base text-body"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-base text-body"
            disabled
          />
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Email is linked to your login account
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Role / Occupation</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer, Student, Designer"
            className="input-base text-body"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Goals</label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What are you working towards?"
            className="input-base min-h-[80px] resize-y text-body"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
            Daily Available Time
          </label>
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Used by the AI to determine how many tasks to suggest each day
          </p>
          <div className="flex gap-2 pt-1">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setAvailableTime(opt)}
                className="flex-1 py-2.5 rounded-md text-body font-medium transition-colors"
                style={{
                  backgroundColor: availableTime === opt ? 'var(--primary-600)' : 'var(--color-muted)',
                  color: availableTime === opt ? '#fff' : 'var(--color-text)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} isLoading={saving} className="w-full">
          Save Profile
        </Button>
      </Card>

      {/* Logout */}
      <Card>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-md text-body font-medium transition-colors"
          style={{ color: 'var(--accent-danger-500)' }}
        >
          Sign Out
        </button>
      </Card>
    </motion.div>
  );
}
