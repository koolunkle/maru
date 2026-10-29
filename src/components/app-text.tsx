import { Text, type TextProps } from 'react-native';

import { Typography, type ThemeColors, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
  /** 숫자 자리 맞춤 (연속 출석, 달성률) */
  tabular?: boolean;
};

export function AppText({
  variant = 'bodyMd',
  color = 'ink',
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        Typography[variant],
        { color: theme[color] },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
