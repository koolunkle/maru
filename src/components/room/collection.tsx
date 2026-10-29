import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { FurnitureArt, type FurnitureState } from '@/components/room/furniture-art';
import { unlockText } from '@/constants/room';
import type { RoomArtColors } from '@/constants/room-art';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tables } from '@/types/database';
import { remainingText } from '@/utils/room-state';

type Props = {
  furniture: Tables<'furniture'>[];
  owned: Tables<'user_furniture'>[];
  colors: RoomArtColors;
  state: FurnitureState;
  progress: { streak: number; completedByCategory: Record<string, number> };
};

const dateLabel = (iso: string | null) => {
  if (!iso) return '';
  const kst = new Date(new Date(iso).getTime() + 9 * 3_600_000);
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
};

/** 가구 도감: 모은 가구는 그림과 받은 날, 잠긴 가구는 실루엣과 남은 조건 */
export function Collection({ furniture, owned, colors, state, progress }: Props) {
  const theme = useTheme();
  const have = furniture.filter((f) => owned.some((o) => o.furniture_id === f.id)).length;

  return (
    <View>
      <View style={styles.head}>
        <AppText variant="titleMd" accessibilityRole="header">가구 도감</AppText>
        <AppText variant="bodySm" color="slate" tabular>{have} / {furniture.length}</AppText>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.surfaceSunken }]}
        accessibilityRole="progressbar"
        accessibilityLabel={`가구 ${furniture.length}개 중 ${have}개 모음`}>
        <View style={[styles.fill, { backgroundColor: theme.accent, width: `${furniture.length ? (have / furniture.length) * 100 : 0}%` }]} />
      </View>

      <View style={styles.grid}>
        {furniture.map((f) => {
          const mine = owned.find((o) => o.furniture_id === f.id);
          const status = mine
            ? mine.slot
              ? '방에 있어요'
              : `${dateLabel(mine.acquired_at)}에 받았어요`
            : remainingText(f.unlock_rule, progress) ?? unlockText(f.unlock_rule);
          return (
            <View
              key={f.id}
              accessible
              accessibilityLabel={mine ? `${f.name}, ${status}` : `${f.name}, 아직 없어요. ${unlockText(f.unlock_rule)}. ${status}`}
              style={[styles.card, { backgroundColor: mine ? theme.surface : theme.surfaceSunken, borderColor: theme.hairline }]}>
              <View style={styles.art}>
                <FurnitureArt id={f.id} height={44} colors={colors} state={state} locked={!mine} />
              </View>
              <AppText variant="caption" color={mine ? 'ink' : 'steel'} numberOfLines={1}>
                {mine ? f.name : '？'}
              </AppText>
              {!mine && (
                <AppText variant="label" color="steel" numberOfLines={1} style={styles.center}>
                  {unlockText(f.unlock_rule)}
                </AppText>
              )}
              <AppText variant="label" color={mine ? (mine.slot ? 'primary' : 'slate') : 'accentInk'} numberOfLines={2} style={styles.center}>
                {status}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  track: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  card: {
    width: '31.5%',
    flexGrow: 1,
    minHeight: 132,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  art: {
    height: 52,
    justifyContent: 'flex-end',
    marginBottom: Spacing.xxs,
  },
  center: {
    textAlign: 'center',
  },
});
