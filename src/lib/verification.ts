import { supabase } from '@/lib/supabase';

type Upload = { userId: string; userMissionId: string; path: string; bytes: ArrayBuffer | Uint8Array; text: string | null; isPublic: boolean };

/**
 * F4 인증 사진을 올리고 verifications 행을 만든다. 같은 path로 다시 부르면(네트워크 재시도) 이미 올라간 사진·행을 이어 쓴다.
 * 돌려준 id로 Functions.verifyMission을 부른다.
 */
export async function uploadVerification({ userId, userMissionId, path, bytes, text, isPublic }: Upload): Promise<string> {
  const upload = await supabase.storage.from('verifications').upload(path, bytes, { contentType: 'image/jpeg' });
  if (upload.error) {
    const existing = await supabase.storage.from('verifications').download(path);
    if (existing.error || !existing.data) throw upload.error;
  }
  const { data, error } = await supabase
    .from('verifications')
    .insert({ user_mission_id: userMissionId, photo_path: path, text, is_public: isPublic })
    .select('id')
    .single();
  if (!error) return data.id;
  const existing = await supabase.from('verifications').select('id, user_mission_id, text')
    .eq('user_id', userId).eq('photo_path', path).maybeSingle();
  if (existing.error || !existing.data || existing.data.user_mission_id !== userMissionId || existing.data.text !== text) throw error;
  return existing.data.id;
}
