export function getMoodEmoji(value: number): string {
  if (value <= 2) return '😞';
  if (value <= 4) return '😕';
  if (value <= 6) return '😐';
  if (value <= 8) return '🙂';
  return '😄';
}

export function getEnergyEmoji(value: number): string {
  if (value <= 2) return '🪫';
  if (value <= 4) return '🔋';
  if (value <= 6) return '⚡';
  if (value <= 8) return '🚀';
  return '🔥';
}

export function getFocusEmoji(value: number): string {
  if (value <= 2) return '😵';
  if (value <= 4) return '🫥';
  if (value <= 6) return '🎯';
  if (value <= 8) return '🧠';
  return '🔎';
}
