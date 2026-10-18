import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { AiCard } from '@/components/ai-card';
import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FunctionError, Functions, type JudgeResult } from '@/lib/functions';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { preparePhoto } from '@/utils/prepare-photo';

const MaxNote = 100;

type Photo = { uri: string; bytes: Uint8Array };

/** S5 인증 (PRD F4 / DESIGN.md §5.2) */
export function Verify({ userMissionId }: { userMissionId: string }) {
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
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;
    const asset = picked.assets[0];
    try {
      setPhoto(await preparePhoto(asset.uri, asset.width, asset.height));
      setPendingId(null);
      setResult(null);
    } catch {
      setNotice('사진을 불러오지 못했어요. 다른 사진으로 해볼까요?');
    }
  }

  async function submit() {
    if (!photo || !session) return;
    setBusy(true);
    setNotice(null);
    try {
      let verificationId = pendingId;
      if (!verificationId) {
        const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const upload = await supabase.storage
          .from('verifications')
          .upload(path, photo.bytes, { contentType: 'image/jpeg' });
        if (upload.error) throw upload.error;
        const { data, error } = await supabase
          .from('verifications')
          .insert({ user_mission_id: userMissionId, photo_path: path, text: note.trim() || null, is_public: isPublic })
          .select('id')
          .single();
        if (error) throw error;
        verificationId = data.id;
        setPendingId(verificationId);
      }

      const judged = await Functions.verifyMission(verificationId);
      setResult(judged);
      if (judged.result === 'retry') {
        // 다시 찍으면 새 인증으로 올린다
        setPendingId(null);
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
      setBusy(false);
    }
  }

  const done = result && result.result !== 'retry';

  if (done) {
    return (
      <Screen footer={<Button label="홈으로" onPress={() => router.dismissTo('/')} />}>
        <BackHeader />
        <View style={styles.result}>
          <Animated.View entering={ZoomIn.springify().damping(15).stiffness(200)}>
            <Feather name="check-circle" size={32} color={theme.success} />
          </Animated.View>
          <AiCard>{result.message}</AiCard>
          {result.rewards.map((f, i) => (
            <Animated.View
              key={f.id}
              entering={FadeInDown.duration(200).delay(150 + i * 100)}
              style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
              <Feather name="award" size={14} color={theme.accent} />
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
        accessibilityLabel="사진 추가"
        onPress={() => pick('library')}
        disabled={busy}
        style={[styles.photo, { backgroundColor: theme.surfaceSunken }]}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.photoEmpty}>
            <Feather name="camera" size={24} color={theme.slate} />
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
          <AiCard>{result.message}</AiCard>
        </View>
      )}

      <View style={styles.block}>
        <TextInput
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
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ true: theme.primary, false: theme.hairlineStrong }}
          thumbColor={theme.surface}
        />
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
  result: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
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
