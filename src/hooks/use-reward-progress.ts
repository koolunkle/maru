import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { RewardFurniture } from '@/utils/next-reward';

export type RewardData = {
  furniture: RewardFurniture[];
  owned: Set<string>;
  completedByCategory: Record<string, number>;
};

async function fetchRewardData(userId: string): Promise<RewardData> {
  const [furniture, owned, completed] = await Promise.all([
    supabase.from('furniture').select('id, name, unlock_rule, sort').order('sort'),
    supabase.from('user_furniture').select('furniture_id').eq('user_id', userId),
    supabase.from('user_missions').select('missions!inner(category)').eq('user_id', userId).eq('status', 'completed'),
  ]);
  if (furniture.error) throw furniture.error;
  if (owned.error) throw owned.error;
  if (completed.error) throw completed.error;
  const completedByCategory: Record<string, number> = {};
  for (const row of completed.data) {
    const category = row.missions.category;
    completedByCategory[category] = (completedByCategory[category] ?? 0) + 1;
  }
  return {
    furniture: furniture.data,
    owned: new Set(owned.data.map((row) => row.furniture_id)),
    completedByCategory,
  };
}

/** 홈 미션 카드의 다음 보상 표시(PRD F8)에 쓸 가구·보유·카테고리별 완료 수. 실패하면 null로 두고 배지를 숨긴다 */
export function useRewardProgress(userId: string | undefined) {
  const [data, setData] = useState<RewardData | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      fetchRewardData(userId).then(
        (next) => active && setData(next),
        () => {},
      );
      return () => {
        active = false;
      };
    }, [userId]),
  );
  return data;
}
