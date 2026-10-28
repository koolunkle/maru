import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { beforeEach, test } from 'node:test';
import ts from 'typescript';
import { z } from 'zod/v4';

async function load(path, imports, globals = {}) {
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

let endpoint;
let aiResult;
let aiCalls;
let aiText;
let results;
const queries = [];
const admin = {
  from(table) {
    const operation = { table, filters: [] };
    queries.push(operation);
    const query = {
      select(columns) {
        operation.columns = columns;
        return query;
      },
      eq(column, value) {
        operation.filters.push([column, value]);
        return query;
      },
      update(values) {
        operation.update = values;
        return query;
      },
      maybeSingle() {
        return query;
      },
      single() {
        return query;
      },
      then(resolve, reject) {
        return Promise.resolve(results.shift() ?? { data: null, error: null }).then(resolve, reject);
      },
    };
    return query;
  },
};
const { handler, HttpError, json } = await load('../supabase/functions/_shared/http.ts', {});
const privacy = await load('../supabase/functions/_shared/moderation-privacy.ts', {});
test('연락처와 명시된 이름·주소를 가리고 일반 문장은 보존한다', () => {
  for (const value of ['01012345678', '02-123-4567', '+82 10 1234 5678', 'a.b@example.com', '이름: 홍길동', '홍길동님', '서울시 강남구 테헤란로 123']) {
    assert.notEqual(privacy.filterModerationText(value).text, value);
  }
  assert.equal(privacy.filterModerationText('오늘도 응원해요').text, '오늘도 응원해요');
});
test('변형된 연락처와 식별번호, 문맥상 이름과 주소를 가린다', () => {
  const cases = [
    ['０１０-１２３４-５６７８', '０１０-１２３４-５６７８'],
    ['0 1 0 1 2 3 4 5 6 7 8', '1 2 3 4 5 6 7 8'],
    ['공일공 일이삼사 오육칠팔', '일이삼사 오육칠팔'],
    ['hello (at) example (dot) com', 'example'],
    ['카톡 아이디: secret123', 'secret123'],
    ['@private_user', 'private_user'],
    ['900101-1234567', '900101'],
    ['1234 5678 1234 5678', '1234'],
    ['저는 홍길동이에요', '홍길동'],
    ['홍길동이 힘들어요', '홍길동'],
    ['주소: 푸른 아파트 101동 202호', '푸른 아파트'],
  ];
  for (const [input, privatePart] of cases) assert.ok(!privacy.filterModerationText(input).text.includes(privatePart), input);
  assert.equal(privacy.filterModerationText('０１０-１２３４-５６７８').text, '[연락처]');
  assert.equal(privacy.filterModerationText('공일공 일이삼사 오육칠팔').hasContact, true);
  assert.ok(privacy.filterModerationText('010-1234-5678 자살하고 싶어요').text.includes('자살하고 싶어요'));
});
await load(
  '../supabase/functions/moderate-comment/index.ts',
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
        return 'user-a';
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
  aiResult = null;
  aiCalls = 0;
  results = [];
  queries.length = 0;
});
test('댓글과 릴레이 검수에 개인정보를 가리고 연락처는 승인하지 않는다', async () => {
  for (const key of ['comment_id', 'relay_id']) {
    aiResult = { status: 'approved' };
    results = [{ data: { ...pending, body: '이름은 홍길동, 서울시 강남구 테헤란로 123, 010-1234-5678' } }, { data: { status: 'rejected' } }];
    await request({ [key]: rowId });
    assert.doesNotMatch(aiText, /홍길동|테헤란로|1234-5678/);
    assert.deepEqual(queries.at(-1).update, { status: 'rejected' });
  }
});
const request = (body) => endpoint(new Request('https://example.com', { method: 'POST', body: JSON.stringify(body) }));
const rowId = '40000000-0000-4000-8000-000000000011';
const pending = { id: rowId, user_id: 'user-a', body: '응원해요', status: 'pending' };

test('댓글과 릴레이 중 하나만 선택할 수 있다', async () => {
  for (const input of [null, {}, { comment_id: rowId, relay_id: rowId }, { relay_id: 4 }, { relay_id: 'bad' }]) {
    assert.equal((await request(input)).status, 400);
  }
  assert.equal(queries.length, 0);
});
test('다른 사람의 릴레이는 검수할 수 없다', async () => {
  results = [{ data: { ...pending, user_id: 'user-b' }, error: null }];
  assert.equal((await request({ relay_id: rowId })).status, 404);
  assert.equal(aiCalls, 0);
});
test('검수 실패 시 pending을 유지하고 공개하지 않는다', async () => {
  results = [{ data: pending, error: null }];
  const response = await request({ relay_id: rowId });
  assert.deepEqual(await response.json(), { status: 'pending', judged_by: null });
  assert.equal(queries.length, 1);
});
test('릴레이의 세 가지 검수 결과를 pending 상태일 때만 저장한다', async () => {
  for (const status of ['approved', 'rejected', 'crisis']) {
    aiResult = { status };
    results = [
      { data: pending, error: null },
      { data: { status }, error: null },
    ];
    queries.length = 0;
    const response = await request({ relay_id: rowId });
    assert.deepEqual(await response.json(), { status, judged_by: 'ai' });
    assert.equal(queries[1].table, 'relay_messages');
    assert.deepEqual(queries[1].update, { status });
    assert.ok(queries[1].filters.some(([key, value]) => key === 'status' && value === 'pending'));
  }
});
test('기존 댓글 검수와 이미 공개된 글의 재호출을 유지한다', async () => {
  aiResult = { status: 'approved' };
  results = [
    { data: pending, error: null },
    { data: { status: 'approved' }, error: null },
  ];
  assert.equal((await (await request({ comment_id: rowId })).json()).status, 'approved');
  assert.equal(queries[1].table, 'comments');
  aiCalls = 0;
  results = [{ data: { ...pending, status: 'published' }, error: null }];
  assert.deepEqual(await (await request({ relay_id: rowId })).json(), { status: 'published', judged_by: null });
  assert.equal(aiCalls, 0);
});
test('저장 오류를 성공으로 표시하지 않는다', async () => {
  aiResult = { status: 'approved' };
  results = [
    { data: pending, error: null },
    { data: null, error: new Error('db unavailable') },
  ];
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await request({ relay_id: rowId })).status, 500);
  } finally {
    console.error = originalError;
  }
});
