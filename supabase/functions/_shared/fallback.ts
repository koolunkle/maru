// AI를 쓸 수 없을 때(키·크레딧·장애)의 규칙 기반 대체 처리
// 댓글 검수는 대체하지 않는다: AI 검수 없이는 공개하지 않는다(pending 유지).

// ---------------------------------------------------------------------------
// 미션 추천 (앱의 src/utils/pick-seed-missions.ts와 같은 규칙)
// ---------------------------------------------------------------------------
type Seed = { id: string; category: string; difficulty: number; minutes: number };
type Profile = { categories: string[]; difficulty: number; daily_minutes: number | null };

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 관심 카테고리 미션을 앞에 두고 각각 섞는다 */
function rank(pool: Seed[], categories: string[]) {
  return [...shuffle(pool.filter((m) => categories.includes(m.category))), ...shuffle(pool.filter((m) => !categories.includes(m.category)))];
}

/**
 * 일일 3개: 난이도 ≤ 프로필+1, 소요 시간 ≤ 하루 가능 시간 (부족하면 시간 조건 완화)
 * 주간 1개: 난이도 ≥ 프로필+1
 * exclude: '다른 미션 보기'에서 직전 추천을 제외할 id
 */
export function pickSeeds<T extends Seed>(seeds: T[], profile: Profile, exclude: string[] = []) {
  const pool = seeds.filter((m) => !exclude.includes(m.id));
  const maxDifficulty = profile.difficulty + 1;
  const maxMinutes = profile.daily_minutes ?? 5;
  const strict = pool.filter((m) => m.difficulty <= maxDifficulty && m.minutes <= maxMinutes);
  const relaxed = pool.filter((m) => m.difficulty <= maxDifficulty && !strict.includes(m));
  const daily = [...rank(strict, profile.categories), ...rank(relaxed, profile.categories)].slice(0, 3) as T[];
  const weekly = (rank(
    pool.filter((m) => m.difficulty >= maxDifficulty && !daily.includes(m)),
    profile.categories,
  )[0] ?? null) as T | null;
  return { daily, weekly };
}
