import { router, useFocusEffect } from 'expo-router';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { AiCard } from '@/components/ai-card';
import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { HelpCard } from '@/components/help-card';
import { Screen } from '@/components/screen';
import { CategoryLabel } from '@/constants/domain';
import { CategoryTint, Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { Functions } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import type { Enums, Tables } from '@/types/database';
import { endingNotice, formatDateRange, kstEndOfDay, kstEndOfWeek } from '@/utils/date';

type MissionType = Enums<'mission_type'>;

type MissionEvent = Pick<Tables<'events'>, 'title' | 'place' | 'start_date' | 'end_date' | 'url'>;

type Detail = {
  mission: Tables<'missions'> & { event: MissionEvent | null };
  mine: Tables<'user_missions'> | null;
  joined: boolean;
  participants: number;
  nicknames: string[];
  relays: string[] | null;
  ownRelay: Pick<Tables<'relay_messages'>, 'id' | 'status'> | null;
};

async function fetchDetail(missionId: string, userId: string): Promise<Detail> {
  const [mission, mine, joined, counts, recent, relays, ownRelay] = await Promise.all([
    supabase.from('missions').select('*, event:events(title, place, start_date, end_date, url)').eq('id', missionId).single(),
    supabase
      .from('user_missions')
      .select('*')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .neq('status', 'expired')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('mission_participants')
      .select('mission_id')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('get_participant_counts', { mission_ids: [missionId] }),
    supabase.rpc('get_participant_nicknames', { mission: missionId }),
    supabase.rpc('get_relay_messages', { mission: missionId }),
    supabase
      .from('relay_messages')
      .select('id, status')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (mission.error) throw mission.error;
  return {
    mission: mission.data,
    mine: mine.data,
    joined: Boolean(joined.data),
    participants: counts.data?.[0]?.count ?? 0,
    nicknames: (recent.data ?? []).map((r) => r.nickname),
    relays: relays.error ? null : (relays.data ?? []).map((r) => r.body),
    ownRelay: ownRelay.data,
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
  const [relayNotice, setRelayNotice] = useState<string | null>(null);
  const [relayCrisis, setRelayCrisis] = useState(false);
  const retryingRelay = useRef(false);

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
    const { data, error } = await supabase.functions.invoke('start-mission', { body: {
      missionId, type, dueAt: (type === 'daily' ? kstEndOfDay() : kstEndOfWeek()).toISOString(),
    } });
    setBusy(false);
    if (error) {
      const payload = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
      setNotice(payload?.error === 'mission_limit'
        ? (type === 'daily' ? '오늘 미션은 3개까지 함께 할 수 있어요' : '이번 주 미션은 하나씩 해요')
        : '시작하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    if (!data?.id) { setNotice('시작하지 못했어요. 다시 시도해 주세요.'); return; }
    load();
  }

  async function toggleJoin() {
    if (!detail) return;
    setBusy(true);
    setNotice(null);
    const { error } = detail.joined
      ? await supabase.from('mission_participants').delete().eq('mission_id', missionId).eq('user_id', userId)
      : await supabase.from('mission_participants').upsert({ mission_id: missionId }, { onConflict: 'mission_id,user_id', ignoreDuplicates: true });
    setBusy(false);
    if (error) setNotice('지금은 바꾸지 못했어요. 다시 눌러 볼까요?');
    else load();
  }

  async function retryRelay() {
    if (!detail?.ownRelay || busy || retryingRelay.current) return;
    retryingRelay.current = true;
    setBusy(true);
    setRelayNotice(null);
    try {
      const result = await Functions.moderateRelay(detail.ownRelay.id);
      setDetail({ ...detail, ownRelay: { ...detail.ownRelay, status: result.status } });
      setRelayCrisis(result.status === 'crisis');
      setRelayNotice(
        result.status === 'pending'
          ? '아직 검수를 기다리고 있어요.'
          : result.status === 'rejected' || result.status === 'crisis'
            ? '이 한 줄은 공개되지 않았어요.'
            : '한 줄이 검수를 마쳤어요.',
      );
    } catch {
      setRelayNotice('검수를 요청하지 못했어요. 다시 눌러 볼까요?');
    } finally {
      retryingRelay.current = false;
      setBusy(false);
    }
  }

  if (!detail) {
    return (
      <Screen>
        <BackHeader />
        <View style={styles.center}>
          {failed ? (
            <>
              <AppText color="slate" accessibilityRole="alert">미션을 불러오지 못했어요.</AppText>
              <Button
                label="다시 불러오기"
                variant="secondary"
                size="sm"
                onPress={() => {
                  setFailed(false);
                  load();
                }}
              />
            </>
          ) : (
            <ActivityIndicator color={theme.primary} />
          )}
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
        onPress={() =>
          mine && router.push({ pathname: '/mission/[id]/verify', params: { id: missionId, um: mine.id } })
        }
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
          isDark
            ? { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: tint }
            : { backgroundColor: tint },
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

        {mission.event && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
            <AppText variant="label" color="steel">
              행사 정보
            </AppText>
            <AppText>{mission.event.title}</AppText>
            <AppText variant="bodySm" color="slate">
              {formatDateRange(mission.event.start_date, mission.event.end_date)}
              {mission.event.place ? ` · ${mission.event.place}` : ''}
            </AppText>
            {endingNotice(mission.event.end_date) && (
              <AppText variant="bodySm" color="accentInk">
                {endingNotice(mission.event.end_date)}
              </AppText>
            )}
            {/* 외부 데이터의 주소라 https만 연다 */}
            {mission.event.url?.startsWith('https://') && (
              <Button
                label="행사 정보 보기"
                variant="ghost"
                size="sm"
                onPress={() => mission.event?.url && Linking.openURL(mission.event.url)}
              />
            )}
          </View>
        )}

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
        <View style={styles.relays}>
          <AppText variant="titleMd" accessibilityRole="header">
            먼저 해낸 사람의 한 줄
          </AppText>
          {detail.relays === null ? (
            <AppText variant="caption" color="steel">
              한 줄을 불러오지 못했어요. 다시 열어 볼까요?
            </AppText>
          ) : detail.relays.length === 0 ? (
            <AppText variant="caption" color="steel">
              이 미션을 처음 해 보는 사람이에요
            </AppText>
          ) : (
            detail.relays.map((body, index) => (
              <View key={index} style={[styles.relayItem, { backgroundColor: theme.surfaceSunken }]}>
                <AppText variant="bodySm">{body}</AppText>
              </View>
            ))
          )}
          {detail.ownRelay?.status === 'pending' && (
            <>
              <AppText variant="caption" color="steel">
                내가 남긴 한 줄은 검수를 기다리고 있어요.
              </AppText>
              <Button label="검수 다시 요청" variant="secondary" size="sm" onPress={retryRelay} loading={busy} />
            </>
          )}
          {relayNotice && (
            <AppText variant="caption" color="steel" accessibilityRole="alert">
              {relayNotice}
            </AppText>
          )}
          {relayCrisis && <HelpCard subject="이 한 줄" />}
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
    gap: Spacing.sm,
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
  relays: { marginTop: Spacing.lg, gap: Spacing.xs },
  relayItem: { borderRadius: Radius.md, padding: Spacing.sm },
  footer: {
    gap: Spacing.xs,
  },
});
