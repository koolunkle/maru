import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getRewardProgress } from '@/lib/room';

type RewardData = Awaited<ReturnType<typeof getRewardProgress>>;

/** 홈 미션 카드의 다음 보상 표시(spec personalization)에 쓸 가구·보유·카테고리별 완료 수. 실패하면 null로 두고 배지를 숨긴다 */
export function useRewardProgress(userId: string | undefined) {
  const [data, setData] = useState<RewardData | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      getRewardProgress(userId).then(
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
