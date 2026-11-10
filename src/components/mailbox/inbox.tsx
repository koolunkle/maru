import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReceivedMailboxMessage } from '@/lib/mailbox';
import { formatDateRange, kstDate } from '@/utils/date';

import { mailboxStyles } from './styles';

/** 우체통 시트의 받은 한 줄 목록과 '한 줄 쓰기'·'보낸 한 줄' 버튼 */
export function MailboxInbox({
  received,
  loading,
  loadError,
  busy,
  canCompose,
  hasSent,
  onReload,
  onRead,
  onCompose,
  onShowSent,
}: {
  received: ReceivedMailboxMessage[];
  loading: boolean;
  loadError: boolean;
  busy: boolean;
  /** null: 보낸 한 줄을 아직 확인 중이라 두 버튼 모두 숨긴다 */
  canCompose: boolean | null;
  hasSent: boolean;
  onReload: () => void;
  onRead: (message: ReceivedMailboxMessage) => void;
  onCompose: () => void;
  onShowSent: () => void;
}) {
  const theme = useTheme();
  return (
    <>
      {loadError ? (
        <>
          <AppText color="slate" accessibilityRole="alert">
            우체통을 불러오지 못했어요.
          </AppText>
          <Button label="다시 불러오기" variant="secondary" onPress={onReload} disabled={loading} />
        </>
      ) : loading && received.length === 0 ? (
        <ActivityIndicator color={theme.primary} />
      ) : received.length === 0 ? (
        <AppText color="steel">
          아직 도착한 응원이 없어요. 누군가에게 먼저 따뜻한 마음을 전해볼까요?
        </AppText>
      ) : (
        received.map((message) => {
          const day = formatDateRange(
            kstDate(new Date(message.received_at)),
            kstDate(new Date(message.received_at)),
          );
          return (
            <PressableScale
              key={message.id}
              accessibilityRole="button"
              accessibilityLabel={`${day}, ${message.read_at ? message.body : '아직 읽지 않은 한 줄'}`}
              disabled={busy}
              onPress={() => onRead(message)}
              style={[mailboxStyles.row, { borderBottomColor: theme.hairline }]}
            >
              <AppText variant="caption" color="steel">
                {day}
              </AppText>
              {message.read_at ? (
                <AppText numberOfLines={1}>{message.body}</AppText>
              ) : (
                <View style={styles.unread}>
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  <AppText variant="titleMd">아직 읽지 않은 한 줄</AppText>
                </View>
              )}
            </PressableScale>
          );
        })
      )}
      {canCompose && (
        <Button
          label="한 줄 쓰기"
          disabled={busy}
          onPress={onCompose}
          style={mailboxStyles.button}
        />
      )}
      {canCompose !== null && hasSent && (
        <Button
          label="보낸 한 줄"
          variant="secondary"
          disabled={busy}
          onPress={onShowSent}
          style={canCompose ? undefined : mailboxStyles.button}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  unread: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
});
