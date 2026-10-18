import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { MissionCard } from '@/components/mission-card';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTodayMissions } from '@/hooks/use-today-missions';
import { useSession } from '@/providers/session-provider';
import { formatKstToday } from '@/utils/date';

/** S3 홈 (DESIGN.md §5.2) */
export function Home() {
  const theme = useTheme();
  const { profile } = useSession();
  const { data, error, reload } = useTodayMissions();

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg">{formatKstToday()}</AppText>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="설정"
          onPress={() => router.push('/settings')}
          style={styles.iconButton}>
          <Feather name="settings" size={24} color={theme.ink} />
        </PressableScale>
      </View>

      <View style={styles.streak}>
        <Feather name="zap" size={20} color={theme.accent} />
        <AppText variant="titleMd" tabular>
          {profile?.streak ?? 0}일째
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="titleMd">오늘의 미션</AppText>
        {error ? (
          <View style={styles.state}>
            <AppText color="slate">미션을 불러오지 못했어요.</AppText>
            <Button label="다시 불러오기" variant="secondary" size="sm" onPress={reload} />
          </View>
        ) : !data ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.primary} />
            <AppText variant="caption" color="steel">
              오늘 미션을 준비하고 있어요
            </AppText>
          </View>
        ) : (
          data.daily.map((m) => <MissionCard key={m.id} mission={m} />)
        )}
      </View>

      {data?.weekly && (
        <View style={styles.section}>
          <AppText variant="titleMd">이번 주 미션</AppText>
          <MissionCard mission={data.weekly} />
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
  section: {
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  state: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
});
