import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { beforeEach, test } from 'node:test';
import ts from 'typescript';
import { z } from 'zod/v4';

// Expo/Deno 대신 경계 모듈만 주입하고 실제 소스를 실행한다.
async function loadSource(path, imports, globals = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', ...Object.keys(globals), outputText)(
    (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
    exports,
    ...Object.values(globals),
  );
  return exports;
}
let response;
const calls = [];
const mailbox = await loadSource('../src/lib/mailbox.ts', {
  './supabase': {
    supabase: {
      functions: {
        async invoke(name, options) {
          calls.push({ name, ...options });
          return response;
        },
      },
    },
  },
});
beforeEach(() => {
  calls.length = 0;
  response = { data: [], error: null };
});

test('입력 검증 후 익명 서버 요청으로 보낸다', async () => {
  const message = { id: 'saved', body: '오늘도 응원해요', status: 'approved' };
  response.data = message;
  assert.deepEqual(await mailbox.sendMailboxMessage('user-a', '  오늘도 응원해요  ', 'request-00000001'), message);
  assert.deepEqual(calls, [
    { name: 'mailbox', body: { action: 'send', body: '오늘도 응원해요', requestId: 'request-00000001' } },
  ]);
});
test('빈 입력·공백·60자 초과·계정 없음은 서버로 보내지 않는다', async () => {
  for (const body of ['', ' \n\t ', '가'.repeat(61)])
    await assert.rejects(mailbox.sendMailboxMessage('a', body, 'request'));
  for (const id of ['', '  ']) await assert.rejects(mailbox.sendMailboxMessage(id, '응원해요', 'request'));
  assert.equal(calls.length, 0);
  await mailbox.sendMailboxMessage('a', '가'.repeat(60), 'request');
  assert.equal(calls.length, 1);
});
test('수신·발신 목록과 읽음은 서버 세션을 따른다', async () => {
  await mailbox.getReceivedMailboxMessages();
  await mailbox.getSentMailboxMessages();
  await mailbox.markMailboxMessageRead('message-id');
  assert.deepEqual(
    calls.map((call) => call.body),
    [{ action: 'inbox' }, { action: 'sent' }, { action: 'read', id: 'message-id' }],
  );
});
test('응답 유실 뒤 같은 요청 식별자로 재시도한다', async () => {
  response = { data: null, error: new Error('network') };
  await assert.rejects(mailbox.sendMailboxMessage('a', '응원해요', 'request-00000001'), /network/);
  response = { data: { id: 'saved' }, error: null };
  await mailbox.sendMailboxMessage('a', '응원해요', 'request-00000001');
  assert.equal(calls[0].body.requestId, calls[1].body.requestId);
});
test('수신함 오류와 빈 응답을 빈 목록으로 숨기지 않는다', async () => {
  response = { data: null, error: new Error('unavailable') };
  await assert.rejects(mailbox.getReceivedMailboxMessages(), /unavailable/);
  response = { data: null, error: null };
  await assert.rejects(mailbox.getReceivedMailboxMessages(), /응답/);
});

let endpoint;
let user = '10000000-0000-4000-8000-000000000001';
let aiResult = null;
let aiCalls = 0;
let aiText;
const operations = [];
let results = [];
const admin = {
  async rpc(name, args) {
    operations.push({ name, args });
    return { error: null };
  },
  from(table) {
    const operation = { table, filters: [] };
    operations.push(operation);
    const query = {
      select(columns) {
        operation.columns = columns;
        return query;
      },
      eq(column, value) {
        operation.filters.push([column, value]);
        return query;
      },
      is(column, value) {
        operation.filters.push([column, value]);
        return query;
      },
      order() {
        return query;
      },
      upsert(values) {
        operation.upsert = values;
        return query;
      },
      update(values) {
        operation.update = values;
        return query;
      },
      single() {
        return query;
      },
      maybeSingle() {
        return query;
      },
      then(resolve, reject) {
        return Promise.resolve(results.shift() ?? { data: null, error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
const { handler, HttpError, json } = await loadSource('../supabase/functions/_shared/http.ts', {});
const privacy = await loadSource('../supabase/functions/_shared/moderation-privacy.ts', {});
await loadSource(
  '../supabase/functions/mailbox/index.ts',
  {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'npm:zod@4.6.7': { z },
    '../_shared/ai.ts': {
      async generateJson(req) {
        aiCalls++;
        aiText = req.text;
        return aiResult;
      },
    },
    '../_shared/clients.ts': {
      admin,
      async requireUserId() {
        if (!user) throw new HttpError(401, 'unauthorized');
        return user;
      },
    },
    '../_shared/http.ts': { handler, HttpError, json },
    '../_shared/moderation-privacy.ts': privacy,
  },
  {
    Deno: {
      serve(fn) {
        endpoint = fn;
      },
    },
  },
);
beforeEach(() => {
  operations.length = 0;
  results = [];
  user = '10000000-0000-4000-8000-000000000001';
  aiResult = null;
  aiCalls = 0;
});
const request = (body) =>
  endpoint(new Request('https://example.com/mailbox', { method: 'POST', body: JSON.stringify(body) }));

test('서버는 미인증·잘못된 동작·잘못된 입력을 거절한다', async () => {
  user = null;
  assert.equal((await request({ action: 'inbox' })).status, 401);
  user = 'user-a';
  for (const body of [
    { action: 'other' },
    { action: 'read', id: 'bad' },
    { action: 'send', requestId: 'request-00000001', body: '  ' },
    { action: 'send', requestId: 'request-00000001', body: '가'.repeat(61) },
  ])
    assert.equal((await request(body)).status, 400);
  assert.equal(operations.length, 0);
});
test('수신함은 JWT 사용자에게만 배정하고 작성자 식별자를 조회하지 않는다', async () => {
  results = [{ data: [{ id: 'inbox', body: '응원해요', read_at: null }], error: null }];
  assert.equal((await request({ action: 'inbox', userId: 'attacker-target' })).status, 200);
  assert.deepEqual(operations[0], { name: 'receive_mailbox_message', args: { recipient: user } });
  assert.ok(operations[1].filters.some(([key, value]) => key === 'recipient_id' && value === user));
  assert.equal(operations[1].columns, 'id, body, received_at, read_at');
});
test('타인의 글 읽음 요청은 404이고 수신자·공개 상태로 한정한다', async () => {
  results = [{ error: null }, { data: null, error: null }];
  assert.equal((await request({ action: 'read', id: '20000000-0000-4000-8000-000000000001' })).status, 404);
  for (const operation of operations) {
    assert.ok(operation.filters.some(([key, value]) => key === 'recipient_id' && value === user));
    assert.ok(operation.filters.some(([key, value]) => key === 'status' && value === 'published'));
  }
});
test('AI 장애면 저장된 글은 pending으로 남고 공개하지 않는다', async () => {
  const saved = { id: 'saved', request_id: 'request-00000001', body: '응원해요', status: 'pending' };
  results = [{ error: null }, { data: saved, error: null }];
  const response = await request({ action: 'send', requestId: saved.request_id, body: saved.body });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'pending');
  assert.equal(aiCalls, 1);
  assert.ok(operations.every((operation) => !operation.update));
});
test('검수 결과를 저장하며 이미 처리된 재시도는 검수를 반복하지 않는다', async () => {
  const saved = { id: 'saved', request_id: 'request-00000001', body: '응원해요', status: 'pending' };
  for (const status of ['approved', 'rejected', 'crisis']) {
    aiResult = { status };
    results = [{ error: null }, { data: saved }, { data: { ...saved, status } }];
    assert.equal(
      (await (await request({ action: 'send', requestId: saved.request_id, body: saved.body })).json()).status,
      status,
    );
  }
  aiCalls = 0;
  results = [{ error: null }, { data: { ...saved, status: 'published' } }];
  assert.equal((await request({ action: 'send', requestId: saved.request_id, body: saved.body })).status, 200);
  assert.equal(aiCalls, 0);
});
test('우체통 검수에서 개인정보를 가리고 위기 판정을 우선한다', async () => {
  const saved = { id: 'saved', request_id: 'request-00000001', body: '홍길동님 test@example.com', status: 'pending' };
  for (const [aiStatus, expected] of [['approved', 'rejected'], ['crisis', 'crisis']]) {
    aiResult = { status: aiStatus };
    results = [{ error: null }, { data: saved }, { data: { ...saved, status: expected } }];
    await request({ action: 'send', requestId: saved.request_id, body: saved.body });
    assert.doesNotMatch(aiText, /홍길동|test@example.com/);
    assert.deepEqual(operations.at(-1).update, { status: expected });
  }
});
