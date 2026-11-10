import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { PressableScale } from '@/components/pressable-scale';
import { FurnitureArt, type FurnitureState } from '@/components/room/furniture-art';
import { SlotName } from '@/constants/room';
import type { RoomArtColors } from '@/constants/room-art';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Enums, Tables } from '@/types/database';

/** 꾸미기 모드에서 자리를 눌렀을 때: 놓을 가구 고르기, 다른 자리로 옮기기, 비우기 */
export function SlotSheet({
  slot,
  candidates,
  placedId,
  canMove,
  busy,
  error,
  colors,
  state,
  onChoose,
  onMove,
  onClose,
}: {
  slot: Enums<'room_slot'>;
  candidates: Tables<'furniture'>[];
  /** 지금 이 자리에 놓인 가구 */
  placedId: string | undefined;
  canMove: boolean;
  busy: boolean;
  error: boolean;
  colors: RoomArtColors;
  state: FurnitureState;
  onChoose: (furnitureId: string | null) => void;
  onMove: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <BottomSheet title={`${SlotName[slot]} 자리`} onClose={onClose} closeDisabled={busy}>
      {error && (
        <AppText accessibilityRole="alert" color="slate">
          가구를 놓지 못했어요. 다시 시도해 주세요.
        </AppText>
      )}
      {candidates.length === 0 ? (
        <AppText variant="bodySm" color="steel">
          이 자리에 놓을 수 있는 가구가 아직 없어요. 도감에서 받는 방법을 볼 수 있어요.
        </AppText>
      ) : (
        <View style={styles.sheetList}>
          {candidates.map((f) => {
            const here = placedId === f.id;
            return (
              <PressableScale
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={here ? `${f.name}, 지금 놓여 있어요` : `${f.name} 놓기`}
                disabled={busy || here}
                onPress={() => onChoose(f.id)}
                style={[
                  styles.choice,
                  {
                    backgroundColor: here ? theme.primarySoft : theme.surface,
                    borderColor: here ? theme.primary : theme.hairline,
                  },
                ]}
              >
                <FurnitureArt id={f.id} height={40} colors={colors} state={state} />
                <AppText variant="caption">{f.name}</AppText>
              </PressableScale>
            );
          })}
        </View>
      )}
      {placedId && canMove && (
        <Button label="다른 자리로 옮기기" variant="secondary" onPress={onMove} disabled={busy} />
      )}
      {placedId && (
        <Button label="비우기" variant="secondary" onPress={() => onChoose(null)} disabled={busy} />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
