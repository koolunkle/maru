import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { FurnitureIcon, SlotName, SlotPosition, SlotTypeOf, unlockText } from '@/constants/room';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import type { Enums, Tables } from '@/types/database';

type Slot = Enums<'room_slot'>;
type Furniture = Tables<'furniture'>;
type Owned = Tables<'user_furniture'>;

const SlotSize = 64;

/** S8 내 방 (PRD F7 / DESIGN.md §5.4) */
export function Room() {
  const theme = useTheme();
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const [furniture, setFurniture] = useState<Furniture[] | null>(null);
  const [owned, setOwned] = useState<Owned[]>([]);
  const [roomWidth, setRoomWidth] = useState(0);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    let active = true;
    Promise.all([
      supabase.from('furniture').select('*').order('sort'),
      supabase.from('user_furniture').select('*').eq('user_id', userId),
    ]).then(([f, o]) => {
      if (!active) return;
      // 실패하면 보이던 방을 지우지 않는다
      if (f.error || o.error) { setLoadFailed(true); return; }
      setLoadFailed(false);
      setFurniture(f.data);
      setOwned(o.data);
    }, () => active && setLoadFailed(true));
    return () => {
      active = false;
    };
  }, [userId]);

  useFocusEffect(load);

  async function place(slot: Slot, furnitureId: string | null) {
    setBusy(true);
    setError(false);
    const { error: placementError } = await supabase.functions.invoke('place-furniture', { body: { slot, furnitureId } });
    setBusy(false);
    if (placementError) { setError(true); return; }
    setEditing(null);
    load();
  }

  function open(slot: Slot) {
    setError(false);
    setEditing(slot);
  }

  const nameOf = (id: string) => furniture?.find((f) => f.id === id)?.name ?? '가구';
  const ownedIds = new Set(owned.map((o) => o.furniture_id));
  const roomHeight = roomWidth * 0.85;
  const candidates = editing
    ? (furniture ?? []).filter((f) => ownedIds.has(f.id) && f.slot_type === SlotTypeOf[editing])
    : [];

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg">내 방</AppText>
      </View>

      <View
        onLayout={(e) => setRoomWidth(e.nativeEvent.layout.width)}
        style={[styles.room, { height: roomHeight || undefined, backgroundColor: theme.roomFloor }]}>
        <View style={[styles.wall, { backgroundColor: theme.roomWall }]} />
        {roomWidth > 0 &&
          (Object.keys(SlotPosition) as Slot[]).map((slot) => {
            const pos = SlotPosition[slot];
            const item = owned.find((o) => o.slot === slot);
            const icon = item && FurnitureIcon[item.furniture_id];
            return (
              <PressableScale
                key={slot}
                accessibilityRole="button"
                accessibilityLabel={`${SlotName[slot]}, ${item ? nameOf(item.furniture_id) : '빈 자리'}`}
                accessibilityHint={item ? '눌러서 다른 가구로 바꿔요' : '눌러서 가구를 놓아요'}
                onPress={() => open(slot)}
                style={[
                  styles.slot,
                  {
                    left: (pos.x / 100) * roomWidth - SlotSize / 2,
                    top: (pos.y / 100) * roomHeight - SlotSize / 2,
                  },
                  !item && { borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.hairlineStrong },
                ]}>
                {icon ? (
                  <Animated.View key={item.furniture_id} entering={ZoomIn.springify().damping(12)}>
                    <MaterialCommunityIcons name={icon.name} size={40} color={theme[icon.color]} />
                  </Animated.View>
                ) : (
                  <Feather name="plus" size={16} color={theme.muted} />
                )}
              </PressableScale>
            );
          })}
      </View>

      <AppText variant="titleMd" style={styles.sectionTitle}>
        가진 가구
      </AppText>
      {loadFailed ? (
        <View style={styles.failed}>
          <AppText color="slate" accessibilityRole="alert">내 방을 불러오지 못했어요.</AppText>
          <Button
            label="다시 불러오기"
            variant="secondary"
            size="sm"
            onPress={() => {
              setLoadFailed(false);
              load();
            }}
          />
        </View>
      ) : !furniture ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={styles.grid}>
          {furniture.map((f) => {
            const have = ownedIds.has(f.id);
            const icon = FurnitureIcon[f.id];
            return (
              <View
                key={f.id}
                accessible
                accessibilityLabel={have ? `${f.name}, 가짐` : `${f.name}, 잠김, ${unlockText(f.unlock_rule)}`}
                style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
                {have && icon ? (
                  <MaterialCommunityIcons name={icon.name} size={32} color={theme[icon.color]} />
                ) : (
                  <MaterialCommunityIcons name="lock-outline" size={24} color={theme.muted} />
                )}
                <AppText variant="caption" color={have ? 'ink' : 'steel'} numberOfLines={1}>
                  {f.name}
                </AppText>
                {!have && (
                  <AppText variant="label" color="steel" numberOfLines={2} style={styles.centerText}>
                    {unlockText(f.unlock_rule)}
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 인벤토리 바텀 시트 (DESIGN.md §6: 250ms 슬라이드, 뒤 배경 rgba(0,0,0,0.3)) */}
      <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(null)} accessibilityLabel="닫기" />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <AppText variant="titleMd">이 자리에 놓을 가구</AppText>
          {error && <AppText accessibilityRole="alert" color="slate">가구를 놓지 못했어요. 다시 시도해 주세요.</AppText>}
          {candidates.length === 0 ? (
            <AppText variant="bodySm" color="steel">
              이 자리에 놓을 수 있는 가구가 아직 없어요. 미션을 하면 모을 수 있어요.
            </AppText>
          ) : (
            <View style={styles.sheetList}>
              {candidates.map((f) => {
                const icon = FurnitureIcon[f.id];
                return (
                  <PressableScale
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.name} 놓기`}
                    disabled={busy}
                    onPress={() => editing && place(editing, f.id)}
                    style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
                    {icon && <MaterialCommunityIcons name={icon.name} size={32} color={theme[icon.color]} />}
                    <AppText variant="caption">{f.name}</AppText>
                  </PressableScale>
                );
              })}
            </View>
          )}
          {editing && owned.some((o) => o.slot === editing) && (
            <Button label="비우기" variant="secondary" onPress={() => place(editing, null)} disabled={busy} />
          )}
          <Button label="닫기" variant="ghost" onPress={() => setEditing(null)} />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
  },
  room: {
    width: '100%',
    aspectRatio: 1 / 0.85,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  wall: {
    height: '60%',
  },
  slot: {
    position: 'absolute',
    width: SlotSize,
    height: SlotSize,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  item: {
    width: 72,
    minHeight: 72,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  failed: {
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  centerText: {
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  sheetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
});
