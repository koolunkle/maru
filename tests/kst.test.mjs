import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

async function loadModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)(() => { throw new Error('Unexpected dependency'); }, exports);
  return exports;
}

// 앱(src/utils/date.ts)과 Edge Function(supabase/functions/_shared/kst.ts)은 실행 환경이 달라 따로 두었다. 같은 날짜를 내는지 여기서 맞춘다
const app = await loadModule('../src/utils/date.ts');
const server = await loadModule('../supabase/functions/_shared/kst.ts');

const instants = [
  '2026-10-28T14:59:59.999Z', // KST 10/28 23:59:59
  '2026-10-28T15:00:00.000Z', // KST 10/29 00:00
  '2026-12-31T15:00:00.000Z', // KST 새해 첫날
  '2028-02-28T15:00:00.000Z', // KST 윤일 2/29
  '2026-11-01T14:59:00.000Z', // KST 일요일 밤
];

test('KST 날짜는 앱과 함수가 같다 (자정 경계·연말·윤년)', () => {
  for (const iso of instants) assert.equal(app.kstDate(new Date(iso)), server.kstDate(new Date(iso)), iso);
});

test('주 시작(월요일)은 앱과 함수가 같다', () => {
  for (let i = 0; i < 14; i++) {
    const day = server.addDays('2026-10-25', i);
    assert.equal(app.kstWeekStart(day), server.weekStart(day), day);
  }
  assert.equal(server.weekStart('2026-11-01'), '2026-10-26');
});

test('날짜 이동은 앱과 함수가 같다', () => {
  for (const [day, n] of [['2026-10-29', 11], ['2026-12-31', 1], ['2028-03-01', -1], ['2026-10-29', -7]]) {
    assert.equal(app.addKstDays(day, n), server.addDays(day, n), `${day} ${n}`);
  }
});
