import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { beforeEach, test } from 'node:test';
import ts from 'typescript';

const operations = [];
let result;
const client = {
  from(table) {
    const operation = { table, filters: [] };
    operations.push(operation);
    const query = {
      select(columns) {
        operation.columns = columns;
        return query;
      },
      delete() {
        operation.delete = true;
        return query;
      },
      eq(column, value) {
        operation.filters.push([column, value]);
        return query;
      },
      maybeSingle() {
        return query;
      },
      then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return query;
  },
  rpc(name, args) {
    operations.push({ name, args });
    return {
      async single() {
        return result;
      },
    };
  },
};
const source = await readFile(new URL('../src/lib/daily-note.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const daily = {};
new Function('require', 'exports', outputText)((name) => {
  assert.equal(name, './supabase');
  return { supabase: client };
}, daily);

beforeEach(() => {
  operations.length = 0;
  result = { data: null, error: null };
});
const userId = '10000000-0000-4000-8000-000000000021';
const today = '2026-10-27';

test('오늘 기록은 사용자와 날짜를 둘 다 제한해 불러온다', async () => {
  result.data = { note_date: today, mood: 3, text: '오늘 한 줄' };
  assert.deepEqual(await daily.getDailyNote(userId, today), result.data);
  assert.deepEqual(operations[0].filters, [
    ['user_id', userId],
    ['note_date', today],
  ]);
});
test('기분과 한 줄은 계정·날짜를 서버에 전달해 원자적으로 저장한다', async () => {
  result.data = { note_date: today, mood: 5, text: '기록' };
  await daily.saveDailyNote(userId, today, 5, '기록');
  assert.deepEqual(operations, [
    {
      name: 'save_daily_note',
      args: {
        p_user_id: userId,
        p_note_date: today,
        p_mood: 5,
        p_text: '기록',
      },
    },
  ]);
});
test('기분 범위·계정·60자 제한을 지키고 한 줄은 생략할 수 있다', async () => {
  for (const mood of [0, 6, 1.5, NaN]) await assert.rejects(daily.saveDailyNote(userId, today, mood, ''));
  await assert.rejects(daily.saveDailyNote('', today, 1, ''));
  await assert.rejects(daily.saveDailyNote(userId, today, 1, '가'.repeat(61)));
  assert.equal(operations.length, 0);
  result.data = { note_date: today, mood: 1, text: '' };
  await daily.saveDailyNote(userId, today, 1, '');
  assert.equal(operations[0].args.p_text, '');
});
test('삭제도 사용자와 기록 날짜를 모두 제한한다', async () => {
  await daily.deleteDailyNote(userId, today);
  assert.deepEqual(operations[0].filters, [
    ['user_id', userId],
    ['note_date', today],
  ]);
  assert.equal(operations[0].delete, true);
});
test('조회·저장·삭제 오류와 빈 저장 응답을 숨기지 않는다', async () => {
  result = { data: null, error: new Error('offline') };
  await assert.rejects(daily.getDailyNote(userId, today), /offline/);
  await assert.rejects(daily.saveDailyNote(userId, today, 1, '한 줄'), /offline/);
  await assert.rejects(daily.deleteDailyNote(userId, today), /offline/);
  result = { data: null, error: null };
  await assert.rejects(daily.saveDailyNote(userId, today, 1, ''), /저장하지 못했어요/);
});
test('오늘 날짜는 기기 시간대가 아니라 한국 시간 자정에 바뀐다', async () => {
  const dateSource = await readFile(new URL('../src/utils/date.ts', import.meta.url), 'utf8');
  const dateOutput = ts.transpileModule(dateSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const dateModule = {};
  new Function('exports', dateOutput)(dateModule);
  const { kstDate } = dateModule;
  assert.equal(kstDate(new Date('2026-10-26T14:59:59.999Z')), '2026-10-26');
  assert.equal(kstDate(new Date('2026-10-26T15:00:00.000Z')), '2026-10-27');
});
