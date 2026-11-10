import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { HelpCard } from '@/components/help-card';
import { MailboxCompose } from '@/components/mailbox/compose';
import { MailboxInbox } from '@/components/mailbox/inbox';
import { MailboxSentList } from '@/components/mailbox/sent-list';
import { mailboxStyles } from '@/components/mailbox/styles';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FunctionError } from '@/lib/functions';
import {
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
import { createRequestId } from '@/utils/request-id';

const DailyLimitNotice = '오늘은 이미 한 줄을 보냈어요. 내일 또 보내볼까요?';

/** F14: 미션·릴레이와 관계없이 익명 사용자에게 한 줄을 작성한다. */
export function MailboxCard({ userId }: { userId: string }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<MailboxMessage | null>(null);
  const [mode, setMode] = useState<'inbox' | 'read' | 'compose' | 'sent'>('inbox');
  const [received, setReceived] = useState<ReceivedMailboxMessage[]>([]);
  const [selected, setSelected] = useState<ReceivedMailboxMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sent, setSent] = useState<MailboxMessage[] | null>(null);
  const [sentError, setSentError] = useState(false);
  const sending = useRef(false);
  const requestId = useRef(createRequestId());
  const loadVersion = useRef(0);
  const opened = useRef(false);
  const sentChecking = sent === null && !sentError;
  // 보낸 글이 하나라도 있으면 '보낸 한 줄'을 늘 보인다. 지난 글의 상태 확인과 '검수 다시 요청'이 이 목록에만 있다
  const hasSent = !!sent?.length;
  const wroteToday = !!sent?.some(
    (message) =>
      message.status !== 'rejected' &&
      message.status !== 'crisis' &&
      kstDate(new Date(message.created_at)) === kstDate(),
  );
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

  const reload = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError(false);
    void loadSent();
    try {
      const inbox = await getReceivedMailboxMessages();
      if (version !== loadVersion.current) return;
      setReceived(inbox);
      const firstUnread = inbox.find((message) => !message.read_at);
      if (firstUnread && !opened.current) {
        const key = `@seoul-challenge/mailbox-arrival/${userId}`;
        const today = kstDate();
        // 알림 기록을 읽지 못해도 수신함은 수동으로 열 수 있다.
        try {
          const lastShown = await AsyncStorage.getItem(key);
          if (version !== loadVersion.current || opened.current || lastShown === today) return;
          // 확인과 열기 사이에 await를 두지 않는다. 기록을 먼저 쓰면 겹친 불러오기가 기록만 남기고 열지 않는다
          opened.current = true;
          setSubmitted(null);
          setVisible(true);
          void read(firstUnread);
          await AsyncStorage.setItem(key, today);
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

  async function loadSent() {
    setSentError(false);
    try {
      setSent(await getSentMailboxMessages());
    } catch {
      setSentError(true);
    }
  }

  function show(next: 'inbox' | 'compose' | 'sent') {
    setNotice(null);
    setSelected(null);
    setSubmitted(null);
    setMode(next);
    if (next === 'sent') void loadSent();
  }

  function close() {
    if (sending.current) return;
    Keyboard.dismiss();
    setVisible(false);
    opened.current = false;
  }

  async function send(retry?: MailboxMessage) {
    const text = retry?.body ?? body;
    if (sending.current || !text.trim() || text.trim().length > MailboxMaxLength) return;
    if (!retry && wroteToday) {
      setNotice(DailyLimitNotice);
      return;
    }
    sending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const message = await sendMailboxMessage(
        userId,
        text,
        retry?.request_id ?? requestId.current,
      );
      Keyboard.dismiss();
      setSubmitted(message);
      setSent(
        (messages) => messages && [message, ...messages.filter((item) => item.id !== message.id)],
      );
      if (!retry) {
        setBody('');
        requestId.current = createRequestId();
      }
    } catch (e) {
      // 다른 기기에서 이미 보냈거나 요청이 겹치면 서버가 하루 한 줄로 거절한다. 다시 눌러도 같으니 안내하고 목록을 맞춘다
      if (e instanceof FunctionError && e.code === 'daily_limit') {
        setNotice(DailyLimitNotice);
        void loadSent();
      } else {
        setNotice('한 줄을 맡기지 못했어요. 다시 눌러볼까요?');
      }
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  const title = submitted
    ? resultTitle
    : mode === 'read'
      ? '누군가 보낸\n따뜻한 응원이 도착했어요'
      : mode === 'compose'
        ? '누군가에게\n한 줄 보내볼까요?'
        : mode === 'sent'
          ? '보낸 한 줄'
          : '받은 한 줄';

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={
          unread ? `마음 우체통, 아직 읽지 않은 한 줄 ${unread}개` : '마음 우체통'
        }
        onPress={() => {
          show('inbox');
          opened.current = true;
          setVisible(true);
          void reload();
        }}
        style={({ hovered }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: hovered ? theme.hairlineStrong : theme.hairline,
          },
        ]}
      >
        <Feather aria-hidden name="mail" size={24} color={theme.accent} />
        <View style={styles.cardText}>
          <AppText variant="titleMd">마음 우체통</AppText>
          <AppText variant="caption" color="steel">
            {unread ? `아직 읽지 않은 한 줄 ${unread}개가 있어요` : '한 줄을 주고받아 볼까요?'}
          </AppText>
        </View>
        <Feather aria-hidden name="chevron-right" size={20} color={theme.slate} />
      </PressableScale>
      {visible && (
        <BottomSheet
          title={title}
          closeLabel="우체통 닫기"
          closeDisabled={busy}
          onClose={close}
          announceTitle
          header={
            <>
              <View style={styles.envelope}>
                <Feather
                  aria-hidden
                  name={submitted && accepted ? 'check-circle' : 'mail'}
                  size={40}
                  color={submitted && accepted ? theme.success : theme.accent}
                />
              </View>
              <AppText color="accentInk" style={styles.label}>
                마음 우체통
              </AppText>
            </>
          }
        >
          {notice && (
            <AppText variant="bodySm" accessibilityRole="alert">
              {notice}
            </AppText>
          )}
          {submitted ? (
            <>
              <View style={[styles.letter, { backgroundColor: theme.accentSoft }]}>
                <AppText variant="titleMd">{submitted.body}</AppText>
                <AppText variant="caption" color="steel">
                  {MailboxStatus[submitted.status]}
                </AppText>
              </View>
              {submitted.status === 'crisis' && <HelpCard subject="이 한 줄" />}
              {submitted.status === 'pending' && (
                <Button
                  label="검수 다시 요청"
                  variant="secondary"
                  onPress={() => void send(submitted)}
                  loading={busy}
                />
              )}
              <Button
                label="목록으로"
                variant="secondary"
                onPress={() => show('inbox')}
                disabled={busy}
                style={mailboxStyles.button}
              />
            </>
          ) : mode === 'read' && selected ? (
            <>
              <View style={[styles.letter, { backgroundColor: theme.accentSoft }]}>
                <AppText variant="titleMd" selectable>
                  “{selected.body}”
                </AppText>
                <AppText color="steel">— 이름 없는 서울의 친구</AppText>
              </View>
              {notice && (
                <Button
                  label="읽음 표시 다시 저장"
                  variant="secondary"
                  onPress={() => void read(selected)}
                  loading={busy}
                />
              )}
              <Button
                label="목록으로"
                variant="secondary"
                onPress={() => show('inbox')}
                disabled={busy}
                style={mailboxStyles.button}
              />
            </>
          ) : mode === 'compose' ? (
            <MailboxCompose
              body={body}
              busy={busy}
              canSend={!!userId && !wroteToday}
              onChange={(value) => {
                setBody(value);
                requestId.current = createRequestId();
                setNotice(null);
              }}
              onSend={() => void send()}
              onBack={() => show('inbox')}
            />
          ) : mode === 'sent' ? (
            <MailboxSentList
              sent={sent}
              loadError={sentError}
              busy={busy}
              onReload={() => void loadSent()}
              onResend={(message) => void send(message)}
              onBack={() => show('inbox')}
            />
          ) : (
            <MailboxInbox
              received={received}
              loading={loading}
              loadError={loadError}
              busy={busy}
              canCompose={sentChecking ? null : !wroteToday}
              hasSent={hasSent}
              onReload={() => void reload()}
              onRead={(message) => void read(message)}
              onCompose={() => show('compose')}
              onShowSent={() => show('sent')}
            />
          )}
        </BottomSheet>
      )}
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
  envelope: { alignSelf: 'center' },
  label: { alignSelf: 'center', fontWeight: '700' },
  letter: { padding: Spacing.xl, borderRadius: Radius.xl, gap: Spacing.md },
});
