import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** 하단 고정 영역 (주요 버튼). DESIGN.md §5.1 */
  footer?: ReactNode;
  scroll?: boolean;
  /** 탭 화면은 탭 바가 하단 safe area를 처리한다 */
  edges?: ('top' | 'bottom')[];
};

export function Screen({ children, footer, scroll = true, edges = ['top', 'bottom'] }: ScreenProps) {
  const theme = useTheme();
  const Body = scroll ? ScrollView : View;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: theme.canvas }]}>
      <Body
        style={styles.body}
        {...(scroll
          ? { contentContainerStyle: styles.content, keyboardShouldPersistTaps: 'handled' as const }
          : { style: [styles.body, styles.content] })}>
        {children}
      </Body>
      {footer && (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.canvas, boxShadow: '0 -2px 8px rgba(43,42,39,0.06)' },
          ]}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
});
