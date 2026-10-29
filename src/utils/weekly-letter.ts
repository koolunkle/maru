import { kstDate, kstWeekStart } from './date';

/** 실제 편지 보관 이력이 아닌, 이번 주와 지난 3주의 시연용 주차. */
export function demoLetterWeeks(today: string = kstDate()) {
  const start = Date.parse(`${kstWeekStart(today)}T00:00:00Z`);
  return Array.from({ length: 4 }, (_, index) =>
    new Date(start - index * 7 * 86_400_000).toISOString().slice(0, 10),
  );
}

export function formatLetterWeek(week: string) {
  const end = new Date(Date.parse(`${week}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10);
  return `${week.replaceAll('-', '.')} – ${end.replaceAll('-', '.')}`;
}
