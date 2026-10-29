import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

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
