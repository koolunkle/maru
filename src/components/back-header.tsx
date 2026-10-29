import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 상단 헤더 56px: 뒤로 버튼 + 화면 제목 (DESIGN.md §5.1) */
export function BackHeader({ title }: { title?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.back}>
        <Feather aria-hidden name="chevron-left" size={24} color={theme.ink} />
      </PressableScale>
      {title && <AppText variant="titleLg">{title}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
});
