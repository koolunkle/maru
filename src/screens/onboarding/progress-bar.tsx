import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 온보딩 진행 표시: N칸 막대, 높이 4px, 활성 primary (DESIGN.md §5.2 S2) */
export function ProgressBar({ total, current }: { total: number; current: number }) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i <= current ? theme.primary : theme.hairline }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xxs,
    marginTop: Spacing.md,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
