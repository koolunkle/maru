import { BackHeader } from '@/components/back-header';
import { HelpPlaceList } from '@/components/help-place-list';
import { Screen } from '@/components/screen';

/** S10 도움받을 수 있는 곳 (spec mind-vault / DESIGN.md §5.2). 주간 리포트·설정에서 연다. 마음 보관함은 같은 목록을 바텀시트로 연다 */
export function Help() {
  return (
    <Screen>
      <BackHeader title="도움받을 수 있는 곳" />
      <HelpPlaceList />
    </Screen>
  );
}
