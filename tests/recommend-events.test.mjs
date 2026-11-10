import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { compileSource } from './helpers/load-source.mjs';

const run = await compileSource('../supabase/functions/recommend-missions/index.ts');
const Event = { id: 'event', title: '인도영화제', place: '마포아트센터', start_date: '2026-11-08' };

// 새 추천을 만드는 경로에서 어떤 테이블을 읽고 AI에 무엇을 넘기는지 본다. AI는 응답하지 않아 시드로 대체된다.
async function recommend(categories, ai = null, difficulty = 1) {
  const tables = [];
  let aiInput;
  let saved;
  const rows = {
    profiles: { onboarded_at: '2026-11-01', categories, district: '마포구', difficulty },
    events: [Event],
  };
  const imports = {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'npm:zod@4.6.7': { z },
    '../_shared/ai.ts': {
      generateJson: async ({ text }) => {
        aiInput = JSON.parse(text);
        return ai;
      },
    },
    '../_shared/clients.ts': {
      requireUserId: async () => 'user',
      admin: {
        from(table) {
          tables.push(table);
          const result = { data: rows[table] ?? (table === 'missions' ? [] : null), error: null };
          const query = {
            select: () => query,
            eq: () => query,
            gte: () => query,
            lte: () => query,
            order: () => query,
            limit: () => query,
            single: async () => result,
            maybeSingle: async () => result,
            then: (resolve) => resolve(result),
          };
          return query;
        },
        rpc: async (name, args) => {
          saved = args.p_ai_missions;
          return { data: {}, error: null };
        },
      },
    },
    '../_shared/copy.ts': { CopyRules: '', hasBannedWord: () => false },
    '../_shared/fallback.ts': {
      pickSeeds: () => ({ daily: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], weekly: null }),
    },
    '../_shared/http.ts': { handler: (fn) => fn, HttpError: Error, json: (body) => body },
    '../_shared/kst.ts': { kstDate: () => '2026-11-10', addDays: () => '2026-10-27' },
    '../_shared/seoul-events.ts': { weeklyEventWindow: () => ({}), eventMissionTitle: (t) => t },
  };
  let endpoint;
  run(imports, { Deno: { serve: (fn) => (endpoint = fn) } });
  await endpoint({ json: async () => ({ requestId: 'r' }) });
  return { tables, events: aiInput.events, saved };
}

test('문화·전시를 고르지 않은 사용자: 행사를 조회하지 않고 AI에 넘기지 않는다', async () => {
  const { tables, events } = await recommend(['food', 'rhythm']);
  assert.ok(!tables.includes('events'));
  assert.deepEqual(events, []);
});

test('행사가 있는 구: 문화·전시를 고른 사용자에게는 그 구의 행사를 넘긴다', async () => {
  const { tables, events } = await recommend(['culture', 'walk']);
  assert.ok(tables.includes('events'));
  assert.deepEqual(events, [Event]);
});

test('이번 주 미션 난이도: AI가 사용자 난이도와 같게 내도 +1 이상으로 저장한다', async () => {
  const mission = (difficulty) => ({
    title: '미션',
    category: 'walk',
    difficulty,
    minutes: 5,
    verify_hint: '풍경',
    reason: '산책',
    event_id: null,
  });
  const ai = { daily: [mission(1), mission(1), mission(1)], weekly: mission(3) };
  const { saved } = await recommend(['walk'], ai, 3);
  assert.deepEqual(
    saved.map((m) => m.difficulty),
    [1, 1, 1, 4],
  );
});
