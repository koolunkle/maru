import { Feather } from '@expo/vector-icons';
import { Slider } from '@expo/ui/community/slider';
import { Linking, StyleSheet, View } from 'react-native';

import { AppSwitch } from '@/components/app-switch';
import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { HelpPlaces } from '@/constants/help';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBackgroundAudio } from '@/providers/background-audio';

/** S10 마음 휴게소 (PRD F12 / DESIGN.md §5.2) */
export function Rest() {
  const theme = useTheme();
  const { playing, volume, toggle, setVolume } = useBackgroundAudio();

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg" accessibilityRole="header">마음 휴게소</AppText>
      </View>
      <AppText variant="bodySm" color="slate">언제든 쉬어 갈 수 있는 곳이에요</AppText>

      <View style={styles.list}>
        {HelpPlaces.map((place) => (
          <PressableScale
            key={place.name}
            accessibilityRole="link"
            accessibilityLabel={`${place.name}, ${place.description}`}
            onPress={() => Linking.openURL(place.url)}
            style={[styles.row, { borderBottomColor: theme.hairline }]}>
            <Feather aria-hidden name={place.icon} size={24} color={theme.ink} />
            <View style={styles.rowText}>
              <AppText>{place.name}</AppText>
              <AppText variant="caption" color="steel">{place.description}</AppText>
            </View>
            <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />
          </PressableScale>
        ))}
      </View>

      <AppText variant="titleMd" accessibilityRole="header" style={styles.sectionTitle}>배경음</AppText>
      <View style={[styles.row, { borderBottomColor: theme.hairline }]}>
        <Feather aria-hidden name="cloud-rain" size={24} color={theme.ink} />
        <AppText style={styles.rowText}>빗소리 틀어 두기</AppText>
        <AppSwitch accessibilityLabel="빗소리 틀어 두기" value={playing} onValueChange={toggle} />
      </View>
      {playing && (
        <View style={styles.volume}>
          <Slider
            style={styles.slider}
            accessibilityLabel="빗소리 볼륨"
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            minimumTrackTintColor={theme.primary}
            value={volume}
            onValueChange={setVolume}
          />
          <AppText variant="bodySm" color="slate" tabular>{Math.round(volume * 100)}%</AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  list: {
    marginTop: Spacing.lg,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    marginTop: Spacing.xxl,
  },
  volume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  slider: {
    flex: 1,
  },
});
