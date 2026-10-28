import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AiCard } from '@/components/ai-card';
import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MoodLabels } from '@/lib/daily-note';
import { supabase } from '@/lib/supabase';
import { demoLetterWeeks, formatLetterWeek } from '@/utils/weekly-letter';
import { formatDayWithWeekday, kstWeekStart } from '@/utils/date';

type Report = {
  body: string;
  source: 'ai' | 'rule';
  notes: { note_date: string; mood: number; text: string }[];
  missions: { completed_at: string; missions: { title: string } | null }[];
};


export function Letter({ week }: { week: string }) {
  const theme = useTheme();
  const weeks = demoLetterWeeks();
  const current = weeks[0];
  const available = typeof week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(week) &&
    Number.isFinite(Date.parse(`${week}T00:00:00Z`)) &&
    new Date(`${week}T00:00:00Z`).toISOString().slice(0, 10) === week &&
    kstWeekStart(week) === week && week <= current;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [storedWeeks, setStoredWeeks] = useState<string[]>([]);
  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.functions.invoke<string[]>('write-weekly-letter', { body: { action: 'list' } })
      .then(({ data, error: listError }) => {
        if (!active) return;
        if (listError || !data) setHistoryError(true);
        else setStoredWeeks(data);
      }).catch(() => { if (active) setHistoryError(true); });
    return () => { active = false; };
  }, []);

  async function generate() {
    setLoading(true);
    setError(false);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<Report>('write-weekly-letter', { body: { week } });
      if (invokeError || !data) throw invokeError ?? new Error('empty response');
      setReport(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <BackHeader title={week === current ? '이번 주 편지' : '지난 편지'} />
      {!available ? (
        <View style={styles.section}>
          <AppText accessibilityRole="alert">이 주차의 편지를 볼 수 없어요.</AppText>
          <Button label="이번 주 마음 리포트 보기" onPress={() => router.replace({ pathname: '/letter/[week]', params: { week: current } })} />
        </View>
      ) : (
        <>
          <AppText variant="caption" color="steel" tabular>{formatLetterWeek(week)}</AppText>
          {!report ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
              <AppText variant="titleMd">한 주를 돌아볼까요?</AppText>
              <AppText>편지를 만들 때 이 주의 기분과 한 줄 원문, 완료한 미션이 Google Gemini에 전달돼요.</AppText>
              <AppText variant="caption" color="steel">무료 서비스에서는 입력 내용이 Google의 제품 개선과 사람 검토에 사용될 수 있어요.</AppText>
              <AppText variant="caption" color="steel">기록과 편지는 자동 삭제되지 않아요. 원본을 삭제해도 이미 만든 편지에 내용이 남을 수 있어요.</AppText>
              {error && <AppText color="slate" accessibilityRole="alert">편지를 불러오지 못했어요. 다시 시도해 주세요.</AppText>}
              <Button label="마음 리포트 보기" loading={loading} onPress={generate} />
            </View>
          ) : (
            <>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
                <AppText variant="caption" color="steel">표시한 기록은 현재 저장된 내용이에요. 지난 편지는 생성 당시의 기록을 바탕으로 해요.</AppText>
                <AppText variant="titleMd" accessibilityRole="header">한 주의 마음 흐름</AppText>
                {report.notes.length === 0 ? <AppText>기록한 기분이 없어요.</AppText> : report.notes.map((note) => (
                  <View key={note.note_date}>
                    <AppText variant="caption" color="steel">{formatDayWithWeekday(note.note_date)} · {MoodLabels[note.mood - 1]}</AppText>
                    {!!note.text && <AppText>{note.text}</AppText>}
                  </View>
                ))}
                <AppText variant="titleMd" accessibilityRole="header">완료한 미션</AppText>
                {report.missions.length === 0 ? <AppText>완료한 미션이 없어요.</AppText> : report.missions.map((mission, index) => (
                  <AppText key={index}>{mission.missions?.title ?? '미션'}</AppText>
                ))}
              </View>
              {report.source === 'ai' ? <AiCard>{report.body}</AiCard> : (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
                  <AppText variant="caption" color="steel">기본 편지</AppText><AppText>{report.body}</AppText>
                </View>
              )}
              {report.notes.some((note) => note.mood === 5) && (
                <View style={[styles.help, { backgroundColor: theme.helpSoft }]}>
                  <AppText variant="titleMd">도움을 받을 수 있는 곳을 살펴볼까요?</AppText>
                  <Button label="도움 안내 보기" variant="secondary" onPress={() => router.push('/settings')} />
                </View>
              )}
            </>
          )}
          <View style={styles.section}>
            <AppText variant="titleMd">지난 편지</AppText>
            {historyError && <AppText color="slate" accessibilityRole="alert">보관된 지난 편지를 불러오지 못했어요. 화면을 다시 열어 주세요.</AppText>}
            {[...new Set([...weeks.slice(1), ...storedWeeks])].filter((previous) => previous < current).sort().reverse().map((previous) => (
              <PressableScale key={previous} accessibilityRole="link" onPress={() => router.replace({ pathname: '/letter/[week]', params: { week: previous } })} style={[styles.row, { borderBottomColor: theme.hairline }]}>
                <AppText tabular>{formatLetterWeek(previous)}</AppText>
              </PressableScale>
            ))}
            {week !== current && <Button label="이번 주 마음 리포트 보기" variant="ghost" onPress={() => router.replace({ pathname: '/letter/[week]', params: { week: current } })} />}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.sm, padding: Spacing.lg, borderWidth: 1, borderRadius: Radius.lg, gap: Spacing.sm },
  section: { marginTop: Spacing.xxl, gap: Spacing.xs },
  help: { marginTop: Spacing.xxl, padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.sm },
  row: { minHeight: 56, paddingVertical: Spacing.xs, justifyContent: 'center', borderBottomWidth: 1 },
});
