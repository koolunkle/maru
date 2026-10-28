import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { CategoryLabel } from '@/constants/domain';
import { CategoryTint, Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { Enums, Tables } from '@/types/database';

type MissionCardProps = {
  mission: Pick<Tables<'missions'>, 'title' | 'category' | 'minutes'>;
  /** 이 미션의 내 진행 상태 (없으면 아직 시작 전) */
  status?: Enums<'user_mission_status'>;
  onPress?: () => void;
};

const StatusLabel: Partial<Record<Enums<'user_mission_status'>, string>> = {
  in_progress: '진행 중',
  judging: '확인 중',
  completed: '완료',
};

/** mission-card (DESIGN.md §5.3). 라이트: 카테고리 틴트 면 / 다크: surface + 왼쪽 4px 틴트 막대 */
export function MissionCard({ mission, status, onPress }: MissionCardProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const tint = CategoryTint[mission.category];
  const done = status === 'completed';
  const statusLabel = status && StatusLabel[status];

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        isDark
          ? { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: tint }
          : { backgroundColor: tint },
        done && styles.done,
      ]}>
      <View style={styles.body}>
        <AppText variant="label" color="slate">
          {CategoryLabel[mission.category]} · {mission.minutes}분{statusLabel ? ` · ${statusLabel}` : ''}
        </AppText>
        <AppText variant="titleMd" numberOfLines={2}>
          {mission.title}
        </AppText>
      </View>
      {done ? (
        <Feather aria-hidden name="check-circle" size={20} color={theme.success} />
      ) : (
        onPress && <Feather aria-hidden name="chevron-right" size={20} color={theme.slate} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  body: {
    flex: 1,
    gap: Spacing.xxs,
  },
  done: {
    opacity: 0.7,
  },
});
