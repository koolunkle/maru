import { useCallback, useEffect, useState } from 'react';

import { FeedPageSize, getFeedPage, type FeedPost } from '@/lib/feed';

/** S6 피드: 공개 인증 최신순, 20개씩 (spec feed) */
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
    getFeedPage(userId).then(
      (result) => {
        if (!active) return;
        setPosts(result);
        setHasMore(result.length === FeedPageSize);
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
      const older = await getFeedPage(userId, last.created_at);
      setPosts((prev) => {
        const seen = new Set((prev ?? []).map((p) => p.id));
        return [...(prev ?? []), ...older.filter((p) => !seen.has(p.id))];
      });
      setHasMore(older.length === FeedPageSize);
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, posts, loadingMore]);

  return { posts, error, reload, setPosts, hasMore, loadingMore, moreError, loadMore };
}
