import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { profileService } from '@/services/endpoints/profileService';
import { useAuthStore } from '@/app/store/authStore';
import type { Profile } from '@/types';

const DEFAULT_PROFILE: Profile = {
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
};

const PROFILE_SECTIONS = ['basic', 'finance', 'health'] as const;

type ProfileSection = (typeof PROFILE_SECTIONS)[number];
type ProfileUpdater = (field: keyof Profile, value: string | boolean) => void;

const SECTION_META: Record<ProfileSection, { label: string; eyebrow: string; description: string; path: string }> = {
  basic: {
    label: 'Basic',
    eyebrow: 'Personal profile',
    description: 'Identity, work rhythm, routine, and AI personalization preferences.',
    path: '/profile/basic',
  },
  finance: {
    label: 'Finance',
    eyebrow: 'Finance profile',
    description: 'Financial status context, separate from the structured finance ledger.',
    path: '/profile/finance',
  },
  health: {
    label: 'Health',
    eyebrow: 'Health profile',
    description: 'Health status context, separate from the health overview dashboard.',
    path: '/profile/health',
  },
};

const WORK_TYPES = ['Full-Time', 'Part-Time', 'Freelance', 'Student', 'Unemployed', 'Retired'];
const ROUTINE_TYPES = ['Morning Person', 'Night Owl', 'Flexible', 'Shift-Based'];
const FINANCIAL_STATUSES = ['Stable', 'Growing', 'Tight', 'Critical'];
const HEALTH_STATUSES = ['Excellent', 'Good', 'Fair', 'Poor'];

function isProfileSection(section?: string): section is ProfileSection {
  return PROFILE_SECTIONS.includes(section as ProfileSection);
}

function formatRole(role?: string) {
  return role ? role.replace('_', ' ') : 'user';
}

function formatYear(value?: string) {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.getFullYear().toString();
}

function SectionCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`space-y-5 ${className}`}>
      <div>
        <h2 className="text-body font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </Card>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-base text-body"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-base text-body"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProfileTabs({ activeSection }: { activeSection: ProfileSection }) {
  return (
    <div
      role="tablist"
      aria-label="Profile modules"
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
    >
      {PROFILE_SECTIONS.map((section) => {
        const meta = SECTION_META[section];
        const active = activeSection === section;

        return (
          <Link
            key={section}
            to={meta.path}
            role="tab"
            aria-selected={active}
            className="rounded-2xl border p-4 transition-all"
            style={{
              borderColor: active ? 'var(--primary-500)' : 'var(--color-border)',
              backgroundColor: active ? 'var(--primary-50, #eff6ff)' : 'var(--color-surface)',
              boxShadow: active ? '0 14px 30px rgba(37, 99, 235, 0.14)' : 'none',
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: active ? 'var(--primary-700)' : 'var(--color-text-secondary)' }}
            >
              {meta.eyebrow}
            </span>
            <span className="mt-1 block text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {meta.label}
            </span>
            <span className="mt-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {meta.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ProfileHero({
  name,
  initials,
  workType,
  roleLabel,
}: {
  name: string;
  initials: string;
  workType: string;
  roleLabel: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div
        className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8"
        style={{
          background:
            'linear-gradient(110deg, color-mix(in srgb, var(--primary-100) 76%, white 24%) 0%, var(--color-surface) 48%, color-mix(in srgb, var(--primary-50, #eff6ff) 72%, white 28%) 100%)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-2/5 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--primary-300) 30%, transparent) 0 2px, transparent 2px 14px)',
          }}
        />

        <div className="relative shrink-0">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white text-4xl font-black text-white shadow-xl sm:h-36 sm:w-36"
            style={{ backgroundColor: 'var(--primary-600)' }}
          >
            {initials}
          </div>
          <span className="absolute bottom-4 right-1 h-5 w-5 rounded-full border-4 border-white bg-green-500" />
        </div>

        <div className="relative min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--primary-700)' }}>
            Profile workspace
          </p>
          <h2 className="mt-2 truncate text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text)' }}>
            {name || 'No name set'}
          </h2>
          <p className="mt-1 text-body" style={{ color: 'var(--color-text-secondary)' }}>
            {workType || 'No work type set'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
              style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
            >
              {roleLabel}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Manage Basic, Finance, and Health profile modules
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AccountOverview({
  email,
  roleLabel,
  completion,
  memberSince,
}: {
  email: string;
  roleLabel: string;
  completion: number;
  memberSince: string;
}) {
  return (
    <SectionCard title="Account Overview">
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between gap-4 py-3 first:pt-0" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Email
          </span>
          <span className="truncate text-right text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {email}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Role
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
            style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}
          >
            {roleLabel}
          </span>
        </div>
        <div className="py-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Profile completion
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {completion}%
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
            <div className="h-full rounded-full" style={{ width: `${completion}%`, backgroundColor: 'var(--primary-600)' }} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-3" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Member since
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {memberSince}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

function BasicProfileTab({
  profile,
  update,
  accountOverview,
}: {
  profile: Profile;
  update: ProfileUpdater;
  accountOverview: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <SectionCard title="Personal Information">
          <TextInput
            label="Name"
            value={profile.name}
            onChange={(value) => update('name', value)}
            placeholder="Your name"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label="Age"
              value={profile.age}
              onChange={(value) => update('age', value)}
              placeholder="e.g. 28"
            />
            <TextInput
              label="Date of Birth"
              type="date"
              value={profile.dob}
              onChange={(value) => update('dob', value)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Work & Routine">
          <SelectInput
            label="Work Type"
            value={profile.workType}
            onChange={(value) => update('workType', value)}
            placeholder="Select work type"
            options={WORK_TYPES}
          />
          <SelectInput
            label="Routine Type"
            value={profile.routineType}
            onChange={(value) => update('routineType', value)}
            placeholder="Select routine type"
            options={ROUTINE_TYPES}
          />
          <TextInput
            label="Commute Time"
            value={profile.commuteTime}
            onChange={(value) => update('commuteTime', value)}
            placeholder="e.g. 30 mins, 1 hour, Remote"
          />
        </SectionCard>

        <SectionCard title="AI Preferences" description="These details help personalize task suggestions when enabled.">
          <div className="space-y-1.5">
            <FieldLabel>Custom Notes</FieldLabel>
            <textarea
              value={profile.customNotes}
              onChange={(event) => update('customNotes', event.target.value)}
              placeholder="Anything the AI should know about you..."
              className="input-base min-h-[108px] resize-y text-body"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl p-4" style={{ backgroundColor: 'var(--color-muted)' }}>
            <input
              type="checkbox"
              checked={profile.usePersonalData}
              onChange={(event) => update('usePersonalData', event.target.checked)}
              className="mt-1 h-5 w-5 rounded accent-primary-600"
            />
            <span>
              <span className="text-body font-medium" style={{ color: 'var(--color-text)' }}>
                Use personal data for AI suggestions
              </span>
              <span className="mt-1 block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Allow the system to use profile data to personalize task recommendations.
              </span>
            </span>
          </label>
        </SectionCard>
      </div>

      <div className="space-y-6">
        {accountOverview}
      </div>
    </div>
  );
}

function FinanceProfileTab({
  profile,
  update,
  onOpenLedger,
}: {
  profile: Profile;
  update: ProfileUpdater;
  onOpenLedger: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        title="Finance Profile"
        description="This stores your high-level financial context. Detailed assets, loans, receivables, handloans, and Zakat estimates stay in the Finance ledger."
      >
        <SelectInput
          label="Financial Status"
          value={profile.financialStatus}
          onChange={(value) => update('financialStatus', value)}
          placeholder="Select financial status"
          options={FINANCIAL_STATUSES}
        />

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Current finance profile
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--primary-600)' }}>
            {profile.financialStatus || 'Not set'}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Use this status as context for planning. Ledger totals and Zakat estimates are managed separately.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Finance Ledger Shortcut">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Open the Finance module when you need structured records for assets, loans, receivables, handloans, or estimated Zakat.
        </p>
        <Button variant="secondary" onClick={onOpenLedger} className="w-full">
          Open Finance Ledger
        </Button>
      </SectionCard>
    </div>
  );
}

function HealthProfileTab({
  profile,
  update,
  onOpenHealth,
}: {
  profile: Profile;
  update: ProfileUpdater;
  onOpenHealth: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        title="Health Profile"
        description="This stores your high-level health context. Trends, projects, and tasks stay in the Health overview."
      >
        <SelectInput
          label="Health Status"
          value={profile.healthStatus}
          onChange={(value) => update('healthStatus', value)}
          placeholder="Select health status"
          options={HEALTH_STATUSES}
        />

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-muted)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Current health profile
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--primary-600)' }}>
            {profile.healthStatus || 'Not set'}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Use this status as context for wellbeing. Daily State trends and health tasks are managed separately.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Health Overview Shortcut">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Open the Health module when you want the read-only dashboard built from profile, daily state, projects, and tasks.
        </p>
        <Button variant="secondary" onClick={onOpenHealth} className="w-full">
          Open Health Overview
        </Button>
      </SectionCard>
    </div>
  );
}

function ProfileActions({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancel} disabled={saving} className="w-full sm:w-auto">
        Cancel
      </Button>
      <Button onClick={onSave} isLoading={saving} className="w-full sm:w-auto">
        Save changes
      </Button>
    </Card>
  );
}

export function ProfileModulesPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    let active = true;

    profileService.getProfile()
      .then((res) => {
        if (!active) return;

        const nextProfile = {
          ...DEFAULT_PROFILE,
          ...(res.data ?? {}),
          name: res.data?.name || authUser?.name || '',
        };

        setProfile(nextProfile);
        setSavedProfile(nextProfile);
      })
      .catch(() => {
        if (!active) return;

        const nextProfile = { ...DEFAULT_PROFILE, name: authUser?.name || '' };
        setProfile(nextProfile);
        setSavedProfile(nextProfile);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUser?.name]);

  const activeSection = isProfileSection(section) ? section : null;

  const update = (field: keyof Profile, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const profileCompletion = useMemo(() => {
    const fields = [
      profile.name,
      profile.age,
      profile.dob,
      profile.workType,
      profile.routineType,
      profile.commuteTime,
      profile.financialStatus,
      profile.healthStatus,
      profile.customNotes,
    ];
    const completed = fields.filter((field) => Boolean(String(field ?? '').trim())).length;

    return Math.round((completed / fields.length) * 100);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileService.saveProfile(profile);
      const nextProfile = { ...profile, ...(res.data ?? {}) };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      toast.success('Profile saved');
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (savedProfile) {
      setProfile(savedProfile);
      toast.success('Profile changes reset');
    }
  };

  if (!activeSection) {
    return <Navigate to="/profile/basic" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const displayName = profile.name || authUser?.name || '';
  const initials = displayName.trim().charAt(0).toUpperCase() || '?';
  const roleLabel = formatRole(authUser?.role);
  const accountOverview = (
    <AccountOverview
      email={authUser?.email || 'Not available'}
      roleLabel={roleLabel}
      completion={profileCompletion}
      memberSince={formatYear(authUser?.createdAt)}
    />
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-6">
      <div>
        <h1 className="text-h1" style={{ color: 'var(--color-text)' }}>
          Profile
        </h1>
        <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your personal info and preferences across Basic, Finance, and Health modules.
        </p>
      </div>

      <ProfileHero
        name={displayName}
        initials={initials}
        workType={profile.workType}
        roleLabel={roleLabel}
      />

      <ProfileTabs activeSection={activeSection} />

      {activeSection === 'basic' && (
        <BasicProfileTab profile={profile} update={update} accountOverview={accountOverview} />
      )}

      {activeSection === 'finance' && (
        <FinanceProfileTab
          profile={profile}
          update={update}
          onOpenLedger={() => navigate('/finance')}
        />
      )}

      {activeSection === 'health' && (
        <HealthProfileTab
          profile={profile}
          update={update}
          onOpenHealth={() => navigate('/health')}
        />
      )}

      <ProfileActions saving={saving} onCancel={handleCancel} onSave={handleSave} />

      <Card>
        <button
          type="button"
          onClick={clearAuth}
          className="w-full rounded-md py-2.5 text-body font-medium transition-colors"
          style={{ color: 'var(--accent-danger-500)' }}
        >
          Sign Out
        </button>
      </Card>
    </motion.div>
  );
}
