import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
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

export function Screen({
  children,
  footer,
  scroll = true,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const theme = useTheme();
  const Body = scroll ? ScrollView : View;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: theme.canvas }]}>
      <Body
        style={scroll ? [styles.body, stableScrollbar] : styles.body}
        {...(scroll
          ? { contentContainerStyle: styles.content, keyboardShouldPersistTaps: 'handled' as const }
          : { style: [styles.body, styles.content] })}
      >
        {children}
      </Body>
      {footer && (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.canvas, boxShadow: '0 -2px 8px rgba(35,40,34,0.06)' },
          ]}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

// 웹에서 스크롤바 자리를 늘 비워 둔다. 내용 높이가 화면 높이와 비슷하면 스크롤바가 생겼다
// 사라졌다 하며 폭이 바뀌고, 폭에 맞춰 높이를 정하는 내 방 그림이 그때마다 커졌다 작아져 떨린다.
const stableScrollbar = Platform.select<ViewStyle>({
  web: { scrollbarGutter: 'stable' } as ViewStyle,
  default: {},
});

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
