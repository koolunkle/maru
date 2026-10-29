import { Feather } from '@expo/vector-icons';
import { Slider } from '@expo/ui/community/slider';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppSwitch } from '@/components/app-switch';
import { AppText } from '@/components/app-text';
import { CapsuleCard } from '@/components/capsule-card';
import { DailyNoteCard } from '@/components/daily-note-card';
import { BottomSheet } from '@/components/bottom-sheet';
import { MailboxCard } from '@/components/mailbox-card';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { HelpPlaces } from '@/constants/help';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDailyNote, MoodLabels } from '@/lib/daily-note';
import { useBackgroundAudio } from '@/providers/background-audio';
import { useSession } from '@/providers/session-provider';
import { kstDate } from '@/utils/date';

/** S10 마음 휴게소 (PRD F12·F14·F15·F16 / DESIGN.md §5.2). 위는 마음 보관함, 아래는 도움 안내와 배경음 */
export function Rest() {
  const theme = useTheme();
  const { profile } = useSession();
  const { playing, volume, toggle, setVolume } = useBackgroundAudio();
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
        <AppText variant="titleLg" accessibilityRole="header">마음 휴게소</AppText>
      </View>
      <AppText variant="bodySm" color="slate">언제든 쉬어 갈 수 있는 곳이에요</AppText>

      {profile && (
        <>
          <AppText variant="titleMd" accessibilityRole="header" style={styles.firstSection}>마음 보관함</AppText>
          <MailboxCard key={profile.id} userId={profile.id} />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="한 줄 기록 작성하기"
            onPress={() => setNoteOpen(true)}
            style={[styles.noteMenu, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
            <Feather aria-hidden name="edit-3" size={20} color={theme.accent} />
            <View style={styles.rowText}>
              <AppText variant="titleMd">한 줄 기록</AppText>
              <AppText variant="caption" color="steel">
                {todayMood ? `오늘 기록했어요 · ${MoodLabels[todayMood - 1]}` : '오늘의 기분과 한 줄을 남겨요'}
              </AppText>
            </View>
            <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />
          </PressableScale>
          {noteOpen && (
            <BottomSheet title="한 줄 기록" onClose={() => { setNoteOpen(false); loadTodayNote(); }}>
              <DailyNoteCard userId={profile.id} />
            </BottomSheet>
          )}
          <CapsuleCard key={`capsule:${profile.id}`} />
        </>
      )}

      <AppText variant="titleMd" accessibilityRole="header" style={styles.sectionTitle}>도움받을 수 있는 곳</AppText>
      <View style={styles.list}>
        {HelpPlaces.map((place) => (
          <PressableScale
            key={place.name}
            accessibilityRole="link"
            accessibilityLabel={`${place.name}, ${place.description}`}
            onPress={() => Linking.openURL(place.url)}
            style={[styles.row, { borderBottomColor: theme.hairline }]}>
            <Feather aria-hidden name={place.icon} size={24} color={theme.ink} />
            <View style={styles.rowText}>
              <AppText>{place.name}</AppText>
              <AppText variant="caption" color="steel">{place.description}</AppText>
            </View>
            <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />
          </PressableScale>
        ))}
      </View>

      <AppText variant="titleMd" accessibilityRole="header" style={styles.sectionTitle}>배경음</AppText>
      <View style={[styles.row, { borderBottomColor: theme.hairline }]}>
        <Feather aria-hidden name="cloud-rain" size={24} color={theme.ink} />
        <AppText style={styles.rowText}>빗소리 틀어 두기</AppText>
        <AppSwitch accessibilityLabel="빗소리 틀어 두기" value={playing} onValueChange={toggle} />
      </View>
      {playing && (
        <View style={styles.volume}>
          <Slider
            style={styles.slider}
            accessibilityLabel="빗소리 볼륨"
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            minimumTrackTintColor={theme.primary}
            value={volume}
            onValueChange={setVolume}
          />
          <AppText variant="bodySm" color="slate" tabular>{Math.round(volume * 100)}%</AppText>
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
  firstSection: {
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
  list: {
    marginTop: Spacing.xs,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    marginTop: Spacing.xxl,
  },
  volume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  slider: {
    flex: 1,
  },
});
