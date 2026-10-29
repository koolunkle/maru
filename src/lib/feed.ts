import { supabase } from '@/lib/supabase';
import type { Enums } from '@/types/database';

/** F6 반응 남기기·지우기. 실패하면 오류를 던진다 */
export async function setReaction(verificationId: string, userId: string, type: Enums<'reaction_type'>, on: boolean) {
  const { error } = on
    ? await supabase.from('reactions').upsert({ verification_id: verificationId, type }, { onConflict: 'verification_id,user_id,type', ignoreDuplicates: true })
    : await supabase.from('reactions').delete().eq('verification_id', verificationId).eq('user_id', userId).eq('type', type);
  if (error) throw error;
}
