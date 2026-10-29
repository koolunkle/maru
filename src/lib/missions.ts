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
    supabase.from('missions').select('*, event:events(title, place, start_date, end_date, url)').eq('id', missionId).single(),
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
    ? await supabase.from('mission_participants').upsert({ mission_id: missionId }, { onConflict: 'mission_id,user_id', ignoreDuplicates: true })
    : await supabase.from('mission_participants').delete().eq('mission_id', missionId).eq('user_id', userId);
  if (error) throw error;
}
