import { FEATURE_FLAGS } from '@/constants';

type FeatureFlag = keyof typeof FEATURE_FLAGS;

const overrides: Partial<Record<FeatureFlag, boolean>> = {};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (flag in overrides) return overrides[flag]!;
  return FEATURE_FLAGS[flag] ?? false;
}

export function setFeatureOverride(flag: FeatureFlag, value: boolean) {
  overrides[flag] = value;
}
