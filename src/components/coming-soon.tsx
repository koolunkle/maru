import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';

/** 아직 구현 전인 탭의 임시 화면 (PRD §8.1 일정에 따라 교체) */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Screen edges={['top']} scroll={false}>
      <View style={styles.header}>
        <AppText variant="titleLg">{title}</AppText>
      </View>
      <View style={styles.body}>
        <AppText color="steel">곧 열려요</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.section,
  },
});
