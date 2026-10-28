import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { HelpCard } from '@/components/help-card';
import { PressableScale } from '@/components/pressable-scale';
import { MaxContentWidth, Radius, SheetScrim, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createMailboxRequestId,
  getReceivedMailboxMessages,
  MailboxMaxLength,
  MailboxStatus,
  markMailboxMessageRead,
  sendMailboxMessage,
  type MailboxMessage,
  type ReceivedMailboxMessage,
} from '@/lib/mailbox';
import { kstDate } from '@/utils/date';

const DeliveryNotice = '검수를 거친 뒤 다른 사람에게 전달돼요. 이름이나 연락처는 함께 보내지 않아요.';

/** F14: 미션·릴레이와 관계없이 익명 사용자에게 한 줄을 작성한다. */
export function MailboxCard({ userId }: { userId: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<MailboxMessage | null>(null);
  const [mode, setMode] = useState<'welcome' | 'read' | 'compose'>('welcome');
  const [received, setReceived] = useState<ReceivedMailboxMessage[]>([]);
  const [selected, setSelected] = useState<ReceivedMailboxMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sending = useRef(false);
  const requestId = useRef(createMailboxRequestId());
  const loadVersion = useRef(0);
  const opened = useRef(false);
  const unread = received.filter((message) => !message.read_at).length;
  const accepted = submitted?.status === 'approved' || submitted?.status === 'published';
  const resultTitle = accepted
    ? '한 줄을 맡겼어요'
    : submitted?.status === 'pending'
      ? '검수를 기다리고 있어요'
      : '이 한 줄은 전달되지 않았어요';

  const read = useCallback(async (message: ReceivedMailboxMessage) => {
    if (sending.current) return;
    setSelected(message);
    setMode('read');
    setNotice(null);
    if (message.read_at) return;
    sending.current = true;
    setBusy(true);
    try {
      const updated = await markMailboxMessageRead(message.id);
      setSelected(updated);
      setReceived((messages) => messages.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setNotice('읽음 표시를 저장하지 못했어요. 다시 눌러볼까요?');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }, []);

  const reload = useCallback(async (openLatest = false) => {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError(false);
    try {
      const inbox = await getReceivedMailboxMessages();
      if (version !== loadVersion.current) return;
      setReceived(inbox);
      if (openLatest && inbox[0]) void read(inbox[0]);
      if (inbox.some((message) => !message.read_at) && !opened.current) {
        const key = `@seoul-challenge/mailbox-arrival/${userId}`;
        const today = kstDate();
        // 알림 기록을 읽지 못해도 수신함은 수동으로 열 수 있다.
        try {
          const lastShown = await AsyncStorage.getItem(key);
          if (version !== loadVersion.current || opened.current || lastShown === today) return;
          await AsyncStorage.setItem(key, today);
          if (version !== loadVersion.current || opened.current) return;
          opened.current = true;
          setMode('welcome');
          setVisible(true);
          if (inbox[0]) void read(inbox[0]);
        } catch {}
      }
    } catch {
      if (version === loadVersion.current) setLoadError(true);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [userId, read]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        loadVersion.current += 1;
      };
    }, [reload]),
  );

  function close() {
    if (sending.current) return;
    Keyboard.dismiss();
    setVisible(false);
    opened.current = false;
    setFocused(false);
  }

  async function send(retry?: MailboxMessage) {
    const text = retry?.body ?? body;
    if (sending.current || !text.trim() || text.trim().length > MailboxMaxLength) return;
    sending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const message = await sendMailboxMessage(userId, text, retry?.request_id ?? requestId.current);
      Keyboard.dismiss();
      setSubmitted(message);
      if (!retry) {
        setBody('');
        requestId.current = createMailboxRequestId();
      }
      setFocused(false);
    } catch {
      setNotice('한 줄을 맡기지 못했어요. 다시 눌러볼까요?');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <PressableScale accessibilityRole="button" accessibilityLabel={`마음 우체통, 아직 읽지 않은 한 줄 ${unread}개`} onPress={() => {
        setSubmitted(null); setNotice(null); setSelected(null); setMode('welcome');
        opened.current = true; setVisible(true); void reload(true);
      }} style={({ hovered }) => [styles.card, { backgroundColor: theme.surface, borderColor: hovered ? theme.hairlineStrong : theme.hairline }]}>
        <Feather name="mail" size={24} color={theme.accent} />
        <View style={styles.cardText}>
          <AppText variant="titleMd">마음 우체통</AppText>
          <AppText variant="caption" color="steel">{unread ? `아직 읽지 않은 한 줄 ${unread}개가 있어요` : '한 줄을 주고받아 볼까요?'}</AppText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.slate} />
      </PressableScale>
      <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
        {visible && <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="우체통 닫기" disabled={busy} onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: SheetScrim }]} />
          <Animated.View accessibilityViewIsModal entering={reduceMotion ? FadeIn.duration(150).reduceMotion(ReduceMotion.Never) : SlideInDown.duration(250).easing(Easing.bezier(0, 0, 0.58, 1))} style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Spacing.xl + insets.bottom }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              <Pressable accessibilityRole="button" accessibilityLabel="우체통 닫기" onPress={close} disabled={busy} style={[styles.close, { backgroundColor: theme.surfaceSunken }]}><Feather name="x" size={24} color={theme.slate} /></Pressable>
              <View style={styles.envelope}><Feather name={submitted && accepted ? 'check-circle' : 'mail'} size={40} color={submitted && accepted ? theme.success : theme.accent} /></View>
              <AppText color="accentInk" style={styles.label}>마음 우체통</AppText>
              <AppText variant="display" accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>
                {submitted ? resultTitle : selected ? '누군가 보낸\n따뜻한 응원이 도착했어요' : '작은 응원을\n나눠볼까요?'}
              </AppText>
              {(submitted || selected || mode === 'welcome') && <View style={[styles.letter, { backgroundColor: theme.accentSoft }]}>
                {submitted ? <><AppText variant="titleMd">{submitted.body}</AppText><AppText variant="caption" color="steel">{MailboxStatus[submitted.status]}</AppText></> : selected ? <><AppText variant="titleMd" selectable>“{selected.body}”</AppText><AppText color="steel">— 이름 없는 서울의 친구</AppText></> : loading ? <ActivityIndicator color={theme.primary} /> : <AppText>{loadError ? '우체통을 불러오지 못했어요.' : '아직 도착한 응원이 없어요. 누군가에게 먼저 따뜻한 마음을 전해볼까요?'}</AppText>}
              </View>}
              {notice && <AppText variant="bodySm" accessibilityRole="alert">{notice}</AppText>}
              {submitted ? <>
                {submitted.status === 'crisis' && <HelpCard subject="이 한 줄" />}
                {submitted.status === 'pending' && <Button label="검수 다시 요청" variant="secondary" onPress={() => void send(submitted)} loading={busy} />}
                <Button label="닫기" onPress={close} disabled={busy} style={styles.button} />
              </> : mode === 'compose' ? <>
                <TextInput accessibilityLabel="보낼 한 줄" accessibilityHint="60자까지 적을 수 있어요" placeholder="오늘의 작은 응원을 적어주세요" placeholderTextColor={theme.steel} value={body} onChangeText={(value) => { setBody(value.slice(0, MailboxMaxLength)); requestId.current = createMailboxRequestId(); setNotice(null); }} maxLength={MailboxMaxLength} multiline editable={!busy} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.input, Typography.bodyMd, { backgroundColor: theme.surface, color: theme.ink, borderColor: focused ? theme.primary : theme.hairlineStrong }]} />
                <AppText color="steel" style={styles.counter}>{body.length}/{MailboxMaxLength}</AppText>
                <AppText variant="caption" color="steel">{DeliveryNotice} 연락처나 만남 제안은 적지 않아요.</AppText>
                <Button label="따뜻하게 보내기" disabled={!body.trim() || !userId} loading={busy} onPress={() => void send()} style={styles.button} />
              </> : <>
                {notice && selected && <Button label="읽음 표시 다시 저장" variant="secondary" onPress={() => void read(selected)} loading={busy} />}
                {loadError && <Button label="다시 불러오기" variant="secondary" onPress={() => void reload(true)} disabled={loading} />}
                <Button label="나도 응원 보내볼까요? →" disabled={busy} onPress={() => { setNotice(null); setMode('compose'); }} style={styles.button} />
              </>}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.sm, padding: Spacing.lg, borderWidth: 1, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardText: { flex: 1, gap: Spacing.xxs },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: MaxContentWidth, maxHeight: '90%', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  content: { gap: Spacing.md },
  close: { alignSelf: 'flex-end', width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  envelope: { alignSelf: 'center' },
  label: { alignSelf: 'center', fontWeight: '700' },
  title: { textAlign: 'center' },
  letter: { padding: Spacing.xl, borderRadius: Radius.xl, gap: Spacing.md },
  input: { minHeight: 100, borderWidth: 2, borderRadius: Radius.lg, padding: Spacing.md, textAlignVertical: 'top' },
  counter: { textAlign: 'right' },
  button: { borderRadius: Radius.lg },
});
