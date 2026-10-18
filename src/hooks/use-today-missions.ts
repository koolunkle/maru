import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import type { Tables } from '@/types/database';
import { kstDate, kstEndOfWeek } from '@/utils/date';
import { pickSeedMissions } from '@/utils/pick-seed-missions';

type Mission = Tables<'missions'>;
type Profile = Tables<'profiles'>;

type TodayMissions = {
  daily: Mission[];
  weekly: Mission | null;
  /** 'ai' = daily_recommendations 결과, 'seed' = 규칙 기반 대체 */
  source: 'ai' | 'seed';
};

async function fetchTodayMissions(profile: Profile): Promise<TodayMissions> {
  const today = kstDate();
  const { data: rec, error: recError } = await supabase
    .from('daily_recommendations')
    .select('daily_mission_ids, weekly_mission_id')
    .eq('user_id', profile.id)
    .eq('rec_date', today)
    .maybeSingle();
  if (recError) throw recError;

  if (rec) {
    const ids = [...rec.daily_mission_ids, ...(rec.weekly_mission_id ? [rec.weekly_mission_id] : [])];
    const { data: missions, error } = await supabase.from('missions').select('*').in('id', ids);
    if (error) throw error;
    const byId = new Map(missions.map((m) => [m.id, m]));
    return {
      daily: rec.daily_mission_ids.flatMap((id) => byId.get(id) ?? []),
      weekly: (rec.weekly_mission_id && byId.get(rec.weekly_mission_id)) || null,
      source: 'ai',
    };
  }

  const { data: seeds, error } = await supabase.from('missions').select('*').eq('source', 'seed');
  if (error) throw error;
  return { ...pickSeedMissions(seeds, profile, today, kstDate(kstEndOfWeek())), source: 'seed' };
}

/** S3 홈: 오늘의 일일 3개 + 주간 1개 (PRD F2) */
export function useTodayMissions() {
  const { profile } = useSession();
  const [data, setData] = useState<TodayMissions | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    fetchTodayMissions(profile).then(
      (result) => active && setData(result),
      (e: unknown) => active && setError(e instanceof Error ? e : new Error(String(e))),
    );
    return () => {
      active = false;
    };
  }, [profile, attempt]);

  const reload = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, error, reload };
}
