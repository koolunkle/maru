import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AiCard } from '@/components/ai-card';
import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { CategoryLabel } from '@/constants/domain';
import { CategoryTint, Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import type { Enums, Tables } from '@/types/database';
import { kstEndOfDay, kstEndOfWeek } from '@/utils/date';

type MissionType = Enums<'mission_type'>;

/** PRD F3 동시 진행 상한 */
const MaxActive: Record<MissionType, number> = { daily: 3, weekly: 1 };

type Detail = {
  mission: Tables<'missions'>;
  mine: Tables<'user_missions'> | null;
  joined: boolean;
  participants: number;
  nicknames: string[];
};

async function fetchDetail(missionId: string, userId: string): Promise<Detail> {
  const [mission, mine, joined, counts, recent] = await Promise.all([
    supabase.from('missions').select('*').eq('id', missionId).single(),
    supabase
      .from('user_missions')
      .select('*')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .neq('status', 'expired')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('mission_participants').select('mission_id').eq('mission_id', missionId).eq('user_id', userId).maybeSingle(),
    supabase.rpc('get_participant_counts', { mission_ids: [missionId] }),
    supabase.rpc('get_participant_nicknames', { mission: missionId }),
  ]);
  if (mission.error) throw mission.error;
  return {
    mission: mission.data,
    mine: mine.data,
    joined: Boolean(joined.data),
    participants: counts.data?.[0]?.count ?? 0,
    nicknames: (recent.data ?? []).map((r) => r.nickname),
  };
}

/** S4 미션 상세 (PRD F3, F9 / DESIGN.md §5.2) */
export function MissionDetail({ missionId, type }: { missionId: string; type: MissionType }) {
  const theme = useTheme();
  const isDark = useIsDark();
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    fetchDetail(missionId, userId).then(
      (d) => active && setDetail(d),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [missionId, userId]);

  // 인증 화면에서 돌아오면 상태를 다시 읽는다
  useFocusEffect(load);

  async function start() {
    setBusy(true);
    setNotice(null);
    const { count } = await supabase
      .from('user_missions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .in('status', ['in_progress', 'judging']);
    if ((count ?? 0) >= MaxActive[type]) {
      setNotice(type === 'daily' ? '오늘 미션은 3개까지 함께 할 수 있어요' : '이번 주 미션은 하나씩 해요');
      setBusy(false);
      return;
    }
    const { error } = await supabase.from('user_missions').insert({
      mission_id: missionId,
      type,
      due_at: (type === 'daily' ? kstEndOfDay() : kstEndOfWeek()).toISOString(),
    });
    setBusy(false);
    if (error) {
      setNotice('시작하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    load();
  }

  async function toggleJoin() {
    if (!detail) return;
    setBusy(true);
    const { error } = detail.joined
      ? await supabase.from('mission_participants').delete().eq('mission_id', missionId).eq('user_id', userId)
      : await supabase.from('mission_participants').insert({ mission_id: missionId });
    setBusy(false);
    if (!error) load();
  }

  if (!detail) {
    return (
      <Screen>
        <BackHeader />
        <View style={styles.center}>
          {failed ? <AppText color="slate">미션을 불러오지 못했어요.</AppText> : <ActivityIndicator color={theme.primary} />}
        </View>
      </Screen>
    );
  }

  const { mission, mine } = detail;
  const status = mine?.status;
  const tint = CategoryTint[mission.category];

  const footer =
    status === 'completed' ? (
      <Button label="완료했어요" disabled />
    ) : status === 'in_progress' || status === 'judging' ? (
      <Button
        label="인증하기"
        onPress={() => mine && router.push({ pathname: '/mission/[id]/verify', params: { id: missionId, um: mine.id } })}
      />
    ) : (
      <Button label="시작하기" onPress={start} loading={busy} />
    );

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {notice && (
            <AppText variant="caption" color="steel" style={styles.centerText}>
              {notice}
            </AppText>
          )}
          {footer}
        </View>
      }>
      <BackHeader />

      <View
        style={[
          styles.hero,
          isDark ? { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: tint } : { backgroundColor: tint },
        ]}>
        <AppText variant="label" color="slate">
          {CategoryLabel[mission.category]} · {mission.minutes}분 · {type === 'daily' ? '오늘의 미션' : '이번 주 미션'}
        </AppText>
        <AppText variant="titleLg">{mission.title}</AppText>
      </View>

      <View style={styles.blocks}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
          <AppText variant="label" color="steel">
            이렇게 인증해요
          </AppText>
          <AppText>{mission.verify_hint} 사진 한 장</AppText>
        </View>

        {mission.reason && <AiCard>{mission.reason}</AiCard>}

        <View style={styles.joinRow}>
          <View style={styles.joinText}>
            <AppText variant="bodySm" color="slate">
              같이 하고 싶은 사람 {detail.participants}명
            </AppText>
            {detail.nicknames.length > 0 && (
              <AppText variant="caption" color="steel" numberOfLines={1}>
                {detail.nicknames.join(', ')}
              </AppText>
            )}
          </View>
          <Button
            label={detail.joined ? '같이 할래요 취소' : '같이 할래요'}
            variant="secondary"
            size="sm"
            onPress={toggleJoin}
            disabled={busy}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  hero: {
    minHeight: 160,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  blocks: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.xxs,
  },
  joinRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  joinText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    gap: Spacing.xs,
  },
});
