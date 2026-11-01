import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSource } from './helpers/load-source.mjs';


const date = await loadSource('../src/utils/date.ts');
const { currentStreak } = await loadSource('../src/utils/streak.ts', { './date': date });

// 2026-10-28은 수요일, 그 주 월요일은 10-26
const today = '2026-10-28';
const p = (last_attended, streak = 5, rest_used_week = null) => ({ streak, last_attended, rest_used_week });

test('오늘이나 어제 출석했으면 이어진다', () => {
  assert.equal(currentStreak(p('2026-10-28'), today), 5);
  assert.equal(currentStreak(p('2026-10-27'), today), 5);
});

test('그저께 출석은 이번 주 쉼표를 안 썼을 때만 이어진다', () => {
  assert.equal(currentStreak(p('2026-10-26'), today), 5);
  assert.equal(currentStreak(p('2026-10-26', 5, '2026-10-19'), today), 5);
  assert.equal(currentStreak(p('2026-10-26', 5, '2026-10-26'), today), 0);
});

test('사흘 이상 쉬었거나 기록이 없으면 0', () => {
  assert.equal(currentStreak(p('2026-10-25'), today), 0);
  assert.equal(currentStreak(p(null, 0), today), 0);
  assert.equal(currentStreak(p('2026-10-28', 0), today), 0);
});

test('월초·연초 날짜 계산', () => {
  assert.equal(currentStreak(p('2026-12-31'), '2027-01-01'), 5);
  assert.equal(date.addKstDays('2026-03-01', -1), '2026-02-28');
});

test('행사 마감 안내', () => {
  assert.equal(date.endingNotice('2026-10-28', '2026-10-28'), '오늘 끝나요');
  assert.equal(date.endingNotice('2026-10-30', '2026-10-28'), '2일 뒤 끝나요');
  assert.equal(date.endingNotice('2026-11-03', '2026-10-28'), '6일 뒤 끝나요');
  assert.equal(date.endingNotice('2026-11-04', '2026-10-28'), null);
  assert.equal(date.endingNotice('2026-10-27', '2026-10-28'), null);
});
