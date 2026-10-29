import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Relay = Pick<Tables<'relay_messages'>, 'id' | 'body' | 'status' | 'publish_at'>;

/** F10 다음 사람에게 한 줄 남기기. 이미 남겼으면(미션당 하나) 그 한 줄을 돌려준다 */
export async function leaveRelay(missionId: string, userId: string, body: string): Promise<Relay> {
  const inserted = await supabase.from('relay_messages').insert({ mission_id: missionId, body }).select('id, body, status, publish_at').single();
  if (inserted.error?.code !== '23505') {
    if (inserted.error) throw inserted.error;
    return inserted.data;
  }
  const existing = await supabase.from('relay_messages').select('id, body, status, publish_at').eq('mission_id', missionId).eq('user_id', userId).single();
  if (existing.error) throw existing.error;
  return existing.data;
}
