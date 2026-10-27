import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DailyNoteMaxLength, deleteDailyNote, getDailyNote, saveDailyNote, type DailyNote } from '@/lib/daily-note';
import { kstDate } from '@/utils/date';

const Moods = [
  { value: 1, label: '마음이 가벼워요', icon: 'sun' },
  { value: 2, label: '조금 가벼워요', icon: 'sunrise' },
  { value: 3, label: '보통이에요', icon: 'cloud' },
  { value: 4, label: '조금 무거워요', icon: 'cloud-drizzle' },
  { value: 5, label: '마음이 무거워요', icon: 'cloud-rain' },
] as const;

/** F15: 본인만 볼 수 있는 오늘의 기분과 한 줄. */
export function DailyNoteCard({ userId }: { userId: string }) {
  const theme = useTheme();
  const [today, setToday] = useState(kstDate);
  const [reload, setReload] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<DailyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dayChanged, setDayChanged] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dirty = useRef(false);
  const working = useRef(false);
  const loadedDay = useRef(today);

  useEffect(() => {
    const refreshDay = () => setToday(kstDate());
    const timer = setInterval(refreshDay, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDay();
    });
    return () => {
      clearInterval(timer);
      subscription?.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      // 재시도 버튼은 조회 버전을 바꿔 같은 날짜를 다시 불러온다.
      void reload;
      if (dirty.current || working.current) {
        if (loadedDay.current !== today) {
          setDayChanged(true);
          setConfirmDelete(false);
          setNotice('날짜가 바뀌었어요. 작성 중인 내용을 복사한 뒤 오늘 기록을 다시 불러와 주세요.');
        }
        return;
      }
      if (loadedDay.current !== today) setConfirmDelete(false);
      setLoading(true);
      setLoadError(false);
      setDayChanged(false);
      getDailyNote(userId, today).then(
        (note) => {
          if (!active || dirty.current || working.current) return;
          loadedDay.current = today;
          setSaved(note);
          setMood(note?.mood ?? null);
          setText(note?.text ?? '');
          setNotice(null);
          setLoading(false);
        },
        () => {
          if (!active) return;
          setLoadError(true);
          setLoading(false);
        },
      );
      return () => {
        active = false;
      };
    }, [userId, today, reload]),
  );

  function checkDay() {
    const current = kstDate();
    if (current === today && !dayChanged) return true;
    setToday(current);
    setDayChanged(true);
    setConfirmDelete(false);
    setNotice('날짜가 바뀌었어요. 작성 중인 내용을 복사한 뒤 오늘 기록을 다시 불러와 주세요.');
    return false;
  }

  async function save() {
    if (working.current || mood === null || !checkDay()) return;
    working.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const note = await saveDailyNote(userId, today, mood, text);
      dirty.current = false;
      setSaved(note);
      loadedDay.current = note.note_date;
      setNotice('오늘의 기록을 저장했어요.');
      setConfirmDelete(false);
      const current = kstDate();
      if (note.note_date !== current) {
        setToday(current);
        setReload((value) => value + 1);
      }
    } catch {
      const current = kstDate();
      if (current !== today) {
        setToday(current);
        setDayChanged(true);
        setNotice('날짜가 바뀌었어요. 작성 중인 내용을 복사한 뒤 오늘 기록을 다시 불러와 주세요.');
      } else {
        setNotice('기록을 저장하지 못했어요. 다시 눌러 볼까요?');
      }
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function remove() {
    if (working.current || !saved || !checkDay()) return;
    working.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await deleteDailyNote(userId, saved.note_date);
      dirty.current = false;
      setSaved(null);
      setMood(null);
      setText('');
      setConfirmDelete(false);
      setNotice('오늘의 기록을 삭제했어요.');
    } catch {
      setNotice('기록을 삭제하지 못했어요. 다시 눌러 볼까요?');
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  function discardAndReload() {
    dirty.current = false;
    setDayChanged(false);
    setReload((value) => value + 1);
  }

  return (
    <View style={styles.section}>
      <AppText variant="titleMd" accessibilityRole="header">
        오늘 한 줄
      </AppText>
      {loading ? (
        <ActivityIndicator color={theme.primary} accessibilityLabel="오늘 기록 불러오는 중" />
      ) : loadError ? (
        <>
          <AppText variant="bodySm" color="slate" accessibilityRole="alert">
            오늘의 기록을 불러오지 못했어요.
          </AppText>
          <Button label="다시 불러오기" variant="secondary" onPress={discardAndReload} />
        </>
      ) : (
        <>
          <AppText variant="bodySm" color="slate">
            오늘 마음은 어떤가요? 이 기록은 나만 볼 수 있어요.
          </AppText>
          <View accessibilityRole="radiogroup" accessibilityLabel="오늘의 기분" style={styles.moods}>
            {Moods.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                icon={item.icon}
                role="radio"
                selected={mood === item.value}
                disabled={busy}
                onPress={() => {
                  dirty.current = true;
                  setMood(item.value);
                  if (!dayChanged) setNotice(null);
                  setConfirmDelete(false);
                }}
              />
            ))}
          </View>
          <TextInput
            accessibilityLabel="오늘의 한 줄"
            accessibilityHint="선택 사항이며 60자까지 적을 수 있어요"
            value={text}
            onChangeText={(value) => {
              dirty.current = true;
              setText(value.slice(0, DailyNoteMaxLength));
              if (!dayChanged) setNotice(null);
              setConfirmDelete(false);
            }}
            maxLength={DailyNoteMaxLength}
            placeholder="오늘을 한 줄로 남겨 볼까요? (선택)"
            placeholderTextColor={theme.muted}
            editable={!busy}
            multiline
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[
              styles.input,
              Typography.bodyMd,
              {
                color: theme.ink,
                backgroundColor: theme.surface,
                borderColor: focused ? theme.primary : theme.hairlineStrong,
                borderWidth: focused ? 2 : 1,
              },
            ]}
          />
          <AppText variant="caption" color="steel" tabular style={styles.counter}>
            {text.length}/{DailyNoteMaxLength}
          </AppText>
          {notice && (
            <AppText variant="caption" color="slate" accessibilityLiveRegion="polite">
              {notice}
            </AppText>
          )}
          {dayChanged ? (
            <Button label="오늘 기록 다시 불러오기" variant="secondary" onPress={discardAndReload} />
          ) : (
            <Button label="저장하기" onPress={save} disabled={mood === null} loading={busy} />
          )}
          {saved &&
            !dayChanged &&
            (confirmDelete ? (
              <>
                <AppText variant="bodySm" color="slate">
                  저장한 기록과 작성 중인 내용을 지울까요?
                </AppText>
                <Button label="기록 삭제" variant="secondary" onPress={remove} loading={busy} />
                <Button label="취소" variant="ghost" onPress={() => setConfirmDelete(false)} disabled={busy} />
              </>
            ) : (
              <Button label="오늘 기록 삭제" variant="ghost" onPress={() => setConfirmDelete(true)} disabled={busy} />
            ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl, gap: Spacing.xs },
  moods: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.xs },
  input: { minHeight: 64, borderRadius: Radius.md, padding: Spacing.sm, textAlignVertical: 'top' },
  counter: { textAlign: 'right' },
});
