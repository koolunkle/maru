import type { DayPart } from '@/constants/room-art';

/** KST 시각으로 창밖 하늘을 고른다 (5~10시 아침, 10~17시 낮, 17~19시 저녁, 그 외 밤) */
export function dayPartOf(now: Date = new Date()): DayPart {
  const hour = (now.getUTCHours() + 9) % 24;
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'evening';
  return 'night';
}

/** KST 시·분 (방 벽시계 바늘) */
export function kstClock(now: Date = new Date()) {
  return { hour: (now.getUTCHours() + 9) % 24, minute: now.getUTCMinutes() };
}

export type PlantStage = 'sprout' | 'leafy' | 'flower';

/** 화분은 연속 출석에 따라 자란다 (성장 화분 F11과 같은 흐름): 3일 미만 새싹, 7일 미만 잎, 7일부터 꽃 */
export function plantStageOf(streak: number): PlantStage {
  if (streak >= 7) return 'flower';
  if (streak >= 3) return 'leafy';
  return 'sprout';
}

type Rule = { type: string; days?: number; count?: number; category?: string };
type Progress = { streak: number; completedByCategory: Record<string, number> };

/** 잠긴 가구의 남은 조건 문구 (도감). 계산할 수 없는 조건은 null */
export function remainingText(rule: unknown, progress: Progress): string | null {
  const r = rule as Rule;
  switch (r.type) {
    case 'first_mission':
      return '미션 하나만 완료하면 받아요';
    case 'streak': {
      const left = (r.days ?? 0) - progress.streak;
      return left > 0 ? `${left}일 더 이어 가면 받아요` : '오늘 미션을 완료하면 받아요';
    }
    case 'category_count': {
      const left = (r.count ?? 0) - (progress.completedByCategory[r.category ?? ''] ?? 0);
      return left > 0 ? `${left}번 더 하면 받아요` : '다음 미션을 완료하면 받아요';
    }
    case 'first_weekly':
      return '이번 주 미션을 완료하면 받아요';
    case 'event_mission':
      return '동네 행사 미션을 완료하면 받아요';
    default:
      return null;
  }
}

/** 받침에 맞는 목적격 조사: 화분을, 소파를 */
export function withObject(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const final = code >= 0 && code <= 11171 ? code % 28 : 0;
  return `${word}${final ? '을' : '를'}`;
}
