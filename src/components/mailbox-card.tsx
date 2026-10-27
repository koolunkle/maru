import { Feather } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
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
import { PressableScale } from '@/components/pressable-scale';
import { MaxContentWidth, Radius, SheetScrim, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MailboxMaxLength, sendMailboxMessage, type MailboxMessage } from '@/lib/mailbox';

const LocalNotice = '지금은 이 기기에만 보관돼요. 다른 사람에게는 아직 전달되지 않아요.';

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
  const sending = useRef(false);

  function close() {
    if (sending.current) return;
    Keyboard.dismiss();
    setVisible(false);
    setFocused(false);
  }

  async function send() {
    if (sending.current || !body.trim() || body.trim().length > MailboxMaxLength) return;
    sending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const message = await sendMailboxMessage(userId, body);
      Keyboard.dismiss();
      setSubmitted(message);
      setBody('');
      setFocused(false);
    } catch {
      setNotice('한 줄을 보관하지 못했어요. 다시 눌러볼까요?');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="마음 우체통, 한 줄 쓰기"
        onPress={() => {
          setSubmitted(null);
          setNotice(null);
          setVisible(true);
        }}
        style={({ hovered }) => [
          styles.card,
          { backgroundColor: theme.surface, borderColor: hovered ? theme.hairlineStrong : theme.hairline },
        ]}>
        <Feather name="mail" size={24} color={theme.accent} />
        <View style={styles.cardText}>
          <AppText variant="titleMd">마음 우체통</AppText>
          <AppText variant="caption" color="steel">
            누군가에게 작은 응원을 보내볼까요?
          </AppText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.slate} />
      </PressableScale>

      <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
        {visible && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.overlay}>
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
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
                <Feather name={submitted ? 'check-circle' : 'mail'} size={32} color={submitted ? theme.success : theme.accent} />
                <AppText variant="titleMd" accessibilityRole="header" accessibilityLiveRegion="polite">
                  {submitted ? '한 줄을 이 기기에 보관했어요' : '누군가에게 한 줄 보내볼까요?'}
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
                    {LocalNotice}
                  </AppText>
                </View>
                {notice && (
                  <AppText variant="bodySm" color="slate" accessibilityRole="alert" accessibilityLiveRegion="polite">
                    {notice}
                  </AppText>
                )}
                {submitted ? (
                  <Button label="닫기" variant="secondary" onPress={close} />
                ) : (
                  <>
                    <Button label="보내기" onPress={send} disabled={!body.trim() || !userId} loading={busy} />
                    <Button label="닫기" variant="ghost" onPress={close} disabled={busy} />
                  </>
                )}
              </ScrollView>
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
});
