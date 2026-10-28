import { Feather } from '@expo/vector-icons';
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
  icon?: keyof typeof Feather.glyphMap;
  role?: 'checkbox' | 'radio';
};

/** chip-category / chip-category-selected (DESIGN.md) */
export function Chip({ label, selected, onPress, disabled, style, icon, role = 'checkbox' }: ChipProps) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
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
      {icon && <Feather name={icon} size={18} color={selected ? theme.surface : theme.ink} />}
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
    flexDirection: 'row',
    gap: Spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
