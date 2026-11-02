import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { loadSource } from './helpers/load-source.mjs';

let endpoint;
let verification;
let saved;
let rpcCalls;
let aiCalls;
let photos;
let photoError;
let fallback;
let aiRequest;
const admin = {
  from(table) {
    const query = {
      select() { return query; }, eq() { return query; }, update() { return query; },
      single() { return Promise.resolve({ data: verification, error: null }); },
      maybeSingle() { return Promise.resolve({ data: table === 'app_config' ? { value: fallback } : saved, error: null }); },
      then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject); },
    };
    assert.ok(['verifications', 'verification_responses', 'user_missions', 'app_config'].includes(table));
    return query;
  },
  storage: { from: () => ({ download: async () => ({ data: new Blob(['photo']), error: null }) }) },
  async rpc(name, args) { rpcCalls.push({ name, args }); return { data: { result: 'pass' }, error: null }; },
};
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; } }
const imports = {
  'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
  'jsr:@std/encoding@1/base64': { encodeBase64: () => 'photo' },
  'npm:zod@4.6.7': { z },
  '../_shared/ai.ts': { generateJson: async (request) => { aiCalls++; aiRequest = request; return { result: 'pass', message: '잘했어요' }; } },
  '../_shared/mission-photos.ts': { loadMissionPhotos: async (id) => {
    assert.equal(id, 'mission-id');
    if (photoError) throw photoError;
    return photos;
  } },
  '../_shared/clients.ts': { admin, requireUserId: async () => 'user' },
  '../_shared/copy.ts': { CopyRules: '', hasBannedWord: () => false },
  '../_shared/http.ts': { handler: (fn) => fn, HttpError, json: (body) => body },
  '../_shared/moderation-privacy.ts': { filterModerationText: (text) => ({ text, hasContact: false }) },
};
await loadSource('../supabase/functions/verify-mission/index.ts', imports, { Deno: { serve(fn) { endpoint = fn; } } });
function reset(result = null) {
  verification = { id: 'v', user_id: 'user', photo_path: 'photo', ai_result: result, user_missions: {
    id: 'm', mission_id: 'mission-id', status: 'in_progress', missions: { title: 'mission', verify_hint: 'hint' },
  } };
  saved = null; rpcCalls = []; aiCalls = 0; photos = []; photoError = null; fallback = 'retry_later'; aiRequest = null;
}
const req = () => ({ json: async () => ({ verification_id: 'v' }) });
test('새 판정은 결과 확정 RPC 하나로 저장한다', async () => {
  reset();
  assert.deepEqual(await endpoint(req()), { result: 'pass' });
  assert.equal(aiCalls, 1);
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].name, 'finish_verification');
  assert.equal(rpcCalls[0].args.p_verification_id, 'v');
});
test('이미 확정된 판정은 AI 재호출 없이 저장된 응답을 돌려준다', async () => {
  reset('pass'); saved = { response: { result: 'pass', streak: 1 } };
  assert.deepEqual(await endpoint(req()), saved.response);
  assert.equal(aiCalls, 0);
  assert.equal(rpcCalls.length, 0);
});

test('제출 사진과 해당 미션의 기준 사진·원본 힌트를 전달한다', async () => {
  reset(); photos = [{ image: { data: 'reference', mimeType: 'image/png' }, hint: '원본 힌트' }];
  await endpoint(req());
  assert.equal(aiRequest.image, 'photo');
  assert.deepEqual(aiRequest.referenceImages, [photos[0].image]);
  assert.deepEqual(JSON.parse(aiRequest.text).reference_hints, ['원본 힌트']);
  assert.match(aiRequest.system, /개인정보는 제출 사진만/);
});

test('기준 사진 오류는 AI 부분 비교 없이 재시도를 안내한다', async () => {
  reset(); photoError = new Error('download');
  await assert.rejects(endpoint(req()), (e) => e.status === 503);
  assert.equal(aiCalls, 0);
  assert.equal(rpcCalls.length, 0);
});

test('기준 사진 오류도 기존 통과 대체 설정과 원자적 보상 경로를 따른다', async () => {
  reset(); photoError = new Error('download'); fallback = 'pass';
  await endpoint(req());
  assert.equal(aiCalls, 0);
  assert.equal(rpcCalls[0].args.p_judged_by, 'rule');
});
