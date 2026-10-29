import { kstDate, kstWeekStart } from './date';

/** 편지 목록에 보일 이번 주와 지난 3주 (저장된 편지 주차는 함수 목록과 합친다) */
export function letterWeeks(today: string = kstDate()) {
  const start = Date.parse(`${kstWeekStart(today)}T00:00:00Z`);
  return Array.from({ length: 4 }, (_, index) =>
    new Date(start - index * 7 * 86_400_000).toISOString().slice(0, 10),
  );
}

export function formatLetterWeek(week: string) {
  const end = new Date(Date.parse(`${week}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10);
  return `${week.replaceAll('-', '.')} – ${end.replaceAll('-', '.')}`;
}
