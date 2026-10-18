const KstOffsetMs = 9 * 60 * 60 * 1000;

/** KST(Asia/Seoul, DST 없음) 기준 'YYYY-MM-DD' */
export function kstDate(date: Date = new Date()) {
  return new Date(date.getTime() + KstOffsetMs).toISOString().slice(0, 10);
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
