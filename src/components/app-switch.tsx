import { Platform, Switch, type SwitchProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** 토큰 색 스위치. 웹(react-native-web)은 켜진 손잡이 색을 activeThumbColor로만 받는다 */
export function AppSwitch(props: Omit<SwitchProps, 'trackColor' | 'thumbColor'>) {
  const theme = useTheme();
  const web = Platform.OS === 'web' ? { activeThumbColor: theme.surface } : {};
  return (
    <Switch
      trackColor={{ true: theme.primary, false: theme.hairlineStrong }}
      thumbColor={theme.surface}
      {...web}
      {...props}
    />
  );
}
