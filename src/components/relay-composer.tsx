import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { HelpCard } from '@/components/help-card';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Functions } from '@/lib/functions';
import { leaveRelay, type Relay } from '@/lib/relay';

const MaxRelay = 60;

function relayStatus(relay: Relay) {
  if (relay.status === 'pending') return '검수를 기다리고 있어요. 아직 공개되지 않았어요.';
  if (relay.status === 'rejected' || relay.status === 'crisis') return '이 한 줄은 공개되지 않았어요.';
  if (relay.status === 'published') return '다음 사람에게 한 줄이 보이고 있어요.';
  const minutes = Math.ceil((Date.parse(relay.publish_at) - Date.now()) / 60_000);
  if (minutes <= 0) return '곧 다음 사람에게 보여요.';
  return minutes >= 60
    ? `약 ${Math.ceil(minutes / 60)}시간 뒤 다음 사람에게 보여요.`
    : `약 ${minutes}분 뒤 다음 사람에게 보여요.`;
}

type RelayComposerState = ReturnType<typeof useRelayComposer>;

/** F10 인증을 마친 뒤 "다음 사람에게 한 줄": 남기기·검수·검수 다시 요청 */
export function useRelayComposer(missionId: string, userId: string | undefined) {
  const [body, setBody] = useState('');
  const [relay, setRelay] = useState<Relay | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const sending = useRef(false);

  async function send() {
    const text = body.trim();
    if (sending.current || !userId || (!relay && (!text || text.length > MaxRelay))) return;
    sending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      let saved = relay;
      if (!saved) {
        saved = await leaveRelay(missionId, userId, text);
        setRelay(saved);
      }
      if (saved.status === 'pending') {
        const moderated = await Functions.moderateRelay(saved.id).catch(() => ({ status: 'pending' as const }));
        setRelay({ ...saved, status: moderated.status });
      }
    } catch {
      setNotice('한 줄을 남기지 못했어요. 다시 눌러 볼까요?');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  function edit(text: string) {
    setBody(text.slice(0, MaxRelay));
    setNotice(null);
  }

  return { body, edit, relay, busy, notice, send };
}

/** 한 줄 입력 또는 남긴 한 줄과 검수 상태 */
export function RelayComposer({ body, edit, relay, busy }: RelayComposerState) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="titleMd" accessibilityRole="header">
        다음 사람에게 한 줄 남길까요?
      </AppText>
      {relay ? (
        <>
          <View style={[styles.item, { backgroundColor: theme.surfaceSunken }]}>
            <AppText variant="bodySm">{relay.body}</AppText>
          </View>
          <AppText variant="caption" color="steel" accessibilityLiveRegion="polite">
            {relayStatus(relay)}
          </AppText>
          {relay.status === 'crisis' && <HelpCard subject="이 한 줄" />}
        </>
      ) : (
        <>
          <TextInput
            accessibilityLabel="다음 사람에게 남길 한 줄"
            accessibilityHint="60자까지 적을 수 있어요"
            value={body}
            onChangeText={edit}
            maxLength={MaxRelay}
            editable={!busy}
            placeholder="오늘도 작은 한 걸음을 응원해요"
            placeholderTextColor={theme.muted}
            style={[styles.input, Typography.bodyMd, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.hairlineStrong }]}
          />
          <AppText variant="caption" color="steel" style={styles.counter} tabular>
            {body.length}/{MaxRelay}
          </AppText>
          <AppText variant="caption" color="steel">
            연락처나 만남 제안은 적지 않아요.
          </AppText>
        </>
      )}
    </View>
  );
}

/** 하단 버튼: 건너뛰기·남기기 → 남긴 뒤에는 검수 다시 요청·홈으로 */
export function RelayActions({ body, relay, busy, notice, send }: RelayComposerState) {
  return (
    <>
      {notice && (
        <AppText variant="caption" color="steel" accessibilityRole="alert">
          {notice}
        </AppText>
      )}
      {relay?.status === 'pending' && <Button label="검수 다시 요청" variant="secondary" onPress={send} loading={busy} />}
      {!relay && <Button label="건너뛰기" variant="ghost" onPress={() => router.dismissTo('/')} disabled={busy} />}
      {relay ? (
        <Button label="홈으로" onPress={() => router.dismissTo('/')} disabled={busy} />
      ) : (
        <Button label="남기기" onPress={send} disabled={!body.trim()} loading={busy} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xxl, gap: Spacing.xs },
  input: { minHeight: 52, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm },
  item: { borderRadius: Radius.md, padding: Spacing.sm },
  counter: { alignSelf: 'flex-end', marginTop: Spacing.xxs },
});
