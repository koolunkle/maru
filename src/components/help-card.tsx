import { Feather } from '@expo/vector-icons';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** help-card (DESIGN.md §5.3): 위기 표현 감지 시. 빨간색·경고 아이콘을 쓰지 않는다. */
export function HelpCard({ subject = '이 댓글' }: { subject?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.helpSoft }]} accessibilityRole="summary">
      <View style={styles.title}>
        <Feather name="phone" size={18} color={theme.ink} />
        <AppText variant="titleMd">이야기를 들어줄 곳이 있어요</AppText>
      </View>
      <AppText variant="bodySm" color="slate">
        외로움안녕120은 누구나 편하게 전화해 이야기할 수 있는 서울시 창구예요. {subject}은 공개되지 않았어요.
      </AppText>
      <Button label="외로움안녕120 전화하기" onPress={() => Linking.openURL('tel:120')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
