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

const { nextReward } = await loadModule('../src/utils/next-reward.ts');

// supabase/seed.sql의 가구 6종
const furniture = [
  { id: 'plant', name: '화분', unlock_rule: { type: 'first_mission' }, sort: 1 },
  { id: 'lamp', name: '스탠드', unlock_rule: { type: 'streak', days: 3 }, sort: 2 },
  { id: 'sofa', name: '소파', unlock_rule: { type: 'streak', days: 7 }, sort: 3 },
  { id: 'shoe_rack', name: '운동화 선반', unlock_rule: { type: 'category_count', category: 'walk', count: 5 }, sort: 4 },
  { id: 'clock', name: '벽시계', unlock_rule: { type: 'first_weekly' }, sort: 5 },
  { id: 'poster', name: '전시 포스터', unlock_rule: { type: 'event_mission' }, sort: 6 },
];
const walk = { category: 'walk', event_id: null };
const food = { category: 'food', event_id: null };
const progress = (over = {}) => ({
  owned: new Set(['plant', 'lamp', 'sofa']),
  completedByCategory: {},
  streak: 0,
  attendedToday: true,
  ...over,
});

test('처음이면 어떤 미션이든 화분', () => {
  assert.equal(nextReward(food, 'daily', furniture, progress({ owned: new Set() })), '완료하면 화분');
});

test('ROADMAP 완료 기준: 산책 3회 완료 계정의 산책 카드', () => {
  assert.equal(nextReward(walk, 'daily', furniture, progress({ completedByCategory: { walk: 3 } })), '2번 더 하면 운동화 선반');
  assert.equal(nextReward(walk, 'daily', furniture, progress({ completedByCategory: { walk: 4 } })), '완료하면 운동화 선반');
  assert.equal(nextReward(food, 'daily', furniture, progress({ completedByCategory: { walk: 4 } })), null);
});

test('주간 미션은 벽시계, 행사 미션은 전시 포스터', () => {
  assert.equal(nextReward(food, 'weekly', furniture, progress()), '완료하면 벽시계');
  assert.equal(nextReward({ category: 'culture', event_id: 'e1' }, 'daily', furniture, progress()), '완료하면 전시 포스터');
});

test('연속 출석은 오늘 아직 출석하지 않았을 때만', () => {
  const owned = new Set(['plant']);
  assert.equal(nextReward(food, 'daily', furniture, progress({ owned, streak: 1, attendedToday: false })), '2일 이어 가면 스탠드');
  assert.equal(nextReward(food, 'daily', furniture, progress({ owned, streak: 2, attendedToday: false })), '완료하면 스탠드');
  assert.equal(nextReward(food, 'daily', furniture, progress({ owned, streak: 2, attendedToday: true })), null);
});

test('가장 가까운 것 하나, 같으면 가구 순서', () => {
  const p = progress({ owned: new Set(['plant']), streak: 2, attendedToday: false, completedByCategory: { walk: 4 } });
  // 스탠드(1일)와 운동화 선반(1번)이 같으면 sort가 앞선 스탠드
  assert.equal(nextReward(walk, 'daily', furniture, p), '완료하면 스탠드');
  assert.equal(nextReward(walk, 'daily', furniture, { ...p, streak: 0 }), '완료하면 운동화 선반');
});

test('모두 가졌으면 표시하지 않는다', () => {
  assert.equal(nextReward(walk, 'weekly', furniture, progress({ owned: new Set(furniture.map((f) => f.id)) })), null);
});
