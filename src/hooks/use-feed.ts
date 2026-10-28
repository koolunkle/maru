import { useCallback, useEffect, useState } from 'react';

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

const PageSize = 20;

async function fetchFeed(userId: string, before?: string): Promise<FeedPost[]> {
  const { data: rows, error } = await supabase.rpc('get_feed', { page_size: PageSize, ...(before ? { before } : {}) });
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

/** S6 피드: 공개 인증 최신순, 20개씩 (PRD §5.2) */
export function useFeed(userId: string | undefined) {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchFeed(userId).then(
      (result) => {
        if (!active) return;
        setPosts(result);
        setHasMore(result.length === PageSize);
        setMoreError(false);
      },
      (e: unknown) => active && setError(e instanceof Error ? e : new Error(String(e))),
    );
    return () => {
      active = false;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  /** 이전 인증 20개 더 (#29). 마지막 게시물 시각보다 이전 것을 이어 붙인다 */
  const loadMore = useCallback(async () => {
    const last = posts?.at(-1);
    if (!userId || !last || loadingMore) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const older = await fetchFeed(userId, last.created_at);
      setPosts((prev) => {
        const seen = new Set((prev ?? []).map((p) => p.id));
        return [...(prev ?? []), ...older.filter((p) => !seen.has(p.id))];
      });
      setHasMore(older.length === PageSize);
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, posts, loadingMore]);

  return { posts, error, reload, setPosts, hasMore, loadingMore, moreError, loadMore };
}
