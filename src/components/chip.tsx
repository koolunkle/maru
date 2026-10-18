import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** chip-category / chip-category-selected (DESIGN.md) */
export function Chip({ label, selected, onPress, disabled, style }: ChipProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.ink : theme.surface,
          borderColor: selected ? theme.ink : hovered ? theme.hairlineStrong : theme.hairline,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      <AppText variant="bodySm" color={selected ? 'surface' : 'ink'}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
