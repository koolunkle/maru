export type RewardFurniture = { id: string; name: string; unlock_rule: unknown; sort: number };

export type RewardProgress = {
  /** 이미 가진 가구 id */
  owned: ReadonlySet<string>;
  /** 카테고리별 완료한 미션 수 */
  completedByCategory: Readonly<Record<string, number>>;
  /** 지금 이어지는 연속 출석 일수 (utils/streak currentStreak) */
  streak: number;
  /** 오늘 이미 출석했으면 이 미션을 해도 연속 일수가 늘지 않는다 */
  attendedToday: boolean;
};

type Rule =
  | { type: 'first_mission' }
  | { type: 'streak'; days: number }
  | { type: 'category_count'; category: string; count: number }
  | { type: 'first_weekly' }
  | { type: 'event_mission' };

/**
 * 이 미션을 하면 가까워지는 미획득 가구 중 가장 가까운 것 하나 (PRD F8 reward-badge).
 * 조건은 서버 finish_verification의 가구 지급 규칙과 같다. 남은 횟수가 같으면 가구 순서(sort)가 앞선 것.
 */
export function nextReward(
  mission: { category: string; event_id: string | null },
  type: 'daily' | 'weekly',
  furniture: readonly RewardFurniture[],
  progress: RewardProgress,
): string | null {
  let best: { left: number; sort: number; text: string } | null = null;
  for (const f of furniture) {
    if (progress.owned.has(f.id)) continue;
    const rule = f.unlock_rule as Rule;
    let left: number | null = null;
    let unit = '';
    switch (rule.type) {
      case 'first_mission':
        left = 1;
        break;
      case 'first_weekly':
        if (type === 'weekly') left = 1;
        break;
      case 'event_mission':
        if (mission.event_id) left = 1;
        break;
      case 'category_count':
        if (mission.category === rule.category) {
          left = rule.count - (progress.completedByCategory[rule.category] ?? 0);
          unit = '번 더 하면';
        }
        break;
      case 'streak':
        if (!progress.attendedToday) {
          left = rule.days - progress.streak;
          unit = '일 이어 가면';
        }
        break;
    }
    if (left === null || left < 1) continue;
    const text = left === 1 ? `완료하면 ${f.name}` : `${left}${unit} ${f.name}`;
    if (!best || left < best.left || (left === best.left && f.sort < best.sort)) best = { left, sort: f.sort, text };
  }
  return best?.text ?? null;
}
