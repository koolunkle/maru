// 기준 사진이 사진 판정을 낫게 하는지 전/후로 잰다 (tasks 2.1, design.md "평가 스크립트").
// 운영 판정 함수(verify-mission)와 기준 사진 읽기(mission-photos)를 그대로 불러오고, DB·Storage만 가짜로 바꾼다.
// 그래서 같은 프롬프트·판정 코드로 판정하면서 운영 DB와 Storage에는 접속하지 않는다. 네트워크는 AI 호출뿐이다.
//
// 실행 (저장소 루트에서):
//   가짜 AI(호출 없음):  node openspec/changes/validate-mission-photo-quality/eval.mjs --dataset <dataset.json> --photos <사진 폴더> --fake
//   실제 AI(Gemini):     npm install --no-save @google/genai@2.30.0
//                        node --env-file=<GEMINI_API_KEY가 든 파일> openspec/changes/validate-mission-photo-quality/eval.mjs --dataset <dataset.json> --photos <사진 폴더>
// 선택: --condition A|B|both (기본 both), --recheck <횟수> (A·B 결과가 다른 사진을 다시 돌리는 횟수, 기본 3),
//       --delay-ms <ms> (호출 사이 대기, 기본 4000. 무료 등급 분당 한도), --out <결과.csv> (기본 사진 폴더/eval-<시각>.csv)
// 키 파일과 사진은 저장소에 두지 않는다.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';

import { compileSource, loadSource } from '../../../tests/helpers/load-source.mjs';

const Kinds = {
  same: 'pass', // 같은 장소 (조명·각도·계절이 다름)
  other: 'retry', // 다른 장소
  ambiguous: 'pass', // 장소가 애매한 직접 촬영 사진
  capture: 'retry', // 화면 캡처·그림·내려받은 이미지
  privacy: 'privacy', // 얼굴 정면·번호판
};

const Dataset = z.object({
  missions: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        verify_hint: z.string().min(1),
        references: z
          .array(z.object({ file: z.string(), hint: z.string(), source: z.string() }))
          .min(1)
          .max(4),
        submissions: z
          .array(
            z.object({
              file: z.string(),
              kind: z.enum(Object.keys(Kinds)),
              expected: z.enum(['pass', 'retry', 'privacy']),
              source: z.string(),
              note: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const { values: args } = parseArgs({
  options: {
    dataset: { type: 'string' },
    photos: { type: 'string' },
    condition: { type: 'string', default: 'both' },
    recheck: { type: 'string', default: '3' },
    'delay-ms': { type: 'string', default: '4000' },
    out: { type: 'string' },
    fake: { type: 'boolean', default: false },
  },
});
if (!args.dataset || !args.photos) throw new Error('--dataset과 --photos가 필요합니다');
const conditions = { A: ['A'], B: ['B'], both: ['A', 'B'] }[args.condition];
if (!conditions) throw new Error('--condition은 A, B, both 중 하나입니다');
const recheck = Number(args.recheck);
const delayMs = args.fake ? 0 : Number(args['delay-ms']);

const dataset = Dataset.parse(JSON.parse(await readFile(args.dataset, 'utf8')));
const files = new Map();
for (const m of dataset.missions) {
  for (const s of m.submissions)
    assert.equal(Kinds[s.kind], s.expected, `${s.file}: ${s.kind}의 기대 결과는 ${Kinds[s.kind]}`);
  for (const f of [...m.references, ...m.submissions].map((p) => p.file))
    if (!files.has(f)) files.set(f, await readFile(join(args.photos, f)));
  // 기준 사진과 제출 사진이 같은 사진이면 장소 비교가 아니라 이미지 일치를 재게 된다 (design.md)
  const hash = (f) => createHash('sha256').update(files.get(f)).digest('hex');
  const refs = new Set(m.references.map((r) => hash(r.file)));
  for (const s of m.submissions)
    assert.ok(!refs.has(hash(s.file)), `${s.file}: 기준 사진과 같은 사진입니다`);
}

// --- 가짜 DB·Storage: 판정 한 건마다 current를 바꿔 끼운다 ---
let current; // { mission, submission, references }
let finished;
let sentRefs; // AI에 실제로 함께 보낸 기준 사진 수. B인데 0이면 기준 사진 읽기가 실패한 것이다
const tables = {
  verifications: () => ({
    id: 'eval',
    user_id: 'eval-user',
    photo_path: current.submission.file,
    text: '',
    ai_result: null,
    user_mission_id: 'eval-um',
    user_missions: {
      id: 'eval-um',
      mission_id: current.mission.id,
      status: 'in_progress',
      type: 'daily',
      missions: { title: current.mission.title, verify_hint: current.mission.verify_hint },
    },
  }),
  mission_photos: () =>
    current.references.map((r, i) => ({ id: i, storage_path: r.file, hint: r.hint })),
  app_config: () => ({ value: 'retry_later' }), // AI 실패를 통과로 바꾸지 않고 오류로 센다
  user_missions: () => null,
  verification_responses: () => null,
};
const admin = {
  from(table) {
    assert.ok(table in tables, `예상하지 못한 테이블: ${table}`);
    const result = () => ({ data: tables[table](), error: null });
    const query = {
      select: () => query,
      eq: () => query,
      update: () => query,
      order: () => query,
      limit: () => query,
      abortSignal: () => query,
      single: async () => result(),
      maybeSingle: async () => result(),
      then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
    };
    return query;
  },
  storage: {
    from: (bucket) => ({
      download: async (path) => {
        assert.ok(['verifications', 'mission-photos'].includes(bucket));
        return { data: new Blob([files.get(path)]), error: null };
      },
    }),
  },
  async rpc(name, params) {
    assert.equal(name, 'finish_verification');
    finished = params;
    return { data: { result: params.p_result }, error: null };
  },
};

const encodeBase64 = (bytes) => Buffer.from(bytes).toString('base64');
class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}
const Deno = { env: { get: (name) => (name === 'AI_PROVIDER' ? 'gemini' : process.env[name]) } };

let generateJson;
if (args.fake) {
  // 배선 확인용: 기준 사진이 없으면 통과, 있으면 다시 찍기라서 A·B가 갈리고 재확인까지 돈다
  generateJson = async (req) =>
    req.referenceImages?.length
      ? { result: 'retry', message: '가짜 판정 (기준 사진 있음)' }
      : { result: 'pass', message: '가짜 판정' };
} else {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY가 필요합니다 (--env-file)');
  // 저장소 의존성이 아니라 평가 때만 --no-save로 설치한다
  // eslint-disable-next-line import/no-unresolved
  const genai = await import('@google/genai').catch(() => {
    throw new Error('npm install --no-save @google/genai@2.30.0 을 먼저 실행하세요');
  });
  const unavailable = class {
    constructor() {
      throw new Error('평가는 Gemini만 씁니다');
    }
  };
  ({ generateJson } = (await compileSource('../supabase/functions/_shared/ai.ts'))(
    {
      'npm:@google/genai@2.30.0': genai,
      'npm:@anthropic-ai/sdk@0.135.0': { __esModule: true, default: unavailable },
      'npm:@anthropic-ai/sdk@0.135.0/helpers/zod': { zodOutputFormat: () => ({}) },
      'npm:zod@4.6.7': { z },
    },
    { Deno },
  ));
}

const shared = '../supabase/functions/_shared/';
const missionPhotos = await loadSource(`${shared}mission-photos.ts`, {
  'jsr:@std/encoding@1/base64': { encodeBase64 },
  './clients.ts': { admin },
});
let endpoint;
await loadSource(
  '../supabase/functions/verify-mission/index.ts',
  {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'jsr:@std/encoding@1/base64': { encodeBase64 },
    'npm:zod@4.6.7': { z },
    '../_shared/ai.ts': {
      generateJson: (req) => {
        sentRefs = req.referenceImages?.length ?? 0;
        return generateJson(req);
      },
    },
    '../_shared/clients.ts': { admin, requireUserId: async () => 'eval-user' },
    '../_shared/copy.ts': await loadSource(`${shared}copy.ts`),
    '../_shared/http.ts': { handler: (fn) => fn, HttpError, json: (body) => body },
    '../_shared/moderation-privacy.ts': await loadSource(`${shared}moderation-privacy.ts`),
    '../_shared/mission-photos.ts': missionPhotos,
  },
  { Deno: { ...Deno, serve: (fn) => (endpoint = fn) } },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function judge(mission, submission, condition) {
  current = { mission, submission, references: condition === 'B' ? mission.references : [] };
  finished = null;
  sentRefs = 0;
  const started = Date.now();
  let result;
  let message = '';
  try {
    await endpoint({ json: async () => ({ verification_id: 'eval' }) });
    result = finished.p_result;
    message = finished.p_message;
  } catch (e) {
    result = e instanceof HttpError ? e.message : `error: ${e.message}`;
  }
  return { result, message, refs: sentRefs, ms: Date.now() - started };
}

const rows = [];
async function run(condition, mission, submission, round) {
  if (rows.length) await sleep(delayMs);
  const r = await judge(mission, submission, condition);
  rows.push({ condition, round, mission, submission, ...r });
  console.log(
    `${condition}${round ? ` 재확인${round}` : ''} ${mission.title} ${submission.file}: ${r.result} (기대 ${submission.expected}, ${r.ms}ms)`,
  );
  return r.result;
}

const first = new Map();
for (const condition of conditions)
  for (const mission of dataset.missions)
    for (const submission of mission.submissions) {
      const result = await run(condition, mission, submission, 0);
      first.set(`${condition}|${mission.id}|${submission.file}`, result);
    }
if (conditions.length === 2)
  for (const mission of dataset.missions)
    for (const submission of mission.submissions) {
      const key = (c) => first.get(`${c}|${mission.id}|${submission.file}`);
      if (key('A') === key('B')) continue;
      for (let round = 1; round <= recheck; round++)
        for (const condition of conditions) await run(condition, mission, submission, round);
    }

// --- 결과: 사진별 CSV + 조건·미션별 지표 (첫 판정만 지표에 넣는다) ---
const csvCell = (v) => `"${String(v).replaceAll('"', '""')}"`;
const header = ['condition', 'round', 'mission_id', 'mission', 'file', 'kind', 'expected', 'result', 'correct', 'refs', 'ms', 'message'];
const csv = [
  header.join(','),
  ...rows.map((r) =>
    [r.condition, r.round, r.mission.id, r.mission.title, r.submission.file, r.submission.kind,
      r.submission.expected, r.result, r.result === r.submission.expected, r.refs, r.ms, r.message]
      .map(csvCell)
      .join(','),
  ),
].join('\n');
const out = args.out ?? join(args.photos, `eval-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
await writeFile(out, `﻿${csv}\n`);

const rate = (list, ok) => (list.length ? `${list.filter(ok).length}/${list.length}` : '-');
function metrics(list) {
  const ms = list.map((r) => r.ms).sort((a, b) => a - b);
  const byExpected = (e) => list.filter((r) => r.submission.expected === e);
  return {
    정확도: rate(list, (r) => r.result === r.submission.expected),
    잘못거절: rate(byExpected('pass'), (r) => r.result === 'retry'),
    잘못통과: rate(byExpected('retry'), (r) => r.result === 'pass'),
    다른장소거절: rate(list.filter((r) => r.submission.kind === 'other'), (r) => r.result === 'retry'),
    개인정보: rate(byExpected('privacy'), (r) => r.result === 'privacy'),
    오류: rate(list, (r) => !['pass', 'retry', 'privacy'].includes(r.result)),
    기준사진누락: rate(list, (r) => r.condition === 'B' && r.refs === 0),
    중앙값ms: ms.length ? ms[Math.floor((ms.length - 1) / 2)] : '-',
    최대ms: ms.length ? ms.at(-1) : '-',
  };
}
const summary = [];
for (const condition of conditions) {
  const list = rows.filter((r) => r.condition === condition && r.round === 0);
  for (const mission of dataset.missions)
    summary.push({ 조건: condition, 미션: mission.title, ...metrics(list.filter((r) => r.mission === mission)) });
  summary.push({ 조건: condition, 미션: '전체', ...metrics(list) });
}
console.table(summary);
console.log(`결과 CSV: ${out}`);
