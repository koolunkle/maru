import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  getSentMailboxMessages,
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
  const [mode, setMode] = useState<'inbox' | 'sent' | 'read' | 'compose'>('inbox');
  const [received, setReceived] = useState<ReceivedMailboxMessage[]>([]);
  const [sent, setSent] = useState<MailboxMessage[]>([]);
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

  const reload = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError(false);
    try {
      const [inbox, outbox] = await Promise.all([getReceivedMailboxMessages(), getSentMailboxMessages()]);
      if (version !== loadVersion.current) return;
      setReceived(inbox);
      setSent(outbox);
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
          setMode('inbox');
          setVisible(true);
        } catch {}
      }
    } catch {
      if (version === loadVersion.current) setLoadError(true);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [userId]);

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
      setSent((messages) => [message, ...messages.filter((item) => item.id !== message.id)]);
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

  async function read(message: ReceivedMailboxMessage) {
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
  }

  function showList(next: 'inbox' | 'sent' = 'inbox') {
    Keyboard.dismiss();
    setMode(next);
    setNotice(null);
    setSubmitted(null);
    void reload();
  }

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`마음 우체통, 아직 읽지 않은 한 줄 ${unread}개`}
        onPress={() => {
          setSubmitted(null);
          setNotice(null);
          setMode('inbox');
          opened.current = true;
          setVisible(true);
          void reload();
        }}
        style={({ hovered }) => [
          styles.card,
          { backgroundColor: theme.surface, borderColor: hovered ? theme.hairlineStrong : theme.hairline },
        ]}>
        <Feather name="mail" size={24} color={theme.accent} />
        <View style={styles.cardText}>
          <AppText variant="titleMd">마음 우체통</AppText>
          <AppText variant="caption" color="steel">
            {unread ? `아직 읽지 않은 한 줄 ${unread}개가 있어요` : '한 줄을 주고받아 볼까요?'}
          </AppText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.slate} />
      </PressableScale>

      <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
        {visible && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="우체통 닫기"
              disabled={busy}
              onPress={close}
              style={[StyleSheet.absoluteFill, { backgroundColor: SheetScrim }]}
            />
            <Animated.View
              accessibilityViewIsModal
              entering={
                reduceMotion
                  ? FadeIn.duration(150).reduceMotion(ReduceMotion.Never)
                  : SlideInDown.duration(250).easing(Easing.bezier(0, 0, 0.58, 1))
              }
              style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Spacing.xl + insets.bottom }]}>
              {mode === 'inbox' || mode === 'sent' ? (
                <>
                  <AppText variant="titleMd" accessibilityRole="header">
                    마음 우체통
                  </AppText>
                  <View style={styles.tabs}>
                    <Button
                      label={`받은 한 줄${unread ? ` (${unread})` : ''}`}
                      variant={mode === 'inbox' ? 'primary' : 'secondary'}
                      size="sm"
                      onPress={() => showList('inbox')}
                      style={styles.tab}
                    />
                    <Button
                      label="보낸 한 줄"
                      variant={mode === 'sent' ? 'primary' : 'secondary'}
                      size="sm"
                      onPress={() => showList('sent')}
                      style={styles.tab}
                    />
                  </View>
                  {loading ? (
                    <ActivityIndicator accessibilityLabel="우체통 불러오는 중" color={theme.primary} />
                  ) : loadError ? (
                    <AppText variant="bodySm" accessibilityRole="alert">
                      우체통을 불러오지 못했어요. 다시 불러와 볼까요?
                    </AppText>
                  ) : (
                    <FlatList<ReceivedMailboxMessage | MailboxMessage>
                      data={mode === 'inbox' ? received : sent}
                      keyExtractor={(item) => item.id}
                      style={styles.list}
                      ListEmptyComponent={
                        <AppText variant="bodySm" color="steel" style={styles.empty}>
                          {mode === 'inbox'
                            ? '아직 도착한 한 줄이 없어요. 작은 응원을 먼저 보내볼까요?'
                            : '아직 보낸 한 줄이 없어요.'}
                        </AppText>
                      }
                      renderItem={({ item }) => {
                        const isReceived = 'read_at' in item;
                        const status = isReceived ? (item.read_at ? '읽음' : '안 읽음') : MailboxStatus[item.status];
                        return (
                          <PressableScale
                            accessibilityRole="button"
                            accessibilityLabel={`${status}, ${item.body}, 읽기`}
                            onPress={() => {
                              if (isReceived) void read(item);
                              else {
                                setSubmitted(item);
                                setNotice(null);
                                setMode('compose');
                              }
                            }}
                            style={[styles.row, { borderColor: theme.hairline }]}>
                            <View style={styles.cardText}>
                              <AppText variant="bodySm" numberOfLines={1}>
                                {item.body}
                              </AppText>
                              <AppText variant="caption" color={isReceived && !item.read_at ? 'accentInk' : 'steel'}>
                                {status}
                              </AppText>
                            </View>
                            <Feather name="chevron-right" size={20} color={theme.slate} />
                          </PressableScale>
                        );
                      }}
                    />
                  )}
                  <Button label="다시 불러오기" variant="ghost" onPress={() => void reload()} disabled={loading} />
                  <Button
                    label="한 줄 쓰기"
                    onPress={() => {
                      setSubmitted(null);
                      setNotice(null);
                      setMode('compose');
                    }}
                  />
                  <Button label="닫기" variant="ghost" onPress={close} />
                </>
              ) : mode === 'read' && selected ? (
                <ScrollView contentContainerStyle={styles.content}>
                  <Feather name="mail" size={32} color={theme.accent} />
                  <AppText variant="titleMd" accessibilityRole="header">
                    누군가가 보낸 한 줄
                  </AppText>
                  <View style={[styles.letter, { backgroundColor: theme.surfaceSunken, borderColor: theme.hairline }]}>
                    <AppText selectable>{selected.body}</AppText>
                  </View>
                  {notice && (
                    <AppText variant="bodySm" accessibilityRole="alert">
                      {notice}
                    </AppText>
                  )}
                  {notice && (
                    <Button
                      label="읽음 표시 다시 저장"
                      variant="secondary"
                      onPress={() => void read(selected)}
                      loading={busy}
                    />
                  )}
                  <Button label="목록으로" onPress={() => showList()} disabled={busy} />
                  <Button label="닫기" variant="ghost" onPress={close} disabled={busy} />
                </ScrollView>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
                  <Feather
                    name={accepted ? 'check-circle' : 'mail'}
                    size={32}
                    color={accepted ? theme.success : theme.accent}
                  />
                  <AppText variant="titleMd" accessibilityRole="header" accessibilityLiveRegion="polite">
                    {submitted ? resultTitle : '누군가에게 한 줄 보내볼까요?'}
                  </AppText>

                  {submitted ? (
                    <View style={[styles.note, { backgroundColor: theme.surfaceSunken }]}>
                      <AppText variant="bodySm">{submitted.body}</AppText>
                    </View>
                  ) : (
                    <>
                      <AppText variant="bodySm" color="slate">
                        이름 없이 전하고 싶은 말을 적어 주세요.{'\n'}연락처나 만남 제안은 적지 않아요.
                      </AppText>
                      <TextInput
                        accessibilityLabel="보낼 한 줄"
                        accessibilityHint="60자까지 적을 수 있어요"
                        placeholder="오늘도 작은 한 걸음을 응원해요"
                        placeholderTextColor={theme.muted}
                        value={body}
                        onChangeText={(value) => {
                          setBody(value.slice(0, MailboxMaxLength));
                          requestId.current = createMailboxRequestId();
                          setNotice(null);
                        }}
                        maxLength={MailboxMaxLength}
                        multiline
                        editable={!busy}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        style={[
                          styles.input,
                          Typography.bodyMd,
                          {
                            backgroundColor: theme.surface,
                            color: theme.ink,
                            borderColor: focused ? theme.primary : theme.hairlineStrong,
                            borderWidth: focused ? 2 : 1,
                          },
                        ]}
                      />
                      <AppText variant="caption" color="steel" tabular style={styles.counter}>
                        {body.length}/{MailboxMaxLength}
                      </AppText>
                    </>
                  )}

                  <View style={[styles.note, { backgroundColor: theme.surfaceSunken }]}>
                    <AppText variant="caption" color="steel">
                      {submitted ? MailboxStatus[submitted.status] : DeliveryNotice}
                    </AppText>
                  </View>
                  {notice && (
                    <AppText variant="bodySm" color="slate" accessibilityRole="alert" accessibilityLiveRegion="polite">
                      {notice}
                    </AppText>
                  )}
                  {submitted?.status === 'crisis' && <HelpCard subject="이 한 줄" />}
                  {submitted?.status === 'pending' && (
                    <Button
                      label="검수 다시 요청"
                      variant="secondary"
                      onPress={() => void send(submitted)}
                      loading={busy}
                    />
                  )}
                  {submitted ? (
                    <Button label="우체통으로" variant="secondary" onPress={() => showList('sent')} disabled={busy} />
                  ) : (
                    <>
                      <Button
                        label="보내기"
                        onPress={() => void send()}
                        disabled={!body.trim() || !userId}
                        loading={busy}
                      />
                      <Button label="우체통으로" variant="ghost" onPress={() => showList()} disabled={busy} />
                    </>
                  )}
                </ScrollView>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardText: { flex: 1, gap: Spacing.xxs },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    maxHeight: '90%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  content: { gap: Spacing.sm },
  input: {
    minHeight: Spacing.section * 2,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    textAlignVertical: 'top',
  },
  counter: { textAlign: 'right' },
  note: { borderRadius: Radius.md, padding: Spacing.sm },
  tabs: { flexDirection: 'row', gap: Spacing.xs },
  tab: { flex: 1 },
  list: { flexGrow: 0 },
  empty: { paddingVertical: Spacing.xl },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  letter: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1 },
});
