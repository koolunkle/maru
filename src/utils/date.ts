const KstOffsetMs = 9 * 60 * 60 * 1000;

/** KST(Asia/Seoul, DST 없음) 기준 'YYYY-MM-DD' */
export function kstDate(date: Date = new Date()) {
  return new Date(date.getTime() + KstOffsetMs).toISOString().slice(0, 10);
}

/** 한국 날짜가 속한 주의 월요일 'YYYY-MM-DD'. */
export function kstWeekStart(today: string = kstDate()) {
  const date = new Date(`${today}T00:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
}

/** KST 기준 해당 날짜 23:59:59.999 의 UTC Date (PRD F3 일일 미션 마감) */
export function kstEndOfDay(date: Date = new Date()) {
  return new Date(Date.parse(`${kstDate(date)}T23:59:59.999+09:00`));
}

/** KST 기준 이번 주 일요일 23:59:59.999 (주 시작 = 월요일, PRD F3 주간 미션 마감) */
export function kstEndOfWeek(date: Date = new Date()) {
  const day = new Date(date.getTime() + KstOffsetMs).getUTCDay(); // 0 = 일요일
  const daysToSunday = (7 - day) % 7;
  return kstEndOfDay(new Date(date.getTime() + daysToSunday * 24 * 60 * 60 * 1000));
}

/** 홈 상단 날짜: "10월 18일 일요일" */
export function formatKstToday(date: Date = new Date()) {
  const kst = new Date(date.getTime() + KstOffsetMs);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][kst.getUTCDay()];
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${weekday}요일`;
}

/** 'YYYY-MM-DD' 두 개 → "11월 2일 ~ 11월 8일", 같은 날이면 "11월 2일" */
export function formatDateRange(start: string, end: string) {
  const label = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`;
  return start === end ? label(start) : `${label(start)} ~ ${label(end)}`;
}

/** 'YYYY-MM-DD' → "10월 26일 (월)" */
export function formatDayWithWeekday(day: string) {
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${formatDateRange(day, day)} (${weekday})`;
}

/** 'YYYY-MM-DD'에서 n일 이동 */
export function addKstDays(day: string, n: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' 두 날짜 사이 일수(to - from) */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** 행사 마감 안내: 오늘 끝나면 "오늘 끝나요", 일주일 안이면 "N일 뒤 끝나요", 그 밖은 null (#21) */
export function endingNotice(endDate: string, today: string = kstDate()) {
  const left = daysBetween(today, endDate);
  if (left === 0) return '오늘 끝나요';
  if (left > 0 && left <= 6) return `${left}일 뒤 끝나요`;
  return null;
}
