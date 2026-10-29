import { useCallback, useEffect, useRef, useState } from 'react';

import { FunctionError, Functions, type JudgedBy } from '@/lib/functions';
import { createMailboxRequestId } from '@/lib/mailbox';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import type { Tables } from '@/types/database';
import { kstDate, kstEndOfWeek } from '@/utils/date';
import { pickSeedMissions } from '@/utils/pick-seed-missions';

type Mission = Tables<'missions'>;
type Profile = Tables<'profiles'>;
type UserMission = Tables<'user_missions'>;

type TodayMissions = {
  daily: Mission[];
  weekly: Mission | null;
  /** 'ai' = AI 추천, 'rule' = 시드 규칙 기반 (서버 대체 또는 함수 호출 실패 시 앱 대체) */
  source: JudgedBy;
  /** mission_id → 진행 중이거나 완료한 user_mission */
  progress: Record<string, UserMission>;
};

async function fetchSeedMissions(profile: Profile) {
  const { data: seeds, error } = await supabase.from('missions').select('*').eq('source', 'seed');
  if (error) throw error;
  return pickSeedMissions(seeds, profile, kstDate(), kstDate(kstEndOfWeek()));
}

/** 오늘 시작했거나 아직 진행 중인 미션 (주간 미션은 날이 바뀌어도 이어진다) */
async function fetchProgress(profileId: string) {
  const { data, error } = await supabase
    .from('user_missions')
    .select('*, missions(*)')
    .eq('user_id', profileId)
    .or(`status.in.(in_progress,judging),started_at.gte.${kstDate()}T00:00:00+09:00`)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function fetchToday(profile: Profile, refresh: boolean, requestId?: string): Promise<TodayMissions> {
  const progressRows = await fetchProgress(profile.id);
  let picked: { daily: Mission[]; weekly: Mission | null };
  let source: JudgedBy;
  try {
    ({ source, ...picked } = await Functions.recommendMissions(refresh, requestId));
  } catch (e) {
    if (refresh) throw e;
    picked = await fetchSeedMissions(profile);
    source = 'rule';
  }

  // 진행 중인 주간 미션이 있으면 새 추천 대신 그것을 보여 준다
  const activeWeekly = progressRows.find((um) => um.type === 'weekly' && um.status !== 'expired');
  return {
    daily: picked.daily,
    weekly: activeWeekly?.missions ?? picked.weekly,
    source,
    progress: Object.fromEntries(progressRows.map(({ missions: _m, ...um }) => [um.mission_id, um])),
  };
}

/** S3 홈: 오늘의 일일 3개 + 주간 1개 (PRD F2) */
export function useTodayMissions() {
  const { profile } = useSession();
  const [data, setData] = useState<TodayMissions | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshRequest = useRef<string | null>(null);
  const refreshWorking = useRef(false);
  // 프로필 객체는 출석 갱신 등으로 자주 바뀌므로, 재조회는 사용자(id)가 바뀔 때와 reload 때만 한다.
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  });
  const profileId = profile?.id;

  useEffect(() => { refreshRequest.current = null; }, [profileId]);

  useEffect(() => {
    const current = profileRef.current;
    if (!profileId || !current) return;
    let active = true;
    fetchToday(current, false).then(
      (result) => active && setData(result),
      (e: unknown) => active && setError(e instanceof Error ? e : new Error(String(e))),
    );
    return () => {
      active = false;
    };
  }, [profileId, attempt]);

  const reload = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  /** '다른 미션 보기' — 하루 1회. 이미 썼으면 'refresh_limit' */
  const refresh = useCallback(async (): Promise<'ok' | 'limit' | 'failed'> => {
    if (!profile || refreshWorking.current) return 'failed';
    refreshWorking.current = true;
    refreshRequest.current ??= createMailboxRequestId();
    setRefreshing(true);
    try {
      setData(await fetchToday(profile, true, refreshRequest.current));
      refreshRequest.current = null;
      return 'ok';
    } catch (e) {
      if (e instanceof FunctionError && e.code === 'refresh_limit') { refreshRequest.current = null; return 'limit'; }
      return 'failed';
    } finally {
      setRefreshing(false);
      refreshWorking.current = false;
    }
  }, [profile]);

  return { data, error, reload, refresh, refreshing };
}
