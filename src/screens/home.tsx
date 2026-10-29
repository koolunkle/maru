import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { GrowthCard } from '@/components/growth-card';
import { MissionCard } from '@/components/mission-card';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTodayMissions } from '@/hooks/use-today-missions';
import { useRewardProgress } from '@/hooks/use-reward-progress';
import { useSession } from '@/providers/session-provider';
import type { Tables } from '@/types/database';
import { formatKstToday, kstDate } from '@/utils/date';
import { nextReward } from '@/utils/next-reward';
import { currentStreak } from '@/utils/streak';

type Mission = Tables<'missions'>;

const RefreshNotice = {
  limit: '다른 미션은 하루에 한 번만 볼 수 있어요',
  failed: '지금은 새 미션을 가져오지 못했어요',
} as const;

/** S3 홈 (DESIGN.md §5.2) */
export function Home() {
  const theme = useTheme();
  const { profile, refreshProfile } = useSession();
  const { data, error, reload, refresh, refreshing } = useTodayMissions();
  const rewardData = useRewardProgress(profile?.id);
  const [notice, setNotice] = useState<string | null>(null);

  // 인증을 마치고 돌아오면 진행 상태·연속 출석을 다시 읽는다 (첫 진입은 훅이 이미 불러온다)
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
      refreshProfile();
    }, [reload, refreshProfile]),
  );

  function open(mission: Mission, type: 'daily' | 'weekly') {
    router.push({
      pathname: '/mission/[id]',
      params: { id: mission.id, type },
    });
  }

  async function showOthers() {
    setNotice(null);
    const result = await refresh();
    if (result !== 'ok') setNotice(RefreshNotice[result]);
  }

  const streak = profile ? currentStreak(profile, kstDate()) : 0;
  const rewardFor = (mission: Mission, type: 'daily' | 'weekly') =>
    rewardData && profile
      ? nextReward(mission, type, rewardData.furniture, {
          ...rewardData,
          streak,
          attendedToday: profile.last_attended === kstDate(),
        })
      : null;
  const anyStarted = data ? data.daily.some((m) => data.progress[m.id]) : false;
  const completedDailyCount = data
    ? Math.min(
        Object.values(data.progress).filter(
          (mission) =>
            mission.type === 'daily' && mission.status === 'completed',
        ).length,
        3,
      )
    : 0;

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg">{formatKstToday()}</AppText>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="설정"
          onPress={() => router.push('/settings')}
          style={styles.iconButton}
        >
          <Feather aria-hidden name="settings" size={24} color={theme.ink} />
        </PressableScale>
      </View>

      <View
        style={styles.streak}
        accessible
        accessibilityLabel={streak > 0 ? `연속 출석 ${streak}일째` : '연속 출석 없음. 오늘 미션 하나로 출석해 볼까요?'}
      >
        <Feather aria-hidden name="zap" size={20} color={theme.accent} />
        {streak > 0 ? (
          <AppText variant="titleMd" tabular>
            {streak}일째
          </AppText>
        ) : (
          <AppText color="slate">오늘 미션 하나로 출석해 볼까요?</AppText>
        )}
      </View>

      {data && (
        <View style={styles.growth}>
          <GrowthCard completedCount={completedDailyCount} />
        </View>
      )}

      <View style={styles.section}>
        <AppText variant="titleMd">오늘의 미션</AppText>
        {error ? (
          <View style={styles.state}>
            <AppText color="slate">미션을 불러오지 못했어요.</AppText>
            <Button
              label="다시 불러오기"
              variant="secondary"
              size="sm"
              onPress={reload}
            />
          </View>
        ) : !data ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.primary} />
            <AppText variant="caption" color="steel">
              오늘 미션을 준비하고 있어요
            </AppText>
          </View>
        ) : (
          data.daily.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              status={data.progress[m.id]?.status}
              reward={rewardFor(m, 'daily')}
              onPress={() => open(m, 'daily')}
            />
          ))
        )}
      </View>

      {data?.weekly && (
        <View style={styles.section}>
          <AppText variant="titleMd">이번 주 미션</AppText>
          <MissionCard
            mission={data.weekly}
            status={data.progress[data.weekly.id]?.status}
            reward={rewardFor(data.weekly, 'weekly')}
            onPress={() => data.weekly && open(data.weekly, 'weekly')}
          />
        </View>
      )}

      {data && !anyStarted && (
        <View style={styles.others}>
          <Button
            label="다른 미션 보기"
            variant="ghost"
            onPress={showOthers}
            loading={refreshing}
          />
          {notice && (
            <AppText variant="caption" color="steel" style={styles.center}>
              {notice}
            </AppText>
          )}
        </View>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  growth: {
    marginTop: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  others: {
    marginTop: Spacing.md,
    gap: Spacing.xxs,
  },
  center: {
    textAlign: 'center',
  },
});
