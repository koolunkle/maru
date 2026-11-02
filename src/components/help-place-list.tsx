import { Feather } from '@expo/vector-icons';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { HelpPlaces } from '@/constants/help';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 도움받을 수 있는 곳 세 곳 (spec rest-area). 별도 화면(S10)과 마음 보관함 바텀시트가 같이 쓴다 */
export function HelpPlaceList() {
  const theme = useTheme();
  return (
    <View>
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
  rowText: {
    flex: 1,
    gap: 2,
  },
});
