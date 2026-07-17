export const DOMAIN_OPTIONS = [
  'Work',
  'Personal',
  'Health',
  'Finance',
  'Learning',
  'Apps',
  'Social',
  'Creative',
  'Home',
] as const;

export function splitDomains(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean);
}

export function joinDomains(domains: string[]): string {
  return Array.from(new Set(domains.map((domain) => domain.trim()).filter(Boolean))).join(', ');
}
