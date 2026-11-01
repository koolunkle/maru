import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { z } from 'zod';

import { loadSource } from './helpers/load-source.mjs';

let endpoint;
const rpcCalls = [];
const { handler, HttpError, json } = await loadSource('../supabase/functions/_shared/http.ts');
await loadSource(
  '../supabase/functions/place-furniture/index.ts',
  {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'npm:zod@4.6.7': { z },
    '../_shared/clients.ts': {
      admin: { async rpc(name, args) { rpcCalls.push({ name, args }); return { error: null }; } },
      async requireUserId() { return 'user-a'; },
    },
    '../_shared/http.ts': { handler, HttpError, json },
  },
  { Deno: { serve(fn) { endpoint = fn; } } },
);
const request = (body) => endpoint(new Request('https://example.com', { method: 'POST', body: JSON.stringify(body) }));
beforeEach(() => { rpcCalls.length = 0; });

test('놓기는 기존처럼 place_furniture 하나를 부른다', async () => {
  assert.equal((await request({ slot: 'floor-1', furnitureId: 'sofa' })).status, 200);
  assert.deepEqual(rpcCalls, [{ name: 'place_furniture', args: { p_user_id: 'user-a', p_slot: 'floor-1', p_furniture_id: 'sofa' } }]);
});
test('옮기기는 자리 바꾸기까지 move_furniture 한 번으로 처리한다', async () => {
  assert.equal((await request({ slot: 'floor-2', furnitureId: 'sofa', move: true })).status, 200);
  assert.deepEqual(rpcCalls, [{ name: 'move_furniture', args: { p_user_id: 'user-a', p_furniture_id: 'sofa', p_slot: 'floor-2' } }]);
});
test('가구 없이 옮기기나 없는 자리는 거절한다', async () => {
  for (const body of [{ slot: 'floor-1', furnitureId: null, move: true }, { slot: 'roof', furnitureId: 'sofa' }, null]) {
    assert.equal((await request(body)).status, 400);
  }
  assert.equal(rpcCalls.length, 0);
});
