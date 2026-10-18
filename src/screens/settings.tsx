import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

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
  icon?: ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
};

function Row({ label, value, icon, onPress }: RowProps) {
  const theme = useTheme();
  return (
    <PressableScale
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'link' : undefined}
      style={[styles.row, { borderBottomColor: theme.hairline }]}>
      {icon && <Feather name={icon} size={20} color={theme.ink} />}
      <AppText style={styles.rowLabel}>{label}</AppText>
      {value && (
        <AppText variant="bodySm" color="slate">
          {value}
        </AppText>
      )}
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
        <Row label="관심 카테고리" value={profile?.categories.map((c) => CategoryLabel[c]).join(', ')} />
        <Row label="생활권" value={profile?.district ?? undefined} />
        <Row label="하루 가능 시간" value={minutes} />
      </View>

      <AppText variant="label" color="steel" style={styles.groupTitle}>
        도움받을 수 있는 곳
      </AppText>
      <View style={styles.group}>
        <Row label="외로움안녕120" value="전화 120" icon="phone" onPress={() => Linking.openURL('tel:120')} />
        <Row
          label="서울마음편의점"
          icon="map-pin"
          onPress={() => Linking.openURL('https://www.google.com/search?q=서울마음편의점')}
        />
      </View>

      <AppText variant="caption" color="steel" style={styles.credits}>
        미션 출처: 365 서울챌린지(서울특별시), 서울 열린데이터광장{'\n'}글꼴: Pretendard (SIL Open Font License)
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: Spacing.md,
  },
  groupTitle: {
    marginTop: Spacing.xxl,
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
