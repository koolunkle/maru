import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { Categories, CategoryLabel } from '@/constants/domain';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  adminRequest,
  type AdminMission,
  type AdminMissionInput,
  type AdminMissionPage,
  type AdminPhoto,
} from '@/lib/admin-missions';

type NoticeArea = 'top' | 'mission' | 'photo';

const Blank = {
  title: '',
  category: 'walk' as AdminMission['category'],
  difficulty: '1',
  minutes: '5',
  verify_hint: '',
  reason: '',
  start_date: '',
  end_date: '',
};

function Field({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.steel}
        style={[
          styles.input,
          {
            color: theme.ink,
            borderColor: theme.hairline,
            backgroundColor: theme.surface,
          },
        ]}
      />
    </View>
  );
}

export function Admin() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  // 안내는 요청을 보낸 영역 옆에 보여 준다. 화면이 길어 맨 위에만 두면 아래쪽 버튼에서 결과가 보이지 않는다.
  const [notice, setNotice] = useState<{ text: string; at: NoticeArea } | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState<AdminMissionPage>({
    items: [],
    total: 0,
    page: 1,
  });
  const [id, setId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...Blank });
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [hint, setHint] = useState('');
  const [confirm, setConfirm] = useState<
    { kind: 'mission' } | { kind: 'photo'; id: number } | null
  >(null);
  const request = <T,>(input: Record<string, unknown>) => adminRequest<T>(password, input);

  async function run(action: () => Promise<string | void>, at: NoticeArea = 'top') {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const text = await action();
      if (text) setNotice({ text, at });
    } catch (e) {
      setNotice({
        text: e instanceof Error ? e.message : '요청을 처리하지 못했어요. 다시 시도해 주세요.',
        at,
      });
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const load = async (n = 1) =>
    setPage(await request<AdminMissionPage>({ action: 'list', page: n, q }));
  const loadPhotos = async (missionId: string) =>
    setPhotos(await request<AdminPhoto[]>({ action: 'photos', id: missionId }));
  function clear() {
    setId(null);
    setDraft({ ...Blank });
    setPhotos([]);
    setHint('');
  }
  async function select(m: AdminMission) {
    setId(m.id);
    setDraft({
      title: m.title,
      category: m.category,
      difficulty: String(m.difficulty),
      minutes: String(m.minutes),
      verify_hint: m.verify_hint,
      reason: m.reason ?? '',
      start_date: m.start_date ?? '',
      end_date: m.end_date ?? '',
    });
    setHint('');
    setPhotos([]);
    await loadPhotos(m.id);
  }
  async function login() {
    await request({ action: 'check' });
    await load();
    setAuthenticated(true);
  }
  async function save() {
    const mission: AdminMissionInput = {
      ...draft,
      difficulty: Number(draft.difficulty),
      minutes: Number(draft.minutes),
      reason: draft.reason.trim() || null,
      start_date: draft.start_date.trim() || null,
      end_date: draft.end_date.trim() || null,
    };
    const m = await request<AdminMission>({ action: 'save', id, mission });
    await load(page.page);
    await select(m);
    return '미션을 저장했어요.';
  }
  async function upload() {
    if (!id) return;
    const selected = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 1,
    });
    if (selected.canceled) return;
    const image = selected.assets[0].base64;
    if (!image) throw new Error('사진을 불러오지 못했어요. 다른 사진을 선택해 주세요.');
    if (image.length > 2796204) throw new Error('사진은 한 장당 2 MiB 이하로 선택해 주세요.');
    await request({ action: 'upload', id, image, hint });
    await loadPhotos(id);
    return '사진을 저장했어요.';
  }
  async function remove() {
    if (!confirm) return;
    if (confirm.kind === 'mission') {
      await request({ action: 'delete', id });
      clear();
      await load(1);
    } else {
      await request({ action: 'delete_photo', photoId: confirm.id });
      if (id) await loadPhotos(id);
    }
    setConfirm(null);
    return '삭제했어요.';
  }

  const noticeAt = (at: NoticeArea) =>
    notice?.at === at && (
      <AppText accessibilityRole="alert" accessibilityLiveRegion="polite">
        {notice.text}
      </AppText>
    );

  return (
    <Screen>
      <BackHeader title="미션 관리" />
      <View style={styles.body}>
        <AppText variant="bodySm" color="slate">
          현재 Maru DB의 공용 미션과 기준 사진을 관리해요.
        </AppText>
        {noticeAt('top')}
        {!authenticated ? (
          <>
            <Field
              label="관리자 비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => run(login)}
            />
            <Button
              label="관리 화면 열기"
              loading={busy}
              disabled={!password}
              onPress={() => run(login)}
            />
            <AppText variant="caption" color="steel">
              새로고침하면 비밀번호를 다시 입력해요.
            </AppText>
          </>
        ) : (
          <>
            <Button
              label="관리 종료"
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setPassword('');
                setAuthenticated(false);
                clear();
                setPage({ items: [], total: 0, page: 1 });
                setNotice(null);
              }}
            />
            <AppText variant="titleMd">등록된 미션</AppText>
            <Field
              label="미션 제목 검색"
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => run(() => load(1))}
            />
            <Button
              label="검색"
              variant="secondary"
              loading={busy}
              onPress={() => run(() => load(1))}
            />
            <AppText variant="caption" color="steel">
              {page.total}개 · {page.page} / {Math.max(1, Math.ceil(page.total / 20))} 페이지
            </AppText>
            {page.items.map((m) => (
              <Button
                key={m.id}
                label={`${m.title}${id === m.id ? ' · 선택됨' : ''}`}
                variant="secondary"
                disabled={busy}
                onPress={() => run(() => select(m))}
              />
            ))}
            {!page.items.length && <AppText color="slate">검색 결과가 없어요.</AppText>}
            <View style={styles.row}>
              <Button
                label="이전"
                size="sm"
                variant="secondary"
                disabled={busy || page.page <= 1}
                onPress={() => run(() => load(page.page - 1))}
              />
              <Button
                label="다음"
                size="sm"
                variant="secondary"
                disabled={busy || page.page * 20 >= page.total}
                onPress={() => run(() => load(page.page + 1))}
              />
            </View>
            <Button label="새 미션 작성" variant="secondary" disabled={busy} onPress={clear} />
            <AppText variant="titleMd">{id ? '미션 수정' : '새 미션'}</AppText>
            {id && (
              <AppText variant="caption" color="steel">
                {id}
              </AppText>
            )}
            <Field
              label="미션 제목"
              value={draft.title}
              maxLength={40}
              onChangeText={(title) => setDraft({ ...draft, title })}
            />
            <AppText variant="label">카테고리</AppText>
            <View style={styles.categories}>
              {Categories.map((c) => (
                <Chip
                  key={c.id}
                  label={CategoryLabel[c.id]}
                  selected={draft.category === c.id}
                  role="radio"
                  disabled={busy}
                  onPress={() => setDraft({ ...draft, category: c.id })}
                />
              ))}
            </View>
            <Field
              label="난이도 (1~5)"
              value={draft.difficulty}
              keyboardType="number-pad"
              onChangeText={(difficulty) => setDraft({ ...draft, difficulty })}
            />
            <Field
              label="소요 시간 (분)"
              value={draft.minutes}
              keyboardType="number-pad"
              onChangeText={(minutes) => setDraft({ ...draft, minutes })}
            />
            <Field
              label="인증 힌트 (사진에 담을 대상)"
              value={draft.verify_hint}
              maxLength={30}
              placeholder="예: 4층 입구 앞 조형물"
              onChangeText={(verify_hint) => setDraft({ ...draft, verify_hint })}
            />
            {/* 미션 상세는 힌트 뒤에 " 사진 한 장"을 붙인다 */}
            {draft.verify_hint.trim() !== '' && (
              <AppText variant="caption" color="steel">
                사용자에게는 &apos;{draft.verify_hint.trim()} 사진 한 장&apos;으로 보여요
              </AppText>
            )}
            <Field
              label="추천 이유 (선택)"
              value={draft.reason}
              maxLength={50}
              onChangeText={(reason) => setDraft({ ...draft, reason })}
            />
            <Field
              label="추천 시작일 (YYYY-MM-DD, 선택)"
              value={draft.start_date}
              maxLength={10}
              onChangeText={(start_date) => setDraft({ ...draft, start_date })}
            />
            <Field
              label="추천 종료일 (YYYY-MM-DD, 선택)"
              value={draft.end_date}
              maxLength={10}
              onChangeText={(end_date) => setDraft({ ...draft, end_date })}
            />
            <AppText variant="caption" color="steel">
              한국 시간으로 양 끝 날짜를 포함해요. 비우면 해당 방향으로 제한이 없어요.
            </AppText>
            <Button label="미션 저장" loading={busy} onPress={() => run(save, 'mission')} />
            {noticeAt('mission')}
            {id && (
              <Button
                label="미션 삭제"
                variant="ghost"
                disabled={busy}
                onPress={() => setConfirm({ kind: 'mission' })}
              />
            )}
            <AppText variant="titleMd">기준 사진 ({photos.length}/4)</AppText>
            <AppText variant="caption" color="steel">
              미션 저장 후 JPEG·PNG·WebP 사진을 추가해요. 한 장당 2 MiB 이하예요.
            </AppText>
            {photos.map((p) => (
              <View key={p.id} style={styles.photo}>
                <Image
                  source={{ uri: p.url }}
                  style={styles.preview}
                  contentFit="contain"
                  accessibilityLabel="등록된 기준 사진"
                />
                <AppText variant="bodySm">{p.hint || '비교 힌트 없음'}</AppText>
                <Button
                  label="사진 삭제"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => setConfirm({ kind: 'photo', id: p.id })}
                />
              </View>
            ))}
            <Field
              label="사진 비교 힌트 (선택)"
              value={hint}
              onChangeText={setHint}
              maxLength={2000}
              multiline
            />
            <Button
              label="사진 선택 후 등록"
              disabled={busy || !id || photos.length >= 4}
              onPress={() => run(upload, 'photo')}
            />
            {noticeAt('photo')}
          </>
        )}
      </View>
      {confirm && (
        <BottomSheet
          title={confirm.kind === 'mission' ? '미션을 삭제할까요?' : '사진을 삭제할까요?'}
          closeDisabled={busy}
          onClose={() => setConfirm(null)}
        >
          <AppText color="slate">
            {confirm.kind === 'mission'
              ? '사용자 기록이나 사진이 연결된 미션은 삭제하지 않아요.'
              : '이 미션의 비교에서 사진을 제외해요.'}
          </AppText>
          <Button
            label="삭제"
            loading={busy}
            onPress={() => run(remove, confirm.kind === 'mission' ? 'mission' : 'photo')}
          />
          {/* 실패하면 시트가 열린 채라 화면 쪽 안내가 가려진다 */}
          {noticeAt(confirm.kind === 'mission' ? 'mission' : 'photo')}
          <Button
            label="취소"
            variant="secondary"
            disabled={busy}
            onPress={() => setConfirm(null)}
          />
        </BottomSheet>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.md, paddingBottom: Spacing.xl },
  field: { gap: Spacing.xs },
  input: {
    ...Typography.bodyMd,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  photo: { gap: Spacing.sm },
  preview: { width: '100%', height: 200, borderRadius: Radius.md },
});
