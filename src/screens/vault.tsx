import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BottomSheet } from '@/components/bottom-sheet';
import { CapsuleCard } from '@/components/capsule-card';
import { DailyNoteCard } from '@/components/daily-note-card';
import { MailboxCard } from '@/components/mailbox-card';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDailyNote, MoodLabels } from '@/lib/daily-note';
import { useSession } from '@/providers/session-provider';
import { kstDate } from '@/utils/date';

/** 마음 보관함 탭 (spec rest-area, mailbox, daily-note, time-capsule / DESIGN.md §5.2). 우체통·한 줄 기록·타임캡슐 */
export function Vault() {
  const theme = useTheme();
  const { profile } = useSession();
  const [noteOpen, setNoteOpen] = useState(false);
  const [todayMood, setTodayMood] = useState<number | null>(null);

  // 한 줄 기록 카드에 오늘 기록 여부를 보인다. 실패하면 기본 문구를 둔다
  const userId = profile?.id;
  const loadTodayNote = useCallback(() => {
    if (!userId) return;
    getDailyNote(userId, kstDate()).then(
      (note) => setTodayMood(note?.mood ?? null),
      () => {},
    );
  }, [userId]);
  useFocusEffect(loadTodayNote);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg" accessibilityRole="header">
          마음 보관함
        </AppText>
      </View>
      <AppText variant="bodySm" color="slate">
        마음을 남기고 받는 곳이에요
      </AppText>

      {profile && (
        <View style={styles.cards}>
          <MailboxCard key={profile.id} userId={profile.id} />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="한 줄 기록 작성하기"
            onPress={() => setNoteOpen(true)}
            style={[
              styles.noteMenu,
              { backgroundColor: theme.surface, borderColor: theme.hairline },
            ]}
          >
            <Feather aria-hidden name="edit-3" size={20} color={theme.accent} />
            <View style={styles.rowText}>
              <AppText variant="titleMd">한 줄 기록</AppText>
              <AppText variant="caption" color="steel">
                {todayMood
                  ? `오늘 기록했어요 · ${MoodLabels[todayMood - 1]}`
                  : '오늘의 기분과 한 줄을 남겨요'}
              </AppText>
            </View>
            <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />
          </PressableScale>
          {noteOpen && (
            <BottomSheet
              title="한 줄 기록"
              onClose={() => {
                setNoteOpen(false);
                loadTodayNote();
              }}
            >
              <DailyNoteCard userId={profile.id} />
            </BottomSheet>
          )}
          <CapsuleCard key={`capsule:${profile.id}`} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cards: {
    marginTop: Spacing.lg,
  },
  noteMenu: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
