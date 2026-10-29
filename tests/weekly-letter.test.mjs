import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

async function loadModule(path, require = () => { throw new Error('Unexpected dependency'); }) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)(require, exports);
  return exports;
}

const date = await loadModule('../src/utils/date.ts');
const letter = await loadModule('../src/utils/weekly-letter.ts', (name) => {
  assert.equal(name, './date', '시연용 리포트는 날짜 외에 API·개인 기록 의존성이 없다');
  return date;
});
const kst = await loadModule('../supabase/functions/_shared/kst.ts');
const privacy = await loadModule('../supabase/functions/_shared/moderation-privacy.ts');
const server = await loadModule('../supabase/functions/_shared/weekly-letter.ts', (name) => {
  assert.equal(name, './kst.ts');
  return kst;
});

test('리포트에 보내는 기록만 가리고 원문과 기분은 유지한다', () => {
  const notes = [{ text: '010-1234-5678', mood: 3 }, { text: null, mood: 2 }];
  assert.deepEqual(privacy.filterNoteTexts(notes), [{ text: '[연락처]', mood: 3 }, { text: null, mood: 2 }]);
  assert.equal(notes[0].text, '010-1234-5678');
});

test('서버는 과거 또는 이번 주의 실제 월요일만 받는다', () => {
  assert.equal(server.validLetterWeek('2026-10-26', '2026-10-27'), true);
  for (const week of ['2026-10-27', '2026-11-02', '2026-02-30', '', null]) {
    assert.equal(server.validLetterWeek(week, '2026-10-27'), false);
  }
});

test('이번 주 변경과 지난 주 확정 및 AI 실패 재시도를 구분한다', () => {
  const current = { source: 'ai', finalized: false, input_hash: 'old' };
  assert.equal(server.reuseLetter(current, 'old', false), true);
  assert.equal(server.reuseLetter(current, 'new', false), false);
  assert.equal(server.reuseLetter(current, 'old', true), false);
  assert.equal(server.reuseLetter({ ...current, finalized: true }, 'new', true), true);
  assert.equal(server.reuseLetter({ ...current, source: 'rule' }, 'old', false), false);
});

test('KST 일요일에서 월요일로 넘어갈 때 주차가 바뀐다', () => {
  const sunday = date.kstDate(new Date('2026-10-25T14:59:59.999Z'));
  const monday = date.kstDate(new Date('2026-10-25T15:00:00.000Z'));
  assert.equal(date.kstWeekStart(sunday), '2026-10-19');
  assert.equal(date.kstWeekStart(monday), '2026-10-26');
  assert.equal(date.kstWeekStart('2026-11-01'), '2026-10-26');
});

test('시연용 주차는 이번 주와 지난 3주이며 연도 경계를 넘을 수 있다', () => {
  assert.deepEqual(letter.demoLetterWeeks('2027-01-01'), [
    '2026-12-28', '2026-12-21', '2026-12-14', '2026-12-07',
  ]);
  assert.deepEqual(letter.demoLetterWeeks('2026-10-27'), [
    '2026-10-26', '2026-10-19', '2026-10-12', '2026-10-05',
  ]);
});

test('잘못된 날짜·월요일 아닌 날짜·미래·범위 밖 주차는 시연 목록에 없다', () => {
  const weeks = letter.demoLetterWeeks('2026-10-27');
  for (const invalid of ['', 'bad', '2026-02-30', '2026-10-27', '2026-11-02', '2026-09-28', '2026-10-26/extra']) {
    assert.equal(weeks.includes(invalid), false, invalid);
  }
});

test('편지 날짜 범위는 월요일부터 일요일까지이며 윤년과 연말도 처리한다', () => {
  assert.equal(letter.formatLetterWeek('2026-10-26'), '2026.10.26 – 2026.11.01');
  assert.equal(letter.formatLetterWeek('2026-12-28'), '2026.12.28 – 2027.01.03');
  assert.equal(letter.formatLetterWeek('2024-02-26'), '2024.02.26 – 2024.03.03');
});

