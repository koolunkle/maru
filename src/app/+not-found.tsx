import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';

/** 없는 주소 (Expo Router 기본 Unmatched 화면 대신) */
export default function NotFound() {
  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="titleLg" accessibilityRole="header">찾는 화면이 없어요</AppText>
        <AppText color="slate">주소가 바뀌었거나 없어진 화면이에요.</AppText>
        <Button label="홈으로" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
});
