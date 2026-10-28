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
await load(
  '../supabase/functions/moderate-comment/index.ts',
  {
    'jsr:@supabase/functions-js/edge-runtime.d.ts': {},
    'npm:zod@4.6.7': { z },
    '../_shared/ai.ts': {
      async generateJson() {
        aiCalls++;
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
