import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { kstDate, kstWeekStart } from '@/utils/date';
import { currentStreak } from '@/utils/streak';

const Weekdays = ['월', '화', '수', '목', '금', '토', '일'];

type Stats = {
  weekRate: number | null;
  weekDone: number;
  weekStarted: number;
  attended: Set<string>;
};

async function fetchStats(userId: string, today: string): Promise<Stats> {
  const monthStart = `${today.slice(0, 8)}01`;
  const weekStart = kstWeekStart(today);
  const from = weekStart < monthStart ? weekStart : monthStart;
  const { data, error } = await supabase
    .from('user_missions')
    .select('type, status, started_at, completed_at')
    .eq('user_id', userId)
    .gte('started_at', `${from}T00:00:00+09:00`);
  if (error) throw error;

  const week = data.filter((um) => um.type === 'daily' && kstDate(new Date(um.started_at)) >= weekStart);
  const weekDone = week.filter((um) => um.status === 'completed').length;
  const attended = new Set(
    data.filter((um) => um.status === 'completed' && um.completed_at).map((um) => kstDate(new Date(um.completed_at!))),
  );
  return {
    weekRate: week.length ? Math.round((weekDone / week.length) * 100) : null,
    weekDone,
    weekStarted: week.length,
    attended,
  };
}

/** 이번 달 달력 칸: 앞쪽 빈칸(null) + 날짜 */
function monthCells(today: string) {
  const [y, m] = today.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`),
  ];
}

/** S7 기록과 F13 마음 리포트 진입. */
export function Record() {
  const theme = useTheme();
  const { session, profile } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const today = kstDate();

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      fetchStats(session.user.id, today).then(
        (s) => active && setStats(s),
        () => active && setStats({ weekRate: null, weekDone: 0, weekStarted: 0, attended: new Set() }),
      );
      return () => {
        active = false;
      };
    }, [session, today]),
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg">기록</AppText>
      </View>

      {!stats ? (
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      ) : (
        <>
          <View style={styles.section}>
            <AppText variant="label" color="steel">
              이번 주 달성률
            </AppText>
            <AppText variant="display" tabular>
              {stats.weekRate === null ? '-' : `${stats.weekRate}%`}
            </AppText>
            <View style={[styles.track, { backgroundColor: theme.surfaceSunken }]}>
              <View style={[styles.fill, { backgroundColor: theme.primary, width: `${stats.weekRate ?? 0}%` }]} />
            </View>
            <AppText variant="caption" color="steel" tabular>
              시작한 오늘의 미션 {stats.weekStarted}개 중 {stats.weekDone}개 완료 · 연속 {profile ? currentStreak(profile, kstDate()) : 0}일째
            </AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="titleMd">{Number(today.slice(5, 7))}월 출석</AppText>
            <View style={styles.grid}>
              {Weekdays.map((w) => (
                <AppText key={w} variant="caption" color="steel" style={styles.cell}>
                  {w}
                </AppText>
              ))}
              {monthCells(today).map((day, i) => {
                const on = day !== null && stats.attended.has(day);
                return (
                  <View key={day ?? `pad-${i}`} style={styles.cell}>
                    {day && (
                      <View
                        style={[
                          styles.dot,
                          on && { backgroundColor: theme.accentSoft },
                          day === today && !on && { borderWidth: 1, borderColor: theme.hairlineStrong },
                        ]}>
                        <AppText variant="caption" color={on ? 'accentInk' : 'slate'} tabular>
                          {Number(day.slice(8))}
                        </AppText>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}
      <View style={[styles.letter, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
        <AppText variant="label" color="steel">이번 주 편지</AppText>
        <AppText>기분과 한 줄, 완료한 미션을 돌아봐요.</AppText>
        <Button
          label="이번 주 마음 리포트 보기"
          variant="ghost"
          onPress={() => router.push({ pathname: '/letter/[week]', params: { week: kstWeekStart() } })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
  },
  loading: {
    marginTop: Spacing.section,
  },
  section: {
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  letter: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  track: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: Spacing.xxs,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
