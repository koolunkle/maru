import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DemoLetter, demoLetterWeeks, formatLetterWeek } from '@/utils/weekly-letter';

/** F13 MVP: 개인 기록을 읽지 않는 시연용 주간 편지. */
export function Letter({ week }: { week: string }) {
  const theme = useTheme();
  const weeks = demoLetterWeeks();
  const current = weeks[0];
  const isCurrent = week === current;
  const available = weeks.includes(week);
  const goToCurrent = () => router.replace({ pathname: '/letter/[week]', params: { week: current } });

  return (
    <Screen>
      <BackHeader title={isCurrent ? '이번 주 편지' : '지난 편지'} />
      {!available ? (
        <View style={styles.section}>
          <AppText accessibilityRole="alert">이 주차의 시연용 편지는 준비되어 있지 않아요.</AppText>
          <Button label="이번 주 마음 리포트 보기" onPress={goToCurrent} />
        </View>
      ) : (
        <>
          <AppText variant="caption" color="steel" tabular>{formatLetterWeek(week)}</AppText>
          <View style={[styles.letter, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
            <AppText variant="caption" color="steel">시연용 마음 리포트</AppText>
            <AppText variant="caption" color="slate">{DemoLetter.notice}</AppText>
            <AppText variant="titleMd" accessibilityRole="header">한 주의 마음 흐름</AppText>
            <AppText variant="caption" color="steel">위는 가벼움, 아래는 무거움을 나타내요.</AppText>
            <View style={styles.flow}>
              {DemoLetter.flow.map((day) => (
                <View key={day.day} style={styles.day} accessible accessibilityLabel={`${day.day}요일, ${day.mood}, 시연용`}>
                  <View style={styles.plot}>
                    <View style={[styles.bar, { height: (6 - day.level) * 16, backgroundColor: theme.primarySoft }]}>
                      <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                    </View>
                  </View>
                  <AppText variant="caption" color="steel">{day.day}</AppText>
                </View>
              ))}
            </View>
            <AppText variant="caption" color="steel">한 줄 예시</AppText>
            <AppText>{DemoLetter.note}</AppText>
            <AppText variant="caption" color="steel">미션 예시</AppText>
            <AppText>{DemoLetter.mission}</AppText>
            {DemoLetter.paragraphs.map((paragraph) => <AppText key={paragraph}>{paragraph}</AppText>)}
          </View>

          <View style={[styles.help, { backgroundColor: theme.helpSoft }]}>
            <AppText variant="titleMd" accessibilityRole="header">도움을 받을 수 있는 곳을 살펴볼까요?</AppText>
            <AppText variant="caption" color="slate">마음이 무거운 날에는 이야기를 들어줄 곳을 편하게 찾아봐도 좋아요.</AppText>
            <Button label="도움 안내 보기" variant="secondary" onPress={() => router.push('/settings')} />
          </View>

          <View style={styles.section}>
            <AppText variant="titleMd" accessibilityRole="header">지난 편지</AppText>
            <AppText variant="caption" color="steel">지난 주차도 같은 시연용 내용이에요. 실제 보관 이력이 아니에요.</AppText>
            {weeks.slice(1).map((previous) => (
              <PressableScale
                key={previous}
                accessibilityRole="link"
                accessibilityLabel={`${formatLetterWeek(previous)} 시연용 편지${previous === week ? ', 보고 있는 편지' : ''}`}
                accessibilityState={{ selected: previous === week }}
                onPress={() => router.replace({ pathname: '/letter/[week]', params: { week: previous } })}
                style={[styles.row, { borderBottomColor: theme.hairline }]}>
                <View style={styles.rowText}>
                  <AppText variant="caption" color={previous === week ? 'primary' : 'steel'} tabular>{formatLetterWeek(previous)}</AppText>
                  <AppText numberOfLines={1}>{DemoLetter.paragraphs[0]}</AppText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.steel} />
              </PressableScale>
            ))}
            {!isCurrent && <Button label="이번 주 마음 리포트 보기" variant="ghost" onPress={goToCurrent} />}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  letter: { marginTop: Spacing.sm, padding: Spacing.lg, borderWidth: 1, borderRadius: Radius.lg, gap: Spacing.sm },
  section: { marginTop: Spacing.xxl, gap: Spacing.xs },
  help: { marginTop: Spacing.xxl, padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.sm },
  flow: { flexDirection: 'row', gap: Spacing.xxs },
  day: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  plot: { height: 88, justifyContent: 'flex-end' },
  bar: { width: 16, borderRadius: Radius.full, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: Radius.full, marginTop: Spacing.xxs },
  row: { minHeight: 56, paddingVertical: Spacing.xs, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderBottomWidth: 1 },
  rowText: { flex: 1, gap: Spacing.xxs },
});
