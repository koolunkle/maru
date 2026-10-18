const KstOffsetMs = 9 * 60 * 60 * 1000;
const DayMs = 24 * 60 * 60 * 1000;

/** KST 'YYYY-MM-DD' */
export function kstDate(date: Date = new Date()) {
  return new Date(date.getTime() + KstOffsetMs).toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' 기준 n일 이동 */
export function addDays(day: string, n: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DayMs).toISOString().slice(0, 10);
}

/** 해당 날짜가 속한 주의 월요일 (PRD: 주 시작 = 월요일) */
export function weekStart(day: string) {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = 일
  return addDays(day, -((dow + 6) % 7));
}
