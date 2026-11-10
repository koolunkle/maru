import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

/** 우체통 시트의 여러 화면이 함께 쓰는 모양 */
export const mailboxStyles = StyleSheet.create({
  button: { borderRadius: Radius.lg },
  row: {
    minHeight: 56,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
    gap: Spacing.xxs,
    borderBottomWidth: 1,
  },
});
