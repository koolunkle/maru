import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
import { z } from 'zod/v4';

let endpoint;
let verification;
let saved;
let rpcCalls;
let aiCalls;
const admin = {
  from(table) {
    const query = {
      select() { return query; }, eq() { return query; }, update() { return query; },
      single() { return Promise.resolve({ data: verification, error: null }); },
      maybeSingle() { return Promise.resolve({ data: saved, error: null }); },
      then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject); },
    };
    assert.ok(['verifications', 'verification_responses', 'user_missions'].includes(table));
    return query;
  },
  storage: { from: () => ({ download: async () => ({ data: new Blob(['photo']), error: null }) }) },
  async rpc(name, args) { rpcCalls.push({ name, args }); return { data: { result: 'pass' }, error: null }; },
};
const source = await readFile(new URL('../supabase/functions/verify-mission/index.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; } }
const imports = {
  'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
  'jsr:@std/encoding@1/base64': { encodeBase64: () => 'photo' },
  'npm:zod@4.6.7': { z },
  '../_shared/ai.ts': { generateJson: async () => { aiCalls++; return { result: 'pass', message: '잘했어요' }; } },
  '../_shared/clients.ts': { admin, requireUserId: async () => 'user' },
  '../_shared/copy.ts': { CopyRules: '', hasBannedWord: () => false },
  '../_shared/http.ts': { handler: (fn) => fn, HttpError, json: (body) => body },
};
new Function('require', 'exports', 'Deno', outputText)((name) => {
  assert.ok(name in imports, name); return imports[name];
}, {}, { serve(fn) { endpoint = fn; } });
function reset(result = null) {
  verification = { id: 'v', user_id: 'user', photo_path: 'photo', ai_result: result, user_missions: {
    id: 'm', status: 'in_progress', missions: { title: 'mission', verify_hint: 'hint' },
  } };
  saved = null; rpcCalls = []; aiCalls = 0;
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
