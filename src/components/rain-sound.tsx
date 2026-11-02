import { Feather } from '@expo/vector-icons';
import { Slider } from '@expo/ui/community/slider';
import { StyleSheet, View } from 'react-native';

import { AppSwitch } from '@/components/app-switch';
import { AppText } from '@/components/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBackgroundAudio } from '@/providers/background-audio';

/** 빗소리 켜기·끄기와 볼륨 (spec rest-area F12). 켜져 있을 때만 볼륨 슬라이더를 보인다 */
export function RainSound() {
  const theme = useTheme();
  const { playing, volume, toggle, setVolume } = useBackgroundAudio();

  return (
    <>
      <View style={[styles.row, { borderBottomColor: theme.hairline }]}>
        <Feather aria-hidden name="cloud-rain" size={24} color={theme.ink} />
        <AppText style={styles.label}>빗소리 틀어 두기</AppText>
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
          <AppText variant="bodySm" color="slate" tabular>
            {Math.round(volume * 100)}%
          </AppText>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  label: {
    flex: 1,
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
