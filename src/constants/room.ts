import type { Enums } from '@/types/database';

type Slot = Enums<'room_slot'>;

/** 슬롯 낭독 이름 */
export const SlotName: Record<Slot, string> = {
  'wall-1': '왼쪽 벽',
  window: '창가',
  'wall-2': '오른쪽 벽',
  desk: '책상',
  'floor-1': '왼쪽 바닥',
  'floor-2': '오른쪽 바닥',
};

export const SlotTypeOf: Record<Slot, Enums<'furniture_slot_type'>> = {
  'wall-1': 'wall',
  'wall-2': 'wall',
  window: 'window',
  desk: 'desk',
  'floor-1': 'floor',
  'floor-2': 'floor',
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
      return '문화행사 미션 완료';
    default:
      return '';
  }
}
