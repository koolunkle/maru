import { addKstDays, kstWeekStart } from './date';

type StreakProfile = { streak: number; last_attended: string | null; rest_used_week: string | null };

/**
 * 지금 이어지고 있는 연속 출석 일수(PRD F5).
 * 서버는 미션을 완료할 때만 streak를 다시 계산하므로, 그 사이에 끊긴 경우를 홈에서 반영한다(#18).
 * 규칙은 서버 finish_verification과 같다: 오늘·어제 출석이면 이어짐, 그저께 출석이고 이번 주 쉼표를 안 썼으면 이어짐.
 */
export function currentStreak(profile: StreakProfile, today: string) {
  const last = profile.last_attended;
  if (!last || profile.streak <= 0) return 0;
  if (last === today || last === addKstDays(today, -1)) return profile.streak;
  if (last === addKstDays(today, -2) && profile.rest_used_week !== kstWeekStart(today)) return profile.streak;
  return 0;
}
