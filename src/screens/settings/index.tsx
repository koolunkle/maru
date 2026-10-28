import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { CategoryLabel, DailyMinuteOptions } from '@/constants/domain';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/providers/session-provider';

type RowProps = {
  label: string;
  value?: string;
  /** 앱 안 화면으로 이동하는 행이면 오른쪽에 chevron 표시 */
  chevron?: boolean;
  onPress?: () => void;
};

function Row({ label, value, chevron, onPress }: RowProps) {
  const theme = useTheme();
  return (
    <PressableScale
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'link' : undefined}
      style={[styles.row, { borderBottomColor: theme.hairline }]}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      {value && (
        <AppText variant="bodySm" color="slate">
          {value}
        </AppText>
      )}
      {chevron && <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />}
    </PressableScale>
  );
}

/** S9 설정 (DESIGN.md §5.2) */
export function Settings() {
  const { profile } = useSession();
  const minutes = DailyMinuteOptions.find((o) => o.value === profile?.daily_minutes)?.label;

  return (
    <Screen>
      <BackHeader title="설정" />

      <View style={styles.group}>
        <Row label="닉네임" value={profile?.nickname} />
        <Row
          label="관심 카테고리"
          value={profile?.categories.map((c) => CategoryLabel[c]).join(', ')}
          chevron
          onPress={() => router.push('/settings/categories')}
        />
        <Row
          label="생활권"
          value={profile?.district ?? undefined}
          chevron
          onPress={() => router.push('/settings/district')}
        />
        <Row label="하루 가능 시간" value={minutes} chevron onPress={() => router.push('/settings/minutes')} />
      </View>

      <AppText variant="caption" color="steel" style={styles.credits}>
        미션 출처: 365 서울챌린지(서울특별시), 서울 열린데이터광장{'\n'}글꼴: Pretendard (SIL Open Font License){'\n'}배경음: DesiFreeMusic, Pixabay Content License
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: Spacing.md,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  rowLabel: {
    flex: 1,
  },
  credits: {
    marginTop: Spacing.xxl,
  },
});
