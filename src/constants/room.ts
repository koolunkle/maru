import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { ThemeColors } from '@/constants/theme';
import type { Enums } from '@/types/database';

type Slot = Enums<'room_slot'>;

/** 슬롯 중심 좌표 (방 영역 기준 %, DESIGN.md §5.4) */
export const SlotPosition: Record<Slot, { x: number; y: number }> = {
  'wall-1': { x: 20, y: 22 },
  window: { x: 50, y: 20 },
  'wall-2': { x: 80, y: 22 },
  desk: { x: 78, y: 55 },
  'floor-1': { x: 28, y: 80 },
  'floor-2': { x: 66, y: 82 },
};

export const SlotTypeOf: Record<Slot, Enums<'furniture_slot_type'>> = {
  'wall-1': 'wall',
  'wall-2': 'wall',
  window: 'window',
  desk: 'desk',
  'floor-1': 'floor',
  'floor-2': 'floor',
};

/** 가구 아이콘 (DESIGN.md §5.4) — MaterialCommunityIcons는 가구에만 쓴다 */
export const FurnitureIcon: Record<
  string,
  { name: ComponentProps<typeof MaterialCommunityIcons>['name']; color: keyof ThemeColors }
> = {
  plant: { name: 'sprout', color: 'success' },
  lamp: { name: 'lamp', color: 'accent' },
  sofa: { name: 'sofa', color: 'primary' },
  shoe_rack: { name: 'shoe-sneaker', color: 'slate' },
  clock: { name: 'clock-outline', color: 'ink' },
  poster: { name: 'image-frame', color: 'accentInk' },
};

/** 가구 획득 조건 안내 (furniture.unlock_rule → 문구) */
export function unlockText(rule: unknown) {
  const r = rule as { type: string; days?: number; count?: number };
  switch (r.type) {
    case 'first_mission':
      return '첫 미션 완료';
    case 'streak':
      return `연속 출석 ${r.days}일`;
    case 'category_count':
      return `산책·운동 ${r.count}회`;
    case 'first_weekly':
      return '첫 주간 미션 완료';
    case 'event_mission':
      return '동네 문화행사 미션 완료';
    default:
      return '';
  }
}
