import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { HelpPlaceList } from '@/components/help-place-list';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';

/** S10 도움받을 수 있는 곳 (spec rest-area / DESIGN.md §5.2). 주간 리포트·설정에서 연다. 마음 보관함은 같은 목록을 바텀시트로 연다 */
export function Help() {
  return (
    <Screen>
      <BackHeader title="도움받을 수 있는 곳" />
      <AppText variant="bodySm" color="slate">
        필요할 때 언제든 닿을 수 있는 서울시 창구예요
      </AppText>

      <View style={styles.list}>
        <HelpPlaceList />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: Spacing.lg,
  },
});
