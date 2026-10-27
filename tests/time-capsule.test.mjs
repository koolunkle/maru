import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const calls = [];
let result = { data: null, error: null };
const source = await readFile(new URL('../src/lib/capsule.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const capsule = {};
new Function('require', 'exports', code)((name) => {
  assert.equal(name, './supabase');
  return { supabase: { rpc: async (name, args) => { calls.push({ name, args }); return result; } } };
}, capsule);

test('목록, 전송, 열기는 서버 함수와 요청 식별자를 사용한다', async () => {
  result = { data: [], error: null };
  assert.deepEqual(await capsule.listCapsules(), []);
  await capsule.sendCapsule('한 줄', 7, 'request');
  result = { data: '한 줄', error: null };
  assert.equal(await capsule.openCapsule('id'), '한 줄');
  assert.deepEqual(calls, [
    { name: 'list_time_capsules', args: undefined },
    { name: 'send_time_capsule', args: { p_body: '한 줄', p_days: 7, p_request_id: 'request' } },
    { name: 'open_time_capsule', args: { p_id: 'id' } },
  ]);
});
test('서버 오류는 호출자에게 전달한다', async () => {
  result = { data: null, error: new Error('offline') };
  await assert.rejects(capsule.listCapsules(), /offline/);
  await assert.rejects(capsule.sendCapsule('한 줄', 7, 'request'), /offline/);
  await assert.rejects(capsule.openCapsule('id'), /offline/);
});
