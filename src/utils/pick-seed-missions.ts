import { DailyMissionCount } from '@/constants/domain';
import type { Tables } from '@/types/database';

type Mission = Tables<'missions'>;
type Profile = Pick<Tables<'profiles'>, 'id' | 'categories' | 'difficulty' | 'daily_minutes'>;

/** 문자열 → 32bit 시드 (FNV-1a) */
function hash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 같은 사용자·같은 날에는 같은 순서가 나오도록 시드 고정 셔플 (mulberry32) */
function seededShuffle<T>(items: T[], seed: number) {
  const out = [...items];
  let s = seed;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 관심 카테고리 미션을 앞에, 나머지를 뒤에 두고 각각 셔플 */
function rank(pool: Mission[], categories: Profile['categories'], seed: number) {
  const preferred = pool.filter((m) => categories.includes(m.category));
  const others = pool.filter((m) => !categories.includes(m.category));
  return [...seededShuffle(preferred, seed), ...seededShuffle(others, seed + 1)];
}

/**
 * AI 추천이 없을 때의 규칙 기반 대체 (PRD F2: "AI 실패 시 시드 미션으로 대체").
 * - 일일: 난이도 ≤ 프로필+1, 소요 시간 ≤ 하루 가능 시간. 부족하면 소요 시간 조건을 푼다.
 * - 주간: 난이도 = 프로필+1 이상인 미션 중 1개. 같은 주(weekKey) 동안 유지된다.
 */
export function pickSeedMissions(seeds: Mission[], profile: Profile, date: string, weekKey: string) {
  const seed = hash(`${profile.id}:${date}`);
  const weekSeed = hash(`${profile.id}:${weekKey}`);
  const maxDifficulty = profile.difficulty + 1;
  const maxMinutes = profile.daily_minutes ?? 5;

  const strict = seeds.filter((m) => m.difficulty <= maxDifficulty && m.minutes <= maxMinutes);
  const relaxed = seeds.filter((m) => m.difficulty <= maxDifficulty && !strict.includes(m));
  const daily = [...rank(strict, profile.categories, seed), ...rank(relaxed, profile.categories, seed)].slice(
    0,
    DailyMissionCount,
  );

  const weeklyPool = seeds.filter((m) => m.difficulty >= maxDifficulty && !daily.includes(m));
  const weekly = rank(weeklyPool, profile.categories, weekSeed)[0] ?? null;

  return { daily, weekly };
}
