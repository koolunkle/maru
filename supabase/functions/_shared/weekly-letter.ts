import { weekStart } from './kst.ts';

export function validLetterWeek(week: unknown, today: string): week is string {
  return typeof week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(week) &&
    Number.isFinite(Date.parse(`${week}T00:00:00Z`)) &&
    new Date(`${week}T00:00:00Z`).toISOString().slice(0, 10) === week &&
    weekStart(week) === week && week <= weekStart(today);
}

export function reuseLetter(existing: { source: string; finalized: boolean; input_hash: string } | null, hash: string, past: boolean) {
  return !!existing && existing.source === 'ai' && (existing.finalized || (existing.input_hash === hash && !past));
}
