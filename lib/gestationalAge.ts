export function calculateGestationalAge(lastMenstrualPeriod: string): number {
  const lmp = new Date(lastMenstrualPeriod);
  const today = new Date();

  const diffTime = today.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const weeks = Math.floor(diffDays / 7);

  return Math.max(0, weeks);
}

export function calculateEstimatedDueDate(lastMenstrualPeriod: string): string {
  const lmp = new Date(lastMenstrualPeriod);

  const edd = new Date(lmp);
  edd.setDate(edd.getDate() + 280);

  return edd.toISOString().split('T')[0];
}

export function formatGestationalAge(lastMenstrualPeriod: string): { weeks: number; days: number } {
  const lmp = new Date(lastMenstrualPeriod);
  const today = new Date();

  const diffTime = today.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;

  return {
    weeks: Math.max(0, weeks),
    days: Math.max(0, days),
  };
}