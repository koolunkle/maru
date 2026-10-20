import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const Stages = [
  { icon: 'pot-outline', label: '화분', color: 'muted' },
  { icon: 'sprout-outline', label: '새싹', color: 'success' },
  { icon: 'sprout', label: '잎', color: 'success' },
  { icon: 'flower-tulip', label: '꽃', color: 'accent' },
] as const;

type GrowthStage = (typeof Stages)[number];

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

type GrowthCardProps = {
  completedCount: number;
};

/** F11 성장 화분 (PRD F11 / DESIGN.md §5.2, §5.3, §6) */
export function GrowthCard({ completedCount }: GrowthCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const stage = Math.min(Math.max(completedCount, 0), 3);
  const current = Stages[stage] as GrowthStage;
  const previousStage = useRef(stage);
  const progress = useSharedValue(stage / 3);

  useEffect(() => {
    if (previousStage.current !== stage) {
      previousStage.current = stage;
      progress.value = withTiming(stage / 3, { duration: reduceMotion ? 150 : 250 });
    } else {
      progress.value = stage / 3;
    }
  }, [progress, reduceMotion, stage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const message =
    stage === 0 ? '오늘의 화분이에요' : stage === 3 ? '오늘의 꽃이 피었어요' : `오늘 ${stage}개 해냈어요`;

  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
      <View style={styles.icon}>
        <Animated.View
          key={current.icon}
          entering={
            reduceMotion
              ? FadeIn.duration(150)
              : ZoomIn.springify().damping(12).stiffness(180)
          }
          exiting={FadeOut.duration(120)}>
          <MaterialCommunityIcons name={current.icon} size={48} color={theme[current.color]} />
        </Animated.View>
      </View>

      <View style={styles.content}>
        <AppText variant="titleMd">{message}</AppText>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="오늘의 미션 진행"
          accessibilityValue={{ min: 0, max: 3, now: stage }}
          style={[styles.track, { backgroundColor: theme.surfaceSunken }]}>
          <Animated.View style={[styles.fill, { backgroundColor: theme.success }, progressStyle]} />
        </View>
        <View style={styles.labels}>
          {Stages.map((item, index) => (
            <AppText
              key={item.label}
              variant="caption"
              color={index === stage ? 'success' : 'steel'}
              style={index === stage && styles.currentLabel}>
              {item.label}
            </AppText>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentLabel: {
    fontFamily: FontFamily.semiBold,
  },
});
