import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { profileService } from '@/services/endpoints/profileService';
import { useAuthStore } from '@/app/store/authStore';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
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
  });

  useEffect(() => {
    profileService.getProfile()
      .then((res) => {
        if (res.data) {
          setProfile((prev) => ({ ...prev, ...res.data, name: res.data.name || authUser?.name || '' }));
        } else {
          setProfile((prev) => ({ ...prev, name: authUser?.name || '' }));
        }
      })
      .catch(() => {
        setProfile((prev) => ({ ...prev, name: authUser?.name || '' }));
      })
      .finally(() => setLoading(false));
  }, [authUser]);

  const update = (field: keyof Profile, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.saveProfile(profile);
      toast.success('Profile saved');
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
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
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="min-w-0">
          <p className="text-body font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {profile.name || 'No name set'}
          </p>
          <p className="text-caption truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {profile.workType || 'No work type set'}
          </p>
        </div>
      </Card>

      {/* Personal Info */}
      <Card className="space-y-5">
        <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Personal Information</h2>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Your name"
            className="input-base text-body"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Age</label>
            <input
              type="text"
              value={profile.age}
              onChange={(e) => update('age', e.target.value)}
              placeholder="e.g. 28"
              className="input-base text-body"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Date of Birth</label>
            <input
              type="date"
              value={profile.dob}
              onChange={(e) => update('dob', e.target.value)}
              className="input-base text-body"
            />
          </div>
        </div>
      </Card>

      {/* Work & Routine */}
      <Card className="space-y-5">
        <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Work &amp; Routine</h2>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Work Type</label>
          <select
            value={profile.workType}
            onChange={(e) => update('workType', e.target.value)}
            className="input-base text-body"
          >
            <option value="">Select work type</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Freelance">Freelance</option>
            <option value="Student">Student</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Routine Type</label>
          <select
            value={profile.routineType}
            onChange={(e) => update('routineType', e.target.value)}
            className="input-base text-body"
          >
            <option value="">Select routine type</option>
            <option value="Morning Person">Morning Person</option>
            <option value="Night Owl">Night Owl</option>
            <option value="Flexible">Flexible</option>
            <option value="Shift-Based">Shift-Based</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Commute Time</label>
          <input
            type="text"
            value={profile.commuteTime}
            onChange={(e) => update('commuteTime', e.target.value)}
            placeholder="e.g. 30 mins, 1 hour, Remote"
            className="input-base text-body"
          />
        </div>

      </Card>

      {/* Health & Status */}
      <Card className="space-y-5">
        <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Status</h2>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Financial Status</label>
          <select
            value={profile.financialStatus}
            onChange={(e) => update('financialStatus', e.target.value)}
            className="input-base text-body"
          >
            <option value="">Select status</option>
            <option value="Stable">Stable</option>
            <option value="Growing">Growing</option>
            <option value="Tight">Tight</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Health Status</label>
          <select
            value={profile.healthStatus}
            onChange={(e) => update('healthStatus', e.target.value)}
            className="input-base text-body"
          >
            <option value="">Select status</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </Card>

      {/* Notes & Preferences */}
      <Card className="space-y-5">
        <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>Preferences</h2>

        <div className="space-y-1.5">
          <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>Custom Notes</label>
          <textarea
            value={profile.customNotes}
            onChange={(e) => update('customNotes', e.target.value)}
            placeholder="Anything the AI should know about you…"
            className="input-base min-h-[80px] resize-y text-body"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.usePersonalData}
            onChange={(e) => update('usePersonalData', e.target.checked)}
            className="h-5 w-5 rounded accent-primary-600"
          />
          <div>
            <span className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
              Use personal data for AI suggestions
            </span>
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              Allow the system to use your profile data to personalize task recommendations
            </p>
          </div>
        </label>

        <Button onClick={handleSave} isLoading={saving} className="w-full">
          Save Profile
        </Button>
      </Card>

      {/* Logout */}
      <Card>
        <button
          onClick={clearAuth}
          className="w-full py-2.5 rounded-md text-body font-medium transition-colors"
          style={{ color: 'var(--accent-danger-500)' }}
        >
          Sign Out
        </button>
      </Card>
    </motion.div>
  );
}
