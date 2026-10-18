import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** ai-card (DESIGN.md §5.3): AI가 만든 텍스트는 이 컴포넌트로만 표시한다 */
export function AiCard({ children, footer }: { children: string; footer?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
      <AppText variant="label" color="primary">
        AI
      </AppText>
      <AppText>{children}</AppText>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
});
