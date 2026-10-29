import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { FurnitureArt } from '@/components/room/furniture-art';
import { RoomArt } from '@/constants/room-art';
import { Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { kstClock, plantStageOf } from '@/utils/room-state';

type Props = {
  rewards: { id: string; name: string }[];
  streak: number | null;
  onPlace: (furnitureId: string) => void;
  onClose: () => void;
};

/** 인증으로 가구를 받았을 때: 상자가 흔들리고 열리며 가구가 나온다 */
export function RewardReveal({ rewards, streak, onPlace, onClose }: Props) {
  const theme = useTheme();
  const colors = useIsDark() ? RoomArt.dark : RoomArt.light;
  const first = rewards[0];
  const shake = useSharedValue(0);
  const lid = useSharedValue(0);

  useEffect(() => {
    shake.value = withSequence(
      withTiming(-6, { duration: 80 }),
      withTiming(6, { duration: 80 }),
      withTiming(-4, { duration: 80 }),
      withTiming(0, { duration: 80 }),
    );
    lid.value = withDelay(380, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, [lid, shake]);

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }] }));
  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 56 * lid.value }, { translateY: -24 * lid.value }, { rotate: `${28 * lid.value}deg` }],
    opacity: 1 - lid.value,
  }));
  const artStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -36 * lid.value }, { scale: 0.6 + 0.4 * lid.value }],
    opacity: lid.value,
  }));

  if (!first) return null;
  const state = { plantStage: plantStageOf(streak ?? 0), lampOn: false, clock: kstClock(), posterTitle: null };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.stage} aria-hidden>
            <Animated.View style={[styles.art, artStyle]}>
              <FurnitureArt id={first.id} height={72} colors={colors} state={state} />
            </Animated.View>
            <Animated.View style={boxStyle}>
              <Svg width={96} height={64} viewBox="0 0 96 64">
                <Rect x={10} y={14} width={76} height={48} rx={4} fill={theme.primary} />
                <Rect x={43} y={14} width={10} height={48} fill={theme.accent} />
              </Svg>
              <Animated.View style={[styles.lid, lidStyle]}>
                <Svg width={96} height={22} viewBox="0 0 96 22">
                  <Rect x={4} y={4} width={88} height={16} rx={4} fill={theme.primaryPressed} />
                  <Rect x={43} y={4} width={10} height={16} fill={theme.accent} />
                  <Path d="M48 4 C40 -4 32 0 38 4 Z M48 4 C56 -4 64 0 58 4 Z" fill={theme.accent} />
                </Svg>
              </Animated.View>
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.delay(600)} style={styles.text}>
            <AppText variant="label" color="accentInk">새 가구가 도착했어요</AppText>
            <AppText variant="titleLg" accessibilityRole="header" style={styles.center}>
              {rewards.map((r) => r.name).join(', ')}
            </AppText>
            <AppText variant="bodySm" color="slate" style={styles.center}>
              내 방에 놓고 꾸며 볼까요?
            </AppText>
          </Animated.View>
          <View style={styles.actions}>
            <Button label="방에 놓기" onPress={() => onPlace(first.id)} />
            <Button label="나중에" variant="ghost" onPress={onClose} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  stage: {
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  art: {
    position: 'absolute',
    bottom: 30,
  },
  lid: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  text: {
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: Spacing.xs,
  },
});
