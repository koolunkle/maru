// 같은 가상 사용자에게 AI 추천(A)과 시드 규칙(R)을 돌려 개인화 지표를 비교한다 (tasks 1.2, design.md "평가 스크립트").
// 운영 추천 함수(recommend-missions)를 그대로 불러오고 DB만 가짜로 바꾼다. 운영 DB에는 접속하지 않는다. 네트워크는 AI 호출뿐이다.
//
// 실행 (저장소 루트에서):
//   가짜 AI(호출 없음):  node openspec/changes/archive/2026-11-05-measure-mission-recommendation/eval.mjs --fake
//   실제 AI(Gemini):     npm install --no-save @google/genai@2.30.0
//                        node --env-file=<GEMINI_API_KEY가 든 파일> openspec/changes/archive/2026-11-05-measure-mission-recommendation/eval.mjs
// 선택: --runs-ai <n> (기본 2), --runs-rule <n> (기본 5), --delay-ms <ms> (AI 호출 사이 대기, 기본 4000), --out <결과.json>
// 키 파일은 저장소에 두지 않는다.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { z } from 'zod';

import { compileSource, loadSource } from '../../../../tests/helpers/load-source.mjs';

const { values: args } = parseArgs({
  options: {
    'runs-ai': { type: 'string', default: '2' },
    'runs-rule': { type: 'string', default: '5' },
    'delay-ms': { type: 'string', default: '4000' },
    out: { type: 'string' },
    fake: { type: 'boolean', default: false },
  },
});
const runsAi = Number(args['runs-ai']);
const runsRule = Number(args['runs-rule']);
const delayMs = args.fake ? 0 : Number(args['delay-ms']);

const here = new URL('./', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('events-snapshot.json', here), 'utf8'));
const seedFile = JSON.parse(await readFile(new URL('../../../../data/seoul-challenge-2026-2.json', here), 'utf8'));
const seeds = Object.values(seedFile)
  .find(Array.isArray)
  .map((s) => ({ ...s, id: `seed-${s.seed_no}`, source: 'seed', start_date: null, end_date: null }));
assert.equal(seeds.length, 36);

// --- 가상 사용자 24명 (design.md) ---
const Districts = ['관악구', '종로구', '마포구', '노원구', '강남구', '강동구'];
const CategorySets = [
  ['walk'],
  ['culture'],
  ['food', 'rhythm'],
  ['growth'],
  ['neighborhood', 'walk'],
  ['people', 'culture'],
  ['rhythm'],
  ['culture', 'growth', 'walk'],
];
const Minutes = [5, 15, 30];
const Personas = Array.from({ length: 24 }, (_, i) => ({
  id: `p${String(i + 1).padStart(2, '0')}`,
  district: Districts[i % 6],
  categories: CategorySets[i % 8],
  daily_minutes: Minutes[i % 3],
  difficulty: 1 + (Math.floor(i / 8) % 3),
  onboarded_at: '2026-11-01T00:00:00+09:00',
}));
for (const d of Districts) assert.ok(snapshot.events[d], `${d} 행사 스냅샷 없음`);

// --- 가짜 DB: 실행 한 번마다 current를 바꿔 끼운다 ---
let current; // persona
let saved;
const tables = {
  recommendation_requests: () => null,
  daily_recommendations: () => null,
  profiles: () => current,
  user_missions: () => [],
  missions: () => seeds,
  events: () => snapshot.events[current.district],
};
const admin = {
  from(table) {
    assert.ok(table in tables, `예상하지 못한 테이블: ${table}`);
    const result = () => ({ data: tables[table](), error: null });
    const query = {};
    for (const m of ['select', 'eq', 'gte', 'lte', 'order', 'limit']) query[m] = () => query;
    query.single = async () => result();
    query.maybeSingle = async () => result();
    query.then = (resolve, reject) => Promise.resolve(result()).then(resolve, reject);
    return query;
  },
  async rpc(name, params) {
    assert.equal(name, 'save_recommendation');
    saved = params;
    return { data: { ok: true }, error: null };
  },
};

const Deno = { env: { get: (name) => (name === 'AI_PROVIDER' ? 'gemini' : process.env[name]) } };
let realGenerate;
if (args.fake) {
  // 배선 확인용: 사용자 조건을 지키는 고정 응답
  realGenerate = async (req) => {
    const ctx = JSON.parse(req.text);
    const m = (title, minutes, difficulty) => ({
      title,
      category: ctx.user.categories[0],
      difficulty,
      minutes,
      verify_hint: '사진',
      reason: '가짜 추천',
      event_id: null,
    });
    return {
      daily: [1, 2, 3].map((n) => m(`${ctx.user.district} 가짜 미션 ${n}`, ctx.user.daily_minutes, 1)),
      weekly: { ...m('가짜 주간 미션', 60, 4), event_id: ctx.events[0]?.id ?? null },
    };
  };
} else {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 필요합니다 (--env-file)');
  // eslint-disable-next-line import/no-unresolved
  const genai = await import('@google/genai').catch(() => {
    throw new Error('npm install --no-save @google/genai@2.30.0 을 먼저 실행하세요');
  });
  const unavailable = class {
    constructor() {
      throw new Error('평가는 Gemini만 씁니다');
    }
  };
  ({ generateJson: realGenerate } = (await compileSource('../supabase/functions/_shared/ai.ts'))(
    {
      'npm:@google/genai@2.30.0': genai,
      'npm:@anthropic-ai/sdk@0.135.0': { __esModule: true, default: unavailable },
      'npm:@anthropic-ai/sdk@0.135.0/helpers/zod': { zodOutputFormat: () => ({}) },
      'npm:zod@4.6.7': { z },
    },
    { Deno },
  ));
}

let condition; // 'A' | 'R'
let raw; // AI 원본 응답
let aiMs;
const shared = '../supabase/functions/_shared/';
const kst = await loadSource(`${shared}kst.ts`);
const copy = await loadSource(`${shared}copy.ts`);
const fallback = await loadSource(`${shared}fallback.ts`);
const http = await loadSource(`${shared}http.ts`);
const events = await loadSource(`${shared}seoul-events.ts`, { './kst.ts': kst });
let endpoint;
await loadSource(
  '../supabase/functions/recommend-missions/index.ts',
  {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'npm:zod@4.6.7': { z },
    '../_shared/ai.ts': {
      generateJson: async (req) => {
        if (condition === 'R') return null; // 운영의 AI 장애와 같은 경로
        const t = Date.now();
        try {
          raw = await realGenerate(req);
        } catch (e) {
          raw = { error: String(e?.message ?? e) };
          aiMs = Date.now() - t;
          return null;
        }
        aiMs = Date.now() - t;
        return raw;
      },
    },
    '../_shared/clients.ts': { admin, requireUserId: async () => 'eval-user' },
    '../_shared/copy.ts': copy,
    '../_shared/fallback.ts': fallback,
    '../_shared/http.ts': http,
    '../_shared/kst.ts': kst,
    '../_shared/seoul-events.ts': events,
  },
  { Deno: { serve: (fn) => (endpoint = fn) } },
);

const seedById = new Map(seeds.map((s) => [s.id, s]));
const norm = (t) => t.replace(/[\s'"“”‘’·.,!?~()[\]-]/g, '');
const seedTitles = new Set(seeds.map((s) => norm(s.title)));

async function run(persona, cond) {
  current = persona;
  condition = cond;
  saved = undefined;
  raw = undefined;
  aiMs = undefined;
  const res = await endpoint(
    new Request('http://eval/recommend-missions', { method: 'POST', body: JSON.stringify({}) }),
  );
  assert.equal(res.status, 200, `${persona.id} ${cond}: 응답 ${res.status} ${await res.text()}`);
  let missions;
  let usedFallback;
  if (saved.p_ai_missions) {
    usedFallback = false;
    // 마지막 항목이 이번 주 미션이다. 오늘 미션이 3개보다 적으면 save_recommendation처럼 시드로 채운다
    // (난이도 +1 이하, 하루 시간 안 우선, 관심 카테고리 우선). DB 함수의 random()은 첫 후보로 대신한다
    const last = saved.p_ai_missions.length - 1;
    missions = saved.p_ai_missions.map((m, i) => ({ ...m, kind: i < last ? 'daily' : 'weekly' }));
    const fill = seeds
      .filter((m) => m.difficulty <= persona.difficulty + 1)
      .sort(
        (x, y) =>
          (y.minutes <= persona.daily_minutes) - (x.minutes <= persona.daily_minutes) ||
          persona.categories.includes(y.category) - persona.categories.includes(x.category),
      )
      .slice(0, 3 - last)
      .map((m) => ({ ...m, kind: 'daily', backfilled: true }));
    missions.splice(last, 0, ...fill);
  } else {
    usedFallback = true;
    missions = [
      ...saved.p_daily_ids.map((id) => ({ ...seedById.get(id), kind: 'daily' })),
      ...(saved.p_weekly_id ? [{ ...seedById.get(saved.p_weekly_id), kind: 'weekly' }] : []),
    ];
  }
  return {
    persona: persona.id,
    condition: cond,
    usedFallback,
    aiMs,
    raw: cond === 'A' ? raw : undefined,
    missions: missions.map((m) => ({
      kind: m.kind,
      backfilled: m.backfilled ?? false,
      key: m.source === 'seed' ? m.id : norm(m.title),
      title: m.title,
      category: m.category,
      difficulty: m.difficulty,
      minutes: m.minutes,
      event_id: m.event_id ?? null,
      reason: m.reason ?? null,
    })),
  };
}

const results = [];
for (const p of Personas) {
  for (let r = 0; r < runsRule; r++) results.push({ ...(await run(p, 'R')), run: r });
  for (let r = 0; r < runsAi; r++) {
    results.push({ ...(await run(p, 'A')), run: r });
    process.stdout.write(`${p.id} A${r} ${results.at(-1).usedFallback ? '대체' : 'ok'} ${aiMs ?? '-'}ms\n`);
    if (delayMs) await new Promise((ok) => setTimeout(ok, delayMs));
  }
}

// --- 지표 ---
const banned = (t) => copy.hasBannedWord(t ?? '');
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN;
};
const jaccard = (a, b) => {
  const A = new Set(a.missions.map((m) => m.key));
  const B = new Set(b.missions.map((m) => m.key));
  const inter = [...A].filter((k) => B.has(k)).length;
  return inter / new Set([...A, ...B]).size;
};
const personaOf = new Map(Personas.map((p) => [p.id, p]));

function summarize(cond) {
  const rs = results.filter((r) => r.condition === cond);
  const first = rs.filter((r) => r.run === 0);
  const pairs = [];
  for (let i = 0; i < first.length; i++)
    for (let j = i + 1; j < first.length; j++) pairs.push(jaccard(first[i], first[j]));
  // R은 무작위라 실행별 쌍 평균을 다시 평균한다
  const pairByRun = [];
  for (const run of [...new Set(rs.map((r) => r.run))]) {
    const xs = rs.filter((r) => r.run === run);
    const ps = [];
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) ps.push(jaccard(xs[i], xs[j]));
    pairByRun.push(mean(ps));
  }
  const repeat = Personas.map((p) => {
    const xs = rs.filter((r) => r.persona === p.id);
    return xs.length > 1 ? jaccard(xs[0], xs[1]) : NaN;
  }).filter((x) => !Number.isNaN(x));
  const all = rs.flatMap((r) => r.missions.map((m) => ({ ...m, p: personaOf.get(r.persona) })));
  const daily = all.filter((m) => m.kind === 'daily');
  const weekly = all.filter((m) => m.kind === 'weekly');
  const distinct = new Set(first.flatMap((r) => r.missions.map((m) => m.key))).size;
  const fromSeedTitle = first
    .flatMap((r) => r.missions)
    .filter((m) => seedTitles.has(norm(m.title))).length;
  return {
    condition: cond,
    runs: rs.length,
    fallbackRate: mean(rs.map((r) => (r.usedFallback ? 1 : 0))),
    pairOverlap: mean(pairByRun),
    pairOverlapFirstRun: mean(pairs),
    repeatOverlap: repeat.length ? mean(repeat) : null,
    distinctMissionsFirstRun: distinct,
    seedTitleShareFirstRun: fromSeedTitle / first.flatMap((r) => r.missions).length,
    interestMatch: mean(all.map((m) => (m.p.categories.includes(m.category) ? 1 : 0))),
    dailyOverTime: mean(daily.map((m) => (m.minutes > m.p.daily_minutes ? 1 : 0))),
    dailyTooHard: mean(daily.map((m) => (m.difficulty > m.p.difficulty + 1 ? 1 : 0))),
    weeklyTooEasy: mean(weekly.map((m) => (m.difficulty < m.p.difficulty + 1 ? 1 : 0))),
    weeklyEvent: mean(weekly.map((m) => (m.event_id ? 1 : 0))),
    missingWeekly: mean(rs.map((r) => (r.missions.some((m) => m.kind === 'weekly') ? 0 : 1))),
    aiMsMedian: cond === 'A' ? median(rs.map((r) => r.aiMs).filter(Number.isFinite)) : null,
    aiMsMax: cond === 'A' ? Math.max(...rs.map((r) => r.aiMs).filter(Number.isFinite)) : null,
  };
}

// AI 원본(코드가 깎거나 버리기 전) 규칙 위반
function rawViolations() {
  const rs = results.filter((r) => r.condition === 'A');
  const counts = { responses: 0, errors: 0, badCount: 0, overTime: 0, tooHard: 0, weeklyTooEasy: 0, length: 0, banned: 0, dailyEvent: 0, unknownEvent: 0, dailyTotal: 0 };
  for (const r of rs) {
    if (!r.raw || r.raw.error) {
      counts.errors++;
      continue;
    }
    counts.responses++;
    const p = personaOf.get(r.persona);
    const ids = new Set(snapshot.events[p.district].map((e) => e.id));
    if (r.raw.daily.length !== 3) counts.badCount++;
    for (const m of [...r.raw.daily, r.raw.weekly]) {
      if (m.title.length > 40 || m.verify_hint.length > 30 || m.reason.length > 50) counts.length++;
      if (banned(`${m.title} ${m.verify_hint} ${m.reason}`)) counts.banned++;
    }
    for (const m of r.raw.daily) {
      counts.dailyTotal++;
      if (m.minutes > p.daily_minutes) counts.overTime++;
      if (m.difficulty > p.difficulty + 1) counts.tooHard++;
      if (m.event_id) counts.dailyEvent++;
    }
    if (r.raw.weekly.difficulty < p.difficulty + 1) counts.weeklyTooEasy++;
    if (r.raw.weekly.event_id && !ids.has(r.raw.weekly.event_id)) counts.unknownEvent++;
  }
  return counts;
}

// 시드 규칙의 상한: 사람마다 시드 36개 중 관심사·하루 시간·난이도(오늘 미션 조건)에 모두 맞는 후보 수
const seedFit = Personas.map((p) => ({
  persona: p.id,
  fit: seeds.filter(
    (s) =>
      p.categories.includes(s.category) &&
      s.minutes <= p.daily_minutes &&
      s.difficulty <= p.difficulty + 1,
  ).length,
}));
const seedCeiling = {
  underThree: seedFit.filter((x) => x.fit < 3).length,
  zero: seedFit.filter((x) => x.fit === 0).length,
  median: median(seedFit.map((x) => x.fit)),
};

const summary = {
  A: summarize('A'),
  R: summarize('R'),
  rawA: rawViolations(),
  seedCeiling,
  seedFit,
  personas: Personas,
};
console.log(JSON.stringify({ A: summary.A, R: summary.R, rawA: summary.rawA, seedCeiling }, null, 2));
const out = args.out ?? (args.fake ? null : `eval-${Date.now()}.json`);
if (out) {
  await writeFile(out, JSON.stringify({ summary, results }, null, 2));
  console.log(`결과: ${out}`);
}
