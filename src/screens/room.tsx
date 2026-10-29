import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { Collection } from '@/components/room/collection';
import { ArtAspect, FurnitureArt, type FurnitureState } from '@/components/room/furniture-art';
import { RoomLight, RoomScene, SceneHeight, SlotAnchor } from '@/components/room/room-scene';
import { SurfaceSwatch } from '@/components/room/room-surfaces';
import { Screen } from '@/components/screen';
import { SlotName, SlotTypeOf } from '@/constants/room';
import { RoomArt, Sky, type DayPart } from '@/constants/room-art';
import { DefaultTheme, Floors, themeStorageKey, Wallpapers } from '@/constants/room-themes';
import { Radius, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { Functions } from '@/lib/functions';
import { getRoom, getRoomProgress } from '@/lib/room';
import { useSession } from '@/providers/session-provider';
import type { Enums, Tables } from '@/types/database';
import { kstDate } from '@/utils/date';
import { dayPartOf, kstClock, plantStageOf, themeRuleText, themeUnlocked, withObject } from '@/utils/room-state';
import { currentStreak } from '@/utils/streak';

type Slot = Enums<'room_slot'>;
type Furniture = Tables<'furniture'>;
type Owned = Tables<'user_furniture'>;

const Slots = Object.keys(SlotAnchor) as Slot[];
/** 슬롯 종류별 가장 넓은 가구 비율 (꾸미기 모드의 자리 표시 크기) */
const SlotAspect: Record<Enums<'furniture_slot_type'>, number> = { floor: 1.6, wall: 1, window: 1, desk: 1 };

/** 슬롯의 화면 위치(px). 방 단위 → 방 너비 기준 px */
function slotRect(slot: Slot, width: number, aspect: number) {
  const a = SlotAnchor[slot];
  const unit = width / 100;
  const h = a.height * unit;
  const w = h * aspect;
  return { left: a.x * unit - w / 2, top: a.align === 'bottom' ? a.y * unit - h : a.y * unit - h / 2, width: w, height: h };
}

/** S8 내 방 (PRD F7 / DESIGN.md §5.4) — 일러스트 방, 보기·꾸미기 분리, 도감, 내 기록이 남는 가구 */
export function Room() {
  const theme = useTheme();
  const isDark = useIsDark();
  const colors = isDark ? RoomArt.dark : RoomArt.light;
  const { session, profile } = useSession();
  const userId = session?.user.id ?? '';
  const params = useLocalSearchParams<{ place?: string; time?: string }>();

  const [furniture, setFurniture] = useState<Furniture[] | null>(null);
  const [owned, setOwned] = useState<Owned[]>([]);
  const [completedByCategory, setCompletedByCategory] = useState<Record<string, number>>({});
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [roomTheme, setRoomTheme] = useState(DefaultTheme);
  const [posterTitle, setPosterTitle] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [roomWidth, setRoomWidth] = useState(0);
  const [decorating, setDecorating] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // 벽시계·창밖 하늘을 위해 30초마다 시각을 다시 읽는다
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const place = useCallback(async (slot: Slot, furnitureId: string | null) => {
    return Functions.placeFurniture(slot, furnitureId).then(() => true, () => false);
  }, []);

  // 인증 뒤 "방에 놓기"로 들어오면 빈 자리에 바로 놓는다. 빈 자리가 없으면 꾸미기에서 고르게 한다
  const placeParam = typeof params.place === 'string' ? params.place : null;

  const placeReward = useCallback(async (id: string, items: Furniture[], mineList: Owned[]) => {
    router.setParams({ place: undefined });
    const item = items.find((f) => f.id === id);
    const mine = mineList.find((o) => o.furniture_id === id);
    if (!item || !mine || mine.slot) return;
    const fits = Slots.filter((s) => SlotTypeOf[s] === item.slot_type);
    const empty = fits.find((s) => !mineList.some((o) => o.slot === s));
    if (!empty) {
      setDecorating(true);
      setEditing(fits[0] ?? null);
      return;
    }
    const ok = await place(empty, item.id);
    setNotice(ok ? `${SlotName[empty]}에 ${withObject(item.name)} 놓았어요` : '가구를 놓지 못했어요. 꾸미기에서 다시 놓아 주세요.');
    if (ok) setOwned(mineList.map((o) => (o.furniture_id === id ? { ...o, slot: empty } : o)));
  }, [place]);

  const load = useCallback(() => {
    let active = true;
    Promise.all([
      getRoom(userId),
      getRoomProgress(userId).catch(() => null),
      AsyncStorage.getItem(themeStorageKey(userId)).catch(() => null),
    ]).then(([room, progress, savedTheme]) => {
      if (!active) return;
      setLoadFailed(false);
      setFurniture(room.furniture);
      setOwned(room.owned);
      if (progress) {
        setCompletedByCategory(progress.completedByCategory);
        setWeeklyCount(progress.weeklyCount);
        setPosterTitle(progress.posterTitle);
      }
      try {
        if (savedTheme) setRoomTheme({ ...DefaultTheme, ...JSON.parse(savedTheme) });
      } catch {}
      if (placeParam) placeReward(placeParam, room.furniture, room.owned);
    }, () => active && setLoadFailed(true)); // 실패하면 보이던 방을 지우지 않는다
    return () => {
      active = false;
    };
  }, [userId, placeParam, placeReward]);

  useFocusEffect(load);

  async function choose(slot: Slot, furnitureId: string | null) {
    setBusy(true);
    setError(false);
    const ok = await place(slot, furnitureId);
    setBusy(false);
    if (!ok) { setError(true); return; }
    setEditing(null);
    load();
  }

  /** 옮기기: 대상 자리에 다른 가구가 있으면 서로 자리를 바꾼다 */
  async function moveTo(target: Slot) {
    if (!moving) return;
    const from = owned.find((o) => o.furniture_id === moving)?.slot ?? null;
    const occupant = owned.find((o) => o.slot === target && o.furniture_id !== moving);
    setBusy(true);
    let ok = await place(target, moving);
    if (ok && occupant && from) ok = await place(from, occupant.furniture_id);
    setBusy(false);
    setMoving(null);
    setNotice(ok ? `${SlotName[target]}에 옮겨 두었어요` : '옮기지 못했어요. 다시 시도해 주세요.');
    load();
  }

  const nameOf = useCallback((id: string) => furniture?.find((f) => f.id === id)?.name ?? '가구', [furniture]);


  const streak = profile ? currentStreak(profile, kstDate()) : 0;
  // 확인·시연용: /room?time=night 처럼 시간대를 바꿔 볼 수 있다
  const previewTime = params.time && params.time in Sky ? (params.time as DayPart) : null;
  const dayPart = previewTime ?? dayPartOf(now);
  const lampPlaced = owned.some((o) => o.furniture_id === 'lamp' && o.slot);
  const state: FurnitureState = {
    plantStage: plantStageOf(streak),
    lampOn: lampPlaced && (dayPart === 'night' || dayPart === 'evening'),
    clock: kstClock(now),
    posterTitle,
  };
  const lampSlot = owned.find((o) => o.furniture_id === 'lamp')?.slot as Slot | null | undefined;
  const lampAt = state.lampOn && lampSlot ? { x: SlotAnchor[lampSlot].x, y: SlotAnchor[lampSlot].y - SlotAnchor[lampSlot].height * 0.7 } : null;

  const ownedIds = new Set(owned.map((o) => o.furniture_id));
  const themeProgress = { streak, completedByCategory, weeklyCount };
  const candidates = editing ? (furniture ?? []).filter((f) => ownedIds.has(f.id) && f.slot_type === SlotTypeOf[editing]) : [];
  const editingItem = editing ? owned.find((o) => o.slot === editing) : undefined;
  const movingType = moving ? furniture?.find((f) => f.id === moving)?.slot_type : undefined;
  const canMove = editingItem && Slots.some((s) => s !== editing && SlotTypeOf[s] === SlotTypeOf[editing as Slot]);
  const placed = owned.filter((o) => o.slot);
  const roomLabel = placed.length
    ? `내 방. ${Sky[dayPart].label}. ${placed.map((o) => `${SlotName[o.slot as Slot]}에 ${nameOf(o.furniture_id)}`).join(', ')}`
    : `내 방. ${Sky[dayPart].label}. 아직 놓인 가구가 없어요`;

  function toggleDecorating() {
    setDecorating((value) => !value);
    setMoving(null);
    setNotice(null);
  }

  /** 벽지·바닥 고르기 (이 기기에만 저장) */
  function chooseTheme(kind: 'wallpaper' | 'floor', id: string) {
    const next = { ...roomTheme, [kind]: id };
    setRoomTheme(next);
    AsyncStorage.setItem(themeStorageKey(userId), JSON.stringify(next)).catch(() => {});
  }

  function pressSlot(slot: Slot) {
    setNotice(null);
    if (moving) {
      if (SlotTypeOf[slot] === movingType && owned.find((o) => o.furniture_id === moving)?.slot !== slot) moveTo(slot);
      else setMoving(null);
      return;
    }
    setError(false);
    setEditing(slot);
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="titleLg" accessibilityRole="header">내 방</AppText>
        {furniture && (
          <Button
            label={decorating ? '다 꾸몄어요' : '꾸미기'}
            variant={decorating ? 'primary' : 'secondary'}
            size="sm"
            onPress={toggleDecorating}
          />
        )}
      </View>

      <View
        onLayout={(e) => setRoomWidth(e.nativeEvent.layout.width)}
        accessible={!decorating}
        accessibilityRole="image"
        accessibilityLabel={roomLabel}
        style={[styles.room, { height: (roomWidth * SceneHeight) / 100 || undefined, backgroundColor: theme.roomWall }]}>
        {roomWidth > 0 && (
          <>
            <RoomScene width={roomWidth} colors={colors} wallpaper={roomTheme.wallpaper} floor={roomTheme.floor} dark={isDark} dayPart={dayPart} />
            {Slots.map((slot) => {
              const item = owned.find((o) => o.slot === slot);
              if (!item) return null;
              const rect = slotRect(slot, roomWidth, ArtAspect[item.furniture_id] ?? 1);
              return (
                <Animated.View
                  key={`${slot}:${item.furniture_id}`}
                  entering={ZoomIn.springify().damping(13)}
                  pointerEvents="none"
                  style={[styles.abs, rect, moving === item.furniture_id && styles.lifted]}>
                  <FurnitureArt id={item.furniture_id} height={rect.height} colors={colors} state={state} />
                </Animated.View>
              );
            })}
            <RoomLight width={roomWidth} colors={colors} dayPart={dayPart} lampAt={lampAt} />
            {decorating &&
              Slots.map((slot) => {
                const item = owned.find((o) => o.slot === slot);
                const rect = slotRect(slot, roomWidth, SlotAspect[SlotTypeOf[slot]]);
                const target = moving && SlotTypeOf[slot] === movingType && item?.furniture_id !== moving;
                return (
                  <PressableScale
                    key={`edit:${slot}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${SlotName[slot]}, ${item ? nameOf(item.furniture_id) : '빈 자리'}`}
                    accessibilityHint={moving ? (target ? '눌러서 이 자리로 옮겨요' : '눌러서 옮기기를 취소해요') : '눌러서 가구를 고르거나 옮겨요'}
                    onPress={() => pressSlot(slot)}
                    disabled={busy}
                    style={[
                      styles.abs,
                      styles.slot,
                      rect,
                      { borderColor: target ? theme.accent : theme.hairlineStrong, backgroundColor: target ? 'rgba(242,177,52,0.18)' : 'transparent' },
                      !item && { backgroundColor: 'rgba(255,255,255,0.35)' },
                    ]}>
                    {!item && <Feather aria-hidden name="plus" size={16} color={theme.slate} />}
                  </PressableScale>
                );
              })}
          </>
        )}
      </View>

      <View style={styles.caption}>
        {moving ? (
          <View style={styles.movingRow}>
            <AppText variant="bodySm" color="accentInk" accessibilityLiveRegion="polite" style={styles.flex}>
              {withObject(nameOf(moving))} 놓을 자리를 눌러 주세요
            </AppText>
            <Button label="취소" variant="ghost" size="sm" onPress={() => setMoving(null)} />
          </View>
        ) : notice ? (
          <Animated.View entering={FadeIn}>
            <AppText variant="bodySm" color="slate" accessibilityLiveRegion="polite">{notice}</AppText>
          </Animated.View>
        ) : decorating ? (
          <AppText variant="bodySm" color="slate">자리를 눌러 가구를 놓거나 옮겨요</AppText>
        ) : (
          <AppText variant="bodySm" color="slate">
            {state.lampOn ? '밤이 되어 스탠드를 켜 두었어요' : `창밖은 ${Sky[dayPart].label}이에요`}
            {owned.some((o) => o.furniture_id === 'plant' && o.slot) ? ` · 화분이 ${{ sprout: '새싹을 틔웠어요', leafy: '잎을 키우고 있어요', flower: '꽃을 피웠어요' }[state.plantStage]}` : ''}
          </AppText>
        )}
      </View>

      {decorating && (
        <View style={styles.themes}>
          {([
            ['wallpaper', '벽지', Wallpapers, 'wall'],
            ['floor', '바닥', Floors, 'floor'],
          ] as const).map(([kind, label, items, swatch]) => (
            <View key={kind} style={styles.themeGroup}>
              <AppText variant="titleMd" accessibilityRole="header">{label}</AppText>
              <View style={styles.themeRow}>
                {items.map((item) => {
                  const open = themeUnlocked(item.rule, themeProgress);
                  const selected = roomTheme[kind] === item.id;
                  return (
                    <PressableScale
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, disabled: !open }}
                      accessibilityLabel={open ? `${label} ${item.name}` : `${label} ${item.name}, 잠김. ${themeRuleText(item.rule, themeProgress)}`}
                      disabled={!open}
                      onPress={() => chooseTheme(kind, item.id)}
                      style={[styles.themeItem, { borderColor: selected ? theme.primary : theme.hairline, backgroundColor: selected ? theme.primarySoft : theme.surface }]}>
                      <View style={[styles.swatch, !open && styles.lockedSwatch]}>
                        <SurfaceSwatch kind={swatch} id={item.id} size={44} dark={isDark} />
                        {!open && (
                          <View style={styles.lock}>
                            <Feather aria-hidden name="lock" size={14} color={theme.slate} />
                          </View>
                        )}
                      </View>
                      <AppText variant="caption" color={open ? 'ink' : 'steel'} numberOfLines={1}>{item.name}</AppText>
                      {!open && (
                        <AppText variant="label" color="accentInk" numberOfLines={2} style={styles.centerText}>
                          {themeRuleText(item.rule, themeProgress)}
                        </AppText>
                      )}
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ))}
          <AppText variant="caption" color="steel">벽지·바닥은 이 기기에만 저장돼요.</AppText>
        </View>
      )}

      <View style={styles.collection}>
        {loadFailed ? (
          <View style={styles.failed}>
            <AppText color="slate" accessibilityRole="alert">내 방을 불러오지 못했어요.</AppText>
            <Button label="다시 불러오기" variant="secondary" size="sm" onPress={() => { setLoadFailed(false); load(); }} />
          </View>
        ) : !furniture ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <Collection furniture={furniture} owned={owned} colors={colors} state={state} progress={{ streak, completedByCategory }} />
        )}
      </View>

      {editing !== null && (
        <BottomSheet title={`${SlotName[editing]} 자리`} onClose={() => setEditing(null)} closeDisabled={busy}>
          {error && <AppText accessibilityRole="alert" color="slate">가구를 놓지 못했어요. 다시 시도해 주세요.</AppText>}
          {candidates.length === 0 ? (
            <AppText variant="bodySm" color="steel">
              이 자리에 놓을 수 있는 가구가 아직 없어요. 도감에서 받는 방법을 볼 수 있어요.
            </AppText>
          ) : (
            <View style={styles.sheetList}>
              {candidates.map((f) => {
                const here = editingItem?.furniture_id === f.id;
                return (
                  <PressableScale
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={here ? `${f.name}, 지금 놓여 있어요` : `${f.name} 놓기`}
                    disabled={busy || here}
                    onPress={() => editing && choose(editing, f.id)}
                    style={[styles.choice, { backgroundColor: here ? theme.primarySoft : theme.surface, borderColor: here ? theme.primary : theme.hairline }]}>
                    <FurnitureArt id={f.id} height={40} colors={colors} state={state} />
                    <AppText variant="caption">{f.name}</AppText>
                  </PressableScale>
                );
              })}
            </View>
          )}
          {editing && editingItem && canMove && (
            <Button
              label="다른 자리로 옮기기"
              variant="secondary"
              onPress={() => { setMoving(editingItem.furniture_id); setEditing(null); }}
              disabled={busy}
            />
          )}
          {editing && editingItem && (
            <Button label="비우기" variant="secondary" onPress={() => choose(editing, null)} disabled={busy} />
          )}
        </BottomSheet>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  room: {
    width: '100%',
    aspectRatio: 100 / SceneHeight,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lifted: {
    opacity: 0.55,
  },
  slot: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  caption: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  movingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flex: {
    flex: 1,
  },
  collection: {
    marginTop: Spacing.md,
  },
  themes: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  themeGroup: {
    gap: Spacing.xs,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  themeItem: {
    width: 76,
    minHeight: 96,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  swatch: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  lockedSwatch: {
    opacity: 0.45,
  },
  lock: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  failed: {
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  sheetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  choice: {
    width: 88,
    minHeight: 88,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
});
