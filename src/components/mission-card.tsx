import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { CategoryLabel } from '@/constants/domain';
import { CategoryBar, CategoryTint, Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { Enums, Tables } from '@/types/database';

type MissionCardProps = {
  mission: Pick<Tables<'missions'>, 'title' | 'category' | 'minutes'>;
  /** 이 미션의 내 진행 상태 (없으면 아직 시작 전) */
  status?: Enums<'user_mission_status'>;
  /** 다음 보상까지 남은 조건 (PRD F8, reward-badge) */
  reward?: string | null;
  onPress?: () => void;
};

const StatusLabel: Partial<Record<Enums<'user_mission_status'>, string>> = {
  in_progress: '진행 중',
  judging: '확인 중',
  completed: '완료',
};

/** mission-card (DESIGN.md §5.3). 라이트: 카테고리 틴트 면 / 다크: surface + 왼쪽 4px 틴트 막대 */
export function MissionCard({ mission, status, reward, onPress }: MissionCardProps) {
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
        { backgroundColor: isDark ? theme.surface : tint },
        done && styles.done,
      ]}>
      {isDark && <View style={[styles.bar, { backgroundColor: CategoryBar[mission.category] }]} />}
      <View style={styles.body}>
        <AppText variant="label" color="slate">
          {CategoryLabel[mission.category]} · {mission.minutes}분{statusLabel ? ` · ${statusLabel}` : ''}
        </AppText>
        <AppText variant="titleMd" numberOfLines={2}>
          {mission.title}
        </AppText>
        {reward && !done && (
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <Feather aria-hidden name="award" size={14} color={theme.accent} />
            <AppText variant="label" color="accentInk">
              {reward}
            </AppText>
          </View>
        )}
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
    overflow: 'hidden',
  },
  // 다크 모드 카테고리 막대: 테두리로 그리면 둥근 모서리를 따라 휘므로 곧은 막대를 카드 모서리에서 자른다
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  body: {
    flex: 1,
    gap: Spacing.xxs,
  },
  done: {
    opacity: 0.7,
  },
  // reward-badge (DESIGN.md: 24px, rounded.full, paddingX 10px)
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    marginTop: Spacing.xxs,
  },
});
