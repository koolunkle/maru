import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MinuteOptionProps = {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

/** S2 3단계 선택지: card-base, 선택 시 primary 2px 테두리 */
export function MinuteOption({ label, description, selected, onPress }: MinuteOptionProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ hovered }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: selected ? theme.primary : hovered ? theme.hairlineStrong : theme.hairline,
          borderWidth: selected ? 2 : 1,
          padding: selected ? Spacing.lg - 1 : Spacing.lg,
        },
      ]}>
      <View style={styles.text}>
        <AppText variant="titleMd">{label}</AppText>
        <AppText variant="bodySm" color="slate">
          {description}
        </AppText>
      </View>
      {selected && <Feather aria-hidden name="check" size={20} color={theme.primary} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.xxs,
  },
});
