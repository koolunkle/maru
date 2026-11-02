import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type MissionEvent = Pick<Tables<'events'>, 'title' | 'place' | 'start_date' | 'end_date' | 'url'>;

export type MissionDetail = {
  mission: Tables<'missions'> & { event: MissionEvent | null };
  mine: Tables<'user_missions'> | null;
  joined: boolean;
  participants: number;
  nicknames: string[];
  relays: string[] | null;
  ownRelay: Pick<Tables<'relay_messages'>, 'id' | 'status'> | null;
};

/** S4 미션 상세: 미션·행사, 내 진행, 같이 할래요, 릴레이 */
export async function getMissionDetail(missionId: string, userId: string): Promise<MissionDetail> {
  const [mission, mine, joined, counts, recent, relays, ownRelay] = await Promise.all([
    supabase
      .from('missions')
      .select('*, event:events(title, place, start_date, end_date, url)')
      .eq('id', missionId)
      .single(),
    supabase
      .from('user_missions')
      .select('*')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .neq('status', 'expired')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('mission_participants')
      .select('mission_id')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('get_participant_counts', { mission_ids: [missionId] }),
    supabase.rpc('get_participant_nicknames', { mission: missionId }),
    supabase.rpc('get_relay_messages', { mission: missionId }),
    supabase
      .from('relay_messages')
      .select('id, status')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (mission.error) throw mission.error;
  return {
    mission: mission.data,
    mine: mine.data,
    joined: Boolean(joined.data),
    participants: counts.data?.[0]?.count ?? 0,
    nicknames: (recent.data ?? []).map((r) => r.nickname),
    relays: relays.error ? null : (relays.data ?? []).map((r) => r.body),
    ownRelay: ownRelay.data,
  };
}

/** F9 같이 할래요 켜기·끄기. 실패하면 오류를 던진다 */
export async function setParticipation(missionId: string, userId: string, join: boolean) {
  const { error } = join
    ? await supabase
        .from('mission_participants')
        .upsert(
          { mission_id: missionId },
          { onConflict: 'mission_id,user_id', ignoreDuplicates: true },
        )
    : await supabase
        .from('mission_participants')
        .delete()
        .eq('mission_id', missionId)
        .eq('user_id', userId);
  if (error) throw error;
}

/** 365 서울챌린지 시드 미션 전체. AI 추천을 쓸 수 없을 때 앱이 규칙으로 고르는 재료 */
export async function getSeedMissions() {
  const { data, error } = await supabase.from('missions').select('*').eq('source', 'seed');
  if (error) throw error;
  return data;
}

/** 홈(S3): 오늘(KST today) 시작했거나 아직 진행 중인 미션. 주간 미션은 날이 바뀌어도 이어진다 */
export async function getTodayProgress(userId: string, today: string) {
  const { data, error } = await supabase
    .from('user_missions')
    .select('*, missions(*)')
    .eq('user_id', userId)
    .or(`status.in.(in_progress,judging),started_at.gte.${today}T00:00:00+09:00`)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** 기록(S7): KST from 날짜 0시 이후 시작한 미션의 종류·상태·시각. 달성률과 출석 달력 계산에 쓴다 */
export async function getMissionsStartedSince(userId: string, from: string) {
  const { data, error } = await supabase
    .from('user_missions')
    .select('type, status, started_at, completed_at')
    .eq('user_id', userId)
    .gte('started_at', `${from}T00:00:00+09:00`);
  if (error) throw error;
  return data;
}
