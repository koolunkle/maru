import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** 'sm' = 높이 40 (S4 같이 할래요 등) */
  size?: 'md' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ hovered }) => [
        styles.base,
        size === 'sm' && styles.sm,
        variant === 'primary' && {
          backgroundColor: disabled ? theme.hairline : hovered ? theme.primaryPressed : theme.primary,
        },
        variant === 'secondary' && {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: hovered ? theme.ink : theme.hairlineStrong,
        },
        variant === 'ghost' && styles.ghost,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.onPrimary : theme.ink} />
      ) : (
        <AppText
          variant={variant === 'ghost' ? 'bodySm' : 'button'}
          color={
            variant === 'primary' ? (disabled ? 'muted' : 'onPrimary') : variant === 'ghost' ? 'slate' : 'ink'
          }>
          {label}
        </AppText>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  ghost: {
    height: 44,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'center',
  },
});
