import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';
import { MailboxStatus, type MailboxMessage } from '@/lib/mailbox';

import { mailboxStyles } from './styles';

/** 우체통 시트의 '보낸 한 줄' 목록. 검수 대기 글은 '검수 다시 요청'을 할 수 있다 */
export function MailboxSentList({
  sent,
  loadError,
  busy,
  onReload,
  onResend,
  onBack,
}: {
  /** null: 불러오는 중 */
  sent: MailboxMessage[] | null;
  loadError: boolean;
  busy: boolean;
  onReload: () => void;
  onResend: (message: MailboxMessage) => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  return (
    <>
      {loadError ? (
        <>
          <AppText color="slate" accessibilityRole="alert">
            보낸 한 줄을 불러오지 못했어요.
          </AppText>
          <Button label="다시 불러오기" variant="secondary" onPress={onReload} />
        </>
      ) : !sent ? (
        <ActivityIndicator color={theme.primary} />
      ) : sent.length === 0 ? (
        <AppText color="steel">아직 보낸 한 줄이 없어요.</AppText>
      ) : (
        sent.map((message) => (
          <View key={message.id} style={[mailboxStyles.row, { borderBottomColor: theme.hairline }]}>
            <AppText>{message.body}</AppText>
            <AppText variant="caption" color="steel">
              {MailboxStatus[message.status]}
            </AppText>
            {message.status === 'pending' && (
              <Button
                label="검수 다시 요청"
                variant="secondary"
                size="sm"
                onPress={() => onResend(message)}
                disabled={busy}
                style={styles.rowButton}
              />
            )}
          </View>
        ))
      )}
      <Button
        label="목록으로"
        variant="secondary"
        onPress={onBack}
        disabled={busy}
        style={mailboxStyles.button}
      />
    </>
  );
}

const styles = StyleSheet.create({
  rowButton: { alignSelf: 'flex-start' },
});
