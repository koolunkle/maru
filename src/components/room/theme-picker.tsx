import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { SurfaceSwatch } from '@/components/room/room-surfaces';
import { DefaultTheme, Floors, Wallpapers } from '@/constants/room-themes';
import { Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { themeRuleText, themeUnlocked, type ThemeProgress } from '@/utils/room-state';

type RoomTheme = typeof DefaultTheme;

/** 꾸미기 모드의 벽지·바닥 고르기. 잠긴 항목은 남은 조건을 보인다 */
export function ThemePicker({
  value,
  progress,
  onChoose,
}: {
  value: RoomTheme;
  progress: ThemeProgress;
  onChoose: (kind: keyof RoomTheme, id: string) => void;
}) {
  const theme = useTheme();
  const isDark = useIsDark();
  return (
    <View style={styles.themes}>
      {(
        [
          ['wallpaper', '벽지', Wallpapers, 'wall'],
          ['floor', '바닥', Floors, 'floor'],
        ] as const
      ).map(([kind, label, items, swatch]) => (
        <View key={kind} style={styles.themeGroup}>
          <AppText variant="titleMd" accessibilityRole="header">
            {label}
          </AppText>
          <View style={styles.themeRow}>
            {items.map((item) => {
              const open = themeUnlocked(item.rule, progress);
              const selected = value[kind] === item.id;
              return (
                <PressableScale
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: !open }}
                  accessibilityLabel={
                    open
                      ? `${label} ${item.name}`
                      : `${label} ${item.name}, 잠김. ${themeRuleText(item.rule, progress)}`
                  }
                  disabled={!open}
                  onPress={() => onChoose(kind, item.id)}
                  style={[
                    styles.themeItem,
                    {
                      borderColor: selected ? theme.primary : theme.hairline,
                      backgroundColor: selected ? theme.primarySoft : theme.surface,
                    },
                  ]}
                >
                  <View style={[styles.swatch, !open && styles.lockedSwatch]}>
                    <SurfaceSwatch kind={swatch} id={item.id} size={44} dark={isDark} />
                    {!open && (
                      <View style={styles.lock}>
                        <Feather aria-hidden name="lock" size={14} color={theme.slate} />
                      </View>
                    )}
                  </View>
                  <AppText variant="caption" color={open ? 'ink' : 'steel'} numberOfLines={1}>
                    {item.name}
                  </AppText>
                  {!open && (
                    <AppText
                      variant="label"
                      color="accentInk"
                      numberOfLines={2}
                      style={styles.centerText}
                    >
                      {themeRuleText(item.rule, progress)}
                    </AppText>
                  )}
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}
      <AppText variant="caption" color="steel">
        벽지·바닥은 이 기기에만 저장돼요.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  themes: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  themeGroup: {
    gap: Spacing.xs,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  themeItem: {
    width: 76,
    minHeight: 96,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  swatch: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  lockedSwatch: {
    opacity: 0.45,
  },
  lock: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
