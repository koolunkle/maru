import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { HelpCard } from '@/components/help-card';
import { PressableScale } from '@/components/pressable-scale';
import { CategoryLabel } from '@/constants/domain';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { FeedPost } from '@/hooks/use-feed';
import { useTheme } from '@/hooks/use-theme';
import { Functions } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import type { Enums } from '@/types/database';

type ReactionType = Enums<'reaction_type'>;

const ReactionLabel: Record<ReactionType, string> = {
  cheer: '응원해요',
  metoo: '나도 해볼래요',
  nice: '멋져요',
};

const MaxComment = 200;

/** "약 3시간 뒤 공개돼요" / "약 1분 뒤 공개돼요" */
function publishIn(publishAt: string) {
  const minutes = Math.max(1, Math.ceil((Date.parse(publishAt) - Date.now()) / 60_000));
  return minutes >= 60 ? `약 ${Math.round(minutes / 60)}시간 뒤 공개돼요` : `약 ${minutes}분 뒤 공개돼요`;
}

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / (60 * 24))}일 전`;
}

type PostCardProps = {
  post: FeedPost;
  userId: string;
  onChange: (post: FeedPost) => void;
};

/** S6 게시물 카드 (DESIGN.md §5.2 S6, PRD F6) */
export function PostCard({ post, userId, onChange }: PostCardProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);

  async function toggleReaction(type: ReactionType) {
    const on = post.myReactions.includes(type);
    const { error } = on
      ? await supabase.from('reactions').delete().eq('verification_id', post.id).eq('user_id', userId).eq('type', type)
      : await supabase.from('reactions').insert({ verification_id: post.id, type });
    if (error) return;
    onChange({
      ...post,
      myReactions: on ? post.myReactions.filter((t) => t !== type) : [...post.myReactions, type],
      reactions: { ...post.reactions, [type]: post.reactions[type] + (on ? -1 : 1) },
    });
  }

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setNotice(null);
    const { data, error } = await supabase
      .from('comments')
      .insert({ verification_id: post.id, body })
      .select('*')
      .single();
    if (error) {
      setSending(false);
      setNotice('댓글을 남기지 못했어요. 다시 시도해 주세요.');
      return;
    }
    setDraft('');
    const { status } = await Functions.moderateComment(data.id).catch(() => ({ status: 'pending' as const }));
    setSending(false);
    if (status === 'crisis') {
      setCrisis(true);
      return;
    }
    if (status === 'rejected') {
      setNotice('이 댓글은 공개되지 않았어요');
      return;
    }
    onChange({ ...post, comments: [...post.comments, { ...data, status, nickname: '' }] });
  }

  const visibleComments = post.comments.filter(
    (c) => c.status === 'published' || (c.user_id === userId && (c.status === 'pending' || c.status === 'approved')),
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
      <View style={styles.meta}>
        <AppText variant="label">{post.nickname}</AppText>
        <AppText variant="caption" color="steel">
          {timeAgo(post.created_at)}
        </AppText>
      </View>
      <AppText variant="caption" color="slate">
        {CategoryLabel[post.category]} · {post.mission_title}
      </AppText>

      {post.photoUrl && (
        <Image source={{ uri: post.photoUrl }} style={styles.photo} contentFit="cover" accessibilityLabel="인증 사진" />
      )}
      {post.text && <AppText>{post.text}</AppText>}

      <View style={styles.reactions}>
        {(Object.keys(ReactionLabel) as ReactionType[]).map((type) => (
          <Chip
            key={type}
            label={post.reactions[type] ? `${ReactionLabel[type]} ${post.reactions[type]}` : ReactionLabel[type]}
            selected={post.myReactions.includes(type)}
            onPress={() => toggleReaction(type)}
          />
        ))}
      </View>

      {visibleComments.map((c) =>
        c.status === 'published' ? (
          <AppText key={c.id} variant="bodySm">
            <AppText variant="bodySm" color="slate">
              {c.nickname || '나'}{' '}
            </AppText>
            {c.body}
          </AppText>
        ) : (
          <View key={c.id} style={[styles.pending, { backgroundColor: theme.surfaceSunken }]}>
            <AppText variant="bodySm" color="slate">
              {c.body}
            </AppText>
            <View style={styles.pendingMeta}>
              <Feather name="clock" size={14} color={theme.steel} />
              <AppText variant="caption" color="steel">
                {publishIn(c.publish_at)}
              </AppText>
            </View>
          </View>
        ),
      )}

      {crisis ? (
        <HelpCard />
      ) : (
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(t) => setDraft(t.slice(0, MaxComment))}
            placeholder="익명으로 댓글 남기기"
            placeholderTextColor={theme.muted}
            onSubmitEditing={send}
            editable={!sending}
            style={[
              styles.input,
              Typography.bodySm,
              { color: theme.ink, borderColor: theme.hairlineStrong, backgroundColor: theme.surface },
            ]}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="댓글 보내기"
            onPress={send}
            disabled={sending || !draft.trim()}
            style={styles.sendButton}>
            <Feather name="send" size={20} color={draft.trim() ? theme.primary : theme.muted} />
          </PressableScale>
        </View>
      )}
      {notice && (
        <AppText variant="caption" color="steel">
          {notice}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    marginVertical: Spacing.xs,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  pending: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xxs,
  },
  pendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
