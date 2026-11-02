import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSource } from './helpers/load-source.mjs';

const calls = [];
let result = { data: null, error: null };
const capsule = await loadSource('../src/lib/capsule.ts', {
  './supabase': {
    supabase: {
      rpc: async (name, args) => {
        calls.push({ name, args });
        return result;
      },
    },
  },
});

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
