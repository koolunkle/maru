import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useFeed, type FeedPost } from '@/hooks/use-feed';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/providers/session-provider';

import { PostCard } from './post-card';

/** S6 피드 (DESIGN.md §5.2) */
export function Feed() {
  const theme = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;
  const { posts, error, reload, setPosts } = useFeed(userId);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  const update = useCallback(
    (next: FeedPost) => setPosts((prev) => prev && prev.map((p) => (p.id === next.id ? next : p))),
    [setPosts],
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg">피드</AppText>
      </View>

      {error ? (
        <View style={styles.state}>
          <AppText color="slate">피드를 불러오지 못했어요.</AppText>
          <Button label="다시 불러오기" variant="secondary" size="sm" onPress={reload} />
        </View>
      ) : !posts ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.state}>
          <AppText color="slate">아직 공개된 인증이 없어요</AppText>
          <AppText variant="caption" color="steel">
            미션을 인증할 때 공개를 켜면 여기에 보여요
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} userId={userId ?? ''} onChange={update} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
  },
  list: {
    gap: Spacing.sm,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.section,
  },
});
