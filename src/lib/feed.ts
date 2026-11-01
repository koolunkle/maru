import { supabase } from '@/lib/supabase';
import type { Database, Enums, Tables } from '@/types/database';

type FeedRow = Database['public']['Functions']['get_feed']['Returns'][number];
type Comment = Tables<'comments'> & { nickname: string };
type ReactionType = Enums<'reaction_type'>;

export type FeedPost = FeedRow & {
  photoUrl: string | null;
  comments: Comment[];
  reactions: Record<ReactionType, number>;
  myReactions: ReactionType[];
};

export const FeedPageSize = 20;

/** S6 피드 한 쪽: 공개 인증 최신순 FeedPageSize개와 사진 주소·댓글·반응. before가 있으면 그보다 오래된 것 */
export async function getFeedPage(userId: string, before?: string): Promise<FeedPost[]> {
  const { data: rows, error } = await supabase.rpc('get_feed', { page_size: FeedPageSize, ...(before ? { before } : {}) });
  if (error) throw error;
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id);
  const [signed, comments, reactions] = await Promise.all([
    supabase.storage.from('verifications').createSignedUrls(
      rows.map((r) => r.photo_path),
      60 * 60,
    ),
    supabase.from('comments').select('*').in('verification_id', ids).order('created_at'),
    supabase.from('reactions').select('verification_id, user_id, type').in('verification_id', ids),
  ]);
  if (comments.error) throw comments.error;
  if (reactions.error) throw reactions.error;

  const commenterIds = [...new Set(comments.data.map((c) => c.user_id))];
  const { data: names } = commenterIds.length
    ? await supabase.rpc('get_nicknames', { user_ids: commenterIds })
    : { data: [] };
  const nicknameOf = new Map((names ?? []).map((n) => [n.id, n.nickname]));
  const urlOf = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return rows.map((row) => {
    const mine = reactions.data.filter((r) => r.verification_id === row.id);
    const count = (type: ReactionType) => mine.filter((r) => r.type === type).length;
    return {
      ...row,
      photoUrl: urlOf.get(row.photo_path) ?? null,
      comments: comments.data
        .filter((c) => c.verification_id === row.id)
        .map((c) => ({ ...c, nickname: nicknameOf.get(c.user_id) ?? '' })),
      reactions: { cheer: count('cheer'), metoo: count('metoo'), nice: count('nice') },
      myReactions: mine.filter((r) => r.user_id === userId).map((r) => r.type),
    };
  });
}

/** F6 반응 남기기·지우기. 실패하면 오류를 던진다 */
export async function setReaction(verificationId: string, userId: string, type: Enums<'reaction_type'>, on: boolean) {
  const { error } = on
    ? await supabase.from('reactions').upsert({ verification_id: verificationId, type }, { onConflict: 'verification_id,user_id,type', ignoreDuplicates: true })
    : await supabase.from('reactions').delete().eq('verification_id', verificationId).eq('user_id', userId).eq('type', type);
  if (error) throw error;
}
