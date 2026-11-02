import { Feather } from '@expo/vector-icons';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { HelpPlaces } from '@/constants/help';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** S10 도움받을 수 있는 곳 (spec rest-area / DESIGN.md §5.2). 주간 리포트·설정·마음 보관함에서 연다 */
export function Help() {
  const theme = useTheme();

  return (
    <Screen>
      <BackHeader title="도움받을 수 있는 곳" />
      <AppText variant="bodySm" color="slate">
        필요할 때 언제든 닿을 수 있는 서울시 창구예요
      </AppText>

      <View style={styles.list}>
        {HelpPlaces.map((place) => (
          <PressableScale
            key={place.name}
            accessibilityRole="link"
            accessibilityLabel={`${place.name}, ${place.description}`}
            onPress={() => Linking.openURL(place.url)}
            style={[styles.row, { borderBottomColor: theme.hairline }]}
          >
            <Feather aria-hidden name={place.icon} size={24} color={theme.ink} />
            <View style={styles.rowText}>
              <AppText>{place.name}</AppText>
              <AppText variant="caption" color="steel">
                {place.description}
              </AppText>
            </View>
            <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />
          </PressableScale>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
