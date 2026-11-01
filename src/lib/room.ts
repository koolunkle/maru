import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
import type { RewardFurniture } from '@/utils/next-reward';

/** 완료한 미션 행을 카테고리별 개수로 센다 (가구·벽지 잠금 조건) */
function countByCategory(rows: readonly { missions: { category: string } }[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.missions.category] = (counts[row.missions.category] ?? 0) + 1;
  return counts;
}

/** 내 방(S8): 가구 목록과 내가 가진 가구 */
export async function getRoom(userId: string) {
  const [furniture, owned] = await Promise.all([
    supabase.from('furniture').select('*').order('sort'),
    supabase.from('user_furniture').select('*').eq('user_id', userId),
  ]);
  if (furniture.error) throw furniture.error;
  if (owned.error) throw owned.error;
  return { furniture: furniture.data as Tables<'furniture'>[], owned: owned.data as Tables<'user_furniture'>[] };
}

/**
 * 내 방: 도감 남은 조건·벽지 잠금(카테고리별·주간 완료 수)과 포스터에 적을 마지막 행사 이름.
 * 방 표시에 꼭 필요하지 않아 실패하면 빈 값으로 둔다
 */
export async function getRoomProgress(userId: string) {
  const [done, event] = await Promise.all([
    supabase.from('user_missions').select('type, missions!inner(category)').eq('user_id', userId).eq('status', 'completed'),
    supabase
      .from('user_missions')
      .select('completed_at, missions!inner(event_id, events(title))')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('missions.event_id', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1),
  ]);
  return {
    completedByCategory: countByCategory(done.data ?? []),
    weeklyCount: (done.data ?? []).filter((row) => row.type === 'weekly').length,
    // 행사 이름 앞의 "[기관명]" 말머리는 뗀다
    posterTitle: event.data?.[0]?.missions.events?.title?.replace(/^\s*\[[^\]]*\]\s*/, '') ?? null,
  };
}

/** 홈 미션 카드의 다음 보상 표시(spec personalization): 가구 획득 조건, 가진 가구, 카테고리별 완료 수. 실패하면 오류를 던진다 */
export async function getRewardProgress(userId: string): Promise<{
  furniture: RewardFurniture[];
  owned: Set<string>;
  completedByCategory: Record<string, number>;
}> {
  const [furniture, owned, completed] = await Promise.all([
    supabase.from('furniture').select('id, name, unlock_rule, sort').order('sort'),
    supabase.from('user_furniture').select('furniture_id').eq('user_id', userId),
    supabase.from('user_missions').select('missions!inner(category)').eq('user_id', userId).eq('status', 'completed'),
  ]);
  if (furniture.error) throw furniture.error;
  if (owned.error) throw owned.error;
  if (completed.error) throw completed.error;
  return {
    furniture: furniture.data,
    owned: new Set(owned.data.map((row) => row.furniture_id)),
    completedByCategory: countByCategory(completed.data),
  };
}
