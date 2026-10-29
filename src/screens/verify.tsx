import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { AiCard } from '@/components/ai-card';
import { AppSwitch } from '@/components/app-switch';
import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { HelpCard } from '@/components/help-card';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FunctionError, Functions, type JudgedBy, type JudgeResult } from '@/lib/functions';
import { leaveRelay, type Relay } from '@/lib/relay';
import { uploadVerification } from '@/lib/verification';
import { useSession } from '@/providers/session-provider';
import { preparePhoto } from '@/utils/prepare-photo';

const MaxNote = 100;
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

type Photo = { uri: string; bytes: Uint8Array };

/** AI가 판정했을 때만 ai-card로 표시한다 (DESIGN.md §5.3) */
function ResultMessage({ text, judgedBy }: { text: string; judgedBy: JudgedBy }) {
  const theme = useTheme();
  if (judgedBy === 'ai') return <AiCard>{text}</AiCard>;
  return (
    <View style={[styles.message, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
      <AppText>{text}</AppText>
    </View>
  );
}

/** S5 인증 (PRD F4 / DESIGN.md §5.2) */
export function Verify({ missionId, userMissionId }: { missionId: string; userMissionId: string }) {
  const theme = useTheme();
  const { session } = useSession();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** 판정이 늦어 다시 시도할 때 같은 인증을 재사용한다 */
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [relayBody, setRelayBody] = useState('');
  const [relay, setRelay] = useState<Relay | null>(null);
  const [relayBusy, setRelayBusy] = useState(false);
  const [relayNotice, setRelayNotice] = useState<string | null>(null);
  const relaySending = useRef(false);
  const submitting = useRef(false);
  const uploadRequest = useRef<{ path: string; note: string; isPublic: boolean } | null>(null);

  async function sendRelay() {
    const body = relayBody.trim();
    if (relaySending.current || !session || (!relay && (!body || body.length > MaxRelay))) return;
    relaySending.current = true;
    setRelayBusy(true);
    setRelayNotice(null);
    try {
      let saved = relay;
      if (!saved) {
        saved = await leaveRelay(missionId, session.user.id, body);
        setRelay(saved);
      }
      if (saved.status === 'pending') {
        const moderated = await Functions.moderateRelay(saved.id).catch(() => ({ status: 'pending' as const }));
        setRelay({ ...saved, status: moderated.status });
      }
    } catch {
      setRelayNotice('한 줄을 남기지 못했어요. 다시 눌러 볼까요?');
    } finally {
      relaySending.current = false;
      setRelayBusy(false);
    }
  }

  async function pick(source: 'library' | 'camera') {
    setNotice(null);
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice('카메라 권한이 필요해요');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;
    const asset = picked.assets[0];
    try {
      setPhoto(await preparePhoto(asset.uri, asset.width, asset.height));
      uploadRequest.current = null;
      setPendingId(null);
      setResult(null);
    } catch {
      setNotice('사진을 불러오지 못했어요. 다른 사진으로 해볼까요?');
    }
  }

  async function submit() {
    if (!photo || !session || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotice(null);
    try {
      let verificationId = pendingId;
      if (uploadRequest.current && (uploadRequest.current.note !== note.trim() || uploadRequest.current.isPublic !== isPublic)) {
        verificationId = null;
        uploadRequest.current = null;
        setPendingId(null);
      }
      if (!verificationId) {
        const text = note.trim();
        if (!uploadRequest.current || uploadRequest.current.note !== text || uploadRequest.current.isPublic !== isPublic) {
          uploadRequest.current = { path: `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 12)}.jpg`, note: text, isPublic };
        }
        verificationId = await uploadVerification({
          userId: session.user.id, userMissionId, path: uploadRequest.current.path, bytes: photo.bytes, text: text || null, isPublic,
        });
        setPendingId(verificationId);
      }

      const judged = await Functions.verifyMission(verificationId);
      setResult(judged);
      if (judged.result === 'retry') {
        // 다시 찍으면 새 인증으로 올린다
        setPendingId(null);
        uploadRequest.current = null;
      } else if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      setNotice(
        e instanceof FunctionError && e.code === 'ai_unavailable'
          ? '확인이 늦어지고 있어요. 잠시 뒤 다시 눌러 주세요.'
          : '올리지 못했어요. 다시 시도해 주세요.',
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const done = result && result.result !== 'retry';

  if (done) {
    return (
      <Screen
        footer={
          <View style={styles.footer}>
            {relayNotice && (
              <AppText variant="caption" color="steel" accessibilityRole="alert">
                {relayNotice}
              </AppText>
            )}
            {relay?.status === 'pending' && (
              <Button label="검수 다시 요청" variant="secondary" onPress={sendRelay} loading={relayBusy} />
            )}
            {!relay && (
              <Button label="건너뛰기" variant="ghost" onPress={() => router.dismissTo('/')} disabled={relayBusy} />
            )}
            {relay ? (
              <Button label="홈으로" onPress={() => router.dismissTo('/')} disabled={relayBusy} />
            ) : (
              <Button label="남기기" onPress={sendRelay} disabled={!relayBody.trim()} loading={relayBusy} />
            )}
          </View>
        }>
        <BackHeader />
        <View style={styles.result}>
          <Animated.View entering={ZoomIn.springify().damping(15).stiffness(200)}>
            <Feather aria-hidden name="check-circle" size={32} color={theme.success} />
          </Animated.View>
          <ResultMessage text={result.message} judgedBy={result.judged_by} />
          {result.rewards.map((f, i) => (
            <Animated.View
              key={f.id}
              entering={FadeInDown.duration(200).delay(150 + i * 100)}
              style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
              <Feather aria-hidden name="award" size={14} color={theme.accent} />
              <AppText variant="label" color="accentInk">
                {f.name} 획득
              </AppText>
            </Animated.View>
          ))}
          {result.streak !== null && (
            <AppText variant="bodySm" color="slate" tabular>
              연속 {result.streak}일째예요
            </AppText>
          )}
        </View>
        <View style={styles.relaySection}>
          <AppText variant="titleMd" accessibilityRole="header">
            다음 사람에게 한 줄 남길까요?
          </AppText>
          {relay ? (
            <>
              <View style={[styles.relayItem, { backgroundColor: theme.surfaceSunken }]}>
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
                value={relayBody}
                onChangeText={(text) => {
                  setRelayBody(text.slice(0, MaxRelay));
                  setRelayNotice(null);
                }}
                maxLength={MaxRelay}
                editable={!relayBusy}
                placeholder="오늘도 작은 한 걸음을 응원해요"
                placeholderTextColor={theme.muted}
                style={[
                  styles.relayInput,
                  Typography.bodyMd,
                  { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.hairlineStrong },
                ]}
              />
              <AppText variant="caption" color="steel" style={styles.counter} tabular>
                {relayBody.length}/{MaxRelay}
              </AppText>
              <AppText variant="caption" color="steel">
                연락처나 만남 제안은 적지 않아요.
              </AppText>
            </>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {notice && (
            <AppText variant="caption" color="steel" style={styles.centerText}>
              {notice}
            </AppText>
          )}
          <Button label="제출하기" onPress={submit} disabled={!photo} loading={busy} />
        </View>
      }>
      <BackHeader title="인증하기" />

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={photo ? '사진 바꾸기' : '사진 추가'}
        onPress={() => pick('library')}
        disabled={busy}
        style={[styles.photo, { backgroundColor: theme.surfaceSunken }]}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.photoEmpty}>
            <Feather aria-hidden name="camera" size={24} color={theme.slate} />
            <AppText variant="bodySm" color="slate">
              사진 추가
            </AppText>
          </View>
        )}
      </PressableScale>
      {Platform.OS !== 'web' && (
        <Button label="카메라로 찍기" variant="ghost" onPress={() => pick('camera')} disabled={busy} />
      )}

      {result?.result === 'retry' && (
        <View style={styles.block}>
          <ResultMessage text={result.message} judgedBy={result.judged_by} />
        </View>
      )}

      <View style={styles.block}>
        <TextInput
          accessibilityLabel="한 줄 소감"
          accessibilityHint={`${MaxNote}자까지 적을 수 있어요`}
          value={note}
          onChangeText={(t) => setNote(t.slice(0, MaxNote))}
          placeholder="한 줄 소감 (선택)"
          placeholderTextColor={theme.muted}
          multiline
          numberOfLines={3}
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
        <AppText variant="caption" color="steel" style={styles.counter} tabular>
          {note.length}/{MaxNote}
        </AppText>
      </View>

      <View style={[styles.toggleRow, { borderColor: theme.hairline }]}>
        <View style={styles.toggleText}>
          <AppText>피드에 공개하기</AppText>
          <AppText variant="caption" color="steel">
            닉네임으로만 보여요. 공개하면 익명 댓글을 받을 수 있어요.
          </AppText>
        </View>
        <AppSwitch accessibilityLabel="피드에 공개하기" value={isPublic} onValueChange={setIsPublic} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: {
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  block: {
    marginTop: Spacing.md,
  },
  input: {
    minHeight: 96,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xxs,
  },
  toggleRow: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  message: {
    alignSelf: 'stretch',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  result: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  relaySection: { marginTop: Spacing.xxl, gap: Spacing.xs },
  relayInput: { minHeight: 52, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm },
  relayItem: { borderRadius: Radius.md, padding: Spacing.sm },
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  footer: {
    gap: Spacing.xs,
  },
  centerText: {
    textAlign: 'center',
  },
});
