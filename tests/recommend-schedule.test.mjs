import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { compileSource } from './helpers/load-source.mjs';

const run = await compileSource('../supabase/functions/recommend-missions/index.ts');

function setup(prior, existing) {
  let endpoint;
  const calls = [];
  const repaired = { daily: [{ id: 'valid' }], weekly: null, source: 'rule' };
  class HttpError extends Error { constructor(status, code) { super(code); this.status = status; } }
  const imports = {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'npm:zod@4.6.7': { z },
    '../_shared/ai.ts': { generateJson: () => { throw new Error('캐시에서 AI 호출'); } },
    '../_shared/clients.ts': { requireUserId: async () => 'user', admin: {
      from(table) {
        assert.ok(['recommendation_requests', 'daily_recommendations'].includes(table));
        const query = { select() { return query; }, eq() { return query; },
          maybeSingle: async () => ({ data: table === 'recommendation_requests' ? prior : existing, error: null }) };
        return query;
      },
      async rpc(name, args) { calls.push({ name, args }); return { data: repaired, error: null }; },
    } },
    '../_shared/copy.ts': { CopyRules: '', hasBannedWord: () => false },
    '../_shared/fallback.ts': {},
    '../_shared/http.ts': { handler: (fn) => fn, HttpError, json: (body) => body },
    '../_shared/kst.ts': { kstDate: () => '2026-11-09' },
    '../_shared/seoul-events.ts': { weeklyEventWindow: () => ({}) },
  };
  run(imports, { Deno: { serve(fn) { endpoint = fn; } } });
  return { endpoint, calls, repaired };
}
const request = (refresh) => ({ json: async () => ({ requestId: 'same', refresh }) });

test('저장된 추천도 기간을 보정하는 RPC를 거친다', async () => {
  const { endpoint, calls, repaired } = setup(null, { refresh_count: 0, daily_mission_ids: ['expired'] });
  assert.deepEqual(await endpoint(request(false)), repaired);
  assert.equal(calls[0].name, 'save_recommendation');
  assert.equal(calls[0].args.p_refresh, false);
});
test('새로고침을 이미 쓴 동일 요청 재시도도 과거 응답을 그대로 돌려주지 않는다', async () => {
  const { endpoint, calls, repaired } = setup({ rec_date: '2026-11-09', refresh: true, response: { daily: ['expired'] } }, { refresh_count: 1 });
  assert.deepEqual(await endpoint(request(true)), repaired);
  assert.equal(calls.length, 1);
});
test('다른 본문의 요청 ID 재사용은 계속 거부한다', async () => {
  const { endpoint, calls } = setup({ rec_date: '2026-11-08', refresh: false }, null);
  await assert.rejects(endpoint(request(false)), (e) => e.status === 409 && e.message === 'request_body_changed');
  assert.equal(calls.length, 0);
});
