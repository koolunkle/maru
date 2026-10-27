import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listCapsules, openCapsule, sendCapsule, type Capsule } from '@/lib/capsule';
import { createMailboxRequestId } from '@/lib/mailbox';

export function CapsuleScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [items, setItems] = useState<Capsule[]>([]);
  const [body, setBody] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const working = useRef(false);
  const requestId = useRef(createMailboxRequestId());
  const autoOpened = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const capsules = await listCapsules();
      setItems(capsules); setError('');
      const arrival = capsules.find((item) => item.id === id && item.ready);
      if (arrival && !autoOpened.current) {
        autoOpened.current = true;
        const text = arrival.opened_at ? arrival.body : await openCapsule(arrival.id);
        setSelected(text);
        if (!arrival.opened_at) setItems(await listCapsules());
      }
    }
    catch { setError('캡슐을 불러오지 못했어요. 다시 시도해 주세요.'); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const locked = items.filter((item) => !item.ready).length;
  async function send() {
    if (working.current || !body.trim()) return;
    working.current = true; setBusy(true); setError('');
    try {
      await sendCapsule(body.trim(), days, requestId.current);
      requestId.current = createMailboxRequestId(); setPending(false); setBody('');
      await load();
    } catch (cause) {
      const rejected = typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'P0001';
      setPending(!rejected);
      setError(rejected ? '보낼 수 없어요. 잠긴 캡슐 수와 내용을 확인해 주세요.' : '보내지 못했어요. 같은 내용으로 다시 눌러 주세요.');
    }
    finally { working.current = false; setBusy(false); }
  }
  async function open(item: Capsule) {
    if (working.current || !item.ready) return;
    if (item.opened_at) { setSelected(item.body); return; }
    working.current = true; setBusy(true); setError('');
    try { const text = await openCapsule(item.id); setSelected(text); await load(); }
    catch { setError('캡슐을 열지 못했어요. 다시 눌러 볼까요?'); }
    finally { working.current = false; setBusy(false); }
  }
  return (
    <Screen footer={<Button label={pending ? '다시 보내기' : '보내기'} onPress={send} loading={busy} disabled={loading || (!pending && locked >= 5) || !body.trim()} />}>
      <BackHeader title="타임캡슐" />
      <AppText color="slate">미래의 나에게 한 줄을 보내요. 나만 볼 수 있어요.</AppText>
      <View style={styles.section}>
        <AppText variant="titleMd" accessibilityRole="header">보낸 캡슐</AppText>
        {loading ? <ActivityIndicator color={theme.primary} /> : items.length === 0 ? <AppText color="slate">아직 보낸 캡슐이 없어요.</AppText> : items.map((item) => (
          <PressableScale key={item.id} accessibilityRole="button" disabled={!item.ready || busy} onPress={() => open(item)}
            accessibilityLabel={item.ready ? `${item.open_on} 캡슐 열기` : `${item.open_on}에 열리는 캡슐`}
            style={[styles.row, { borderColor: theme.hairline }]}>
            <Feather name={item.opened_at ? 'unlock' : 'lock'} size={20} color={theme.accent} />
            <View style={styles.rowText}><AppText>{item.open_on} {item.ready && !item.opened_at ? '도착했어요' : '열리는 날'}</AppText>{item.opened_at && <AppText numberOfLines={1} color="slate">{item.body}</AppText>}</View>
          </PressableScale>
        ))}
        {selected !== null && <View style={[styles.message, { backgroundColor: theme.primarySoft }]}><AppText variant="titleMd">과거의 내가 보낸 한 줄</AppText><AppText>{selected}</AppText></View>}
      </View>
      <View style={styles.section}>
        <AppText variant="titleMd" accessibilityRole="header">새 캡슐 쓰기</AppText>
        <TextInput accessibilityLabel="미래의 나에게 보낼 한 줄" multiline maxLength={100} value={body} onChangeText={setBody} editable={!busy && !pending}
          placeholder="미래의 나에게 한 줄을 남겨 볼까요?" placeholderTextColor={theme.muted}
          style={[styles.input, Typography.bodyMd, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.hairlineStrong }]} />
        <AppText variant="caption" color="steel" style={styles.counter}>{body.length}/100</AppText>
        <View accessibilityRole="radiogroup" accessibilityLabel="열리는 날" style={styles.chips}>
          {[7, 30, 100].map((day) => <Chip key={day} label={`${day}일 뒤`} selected={days === day} role="radio" disabled={busy || pending} onPress={() => setDays(day)} />)}
        </View>
        {locked >= 5 && !pending && <AppText color="slate">잠긴 캡슐은 최대 5개까지 보낼 수 있어요.</AppText>}
        {error !== '' && <><AppText accessibilityRole="alert" color="slate">{error}</AppText>{!pending && <Button label="다시 불러오기" variant="secondary" onPress={load} />}</>}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl, gap: Spacing.xs },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderBottomWidth: 1, paddingVertical: Spacing.xs },
  rowText: { flex: 1 },
  message: { padding: Spacing.md, borderRadius: Radius.md, gap: Spacing.xs },
  input: { minHeight: 90, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, textAlignVertical: 'top' },
  counter: { textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
