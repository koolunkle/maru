import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MailboxMaxLength } from '@/lib/mailbox';

import { mailboxStyles } from './styles';

const DeliveryNotice = '검수를 거친 뒤 다른 사람에게 전달돼요.';

/** 우체통 시트의 한 줄 쓰기. 쓰던 내용은 부모가 들고 있어 시트를 닫았다 열어도 남는다 */
export function MailboxCompose({
  body,
  busy,
  canSend,
  onChange,
  onSend,
  onBack,
}: {
  body: string;
  busy: boolean;
  canSend: boolean;
  onChange: (body: string) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <>
      <TextInput
        accessibilityLabel="보낼 한 줄"
        accessibilityHint="60자까지 적을 수 있어요"
        placeholder="오늘의 작은 응원을 적어주세요"
        placeholderTextColor={theme.steel}
        value={body}
        onChangeText={(value) => onChange(value.slice(0, MailboxMaxLength))}
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
          },
        ]}
      />
      <AppText color="steel" style={styles.counter}>
        {body.length}/{MailboxMaxLength}
      </AppText>
      <AppText variant="caption" color="steel">
        {DeliveryNotice}
      </AppText>
      <Button
        label="보내기"
        disabled={!body.trim() || !canSend}
        loading={busy}
        onPress={onSend}
        style={mailboxStyles.button}
      />
      <Button label="목록으로" variant="ghost" onPress={onBack} disabled={busy} />
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 100,
    borderWidth: 2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    textAlignVertical: 'top',
  },
  counter: { textAlign: 'right' },
});
