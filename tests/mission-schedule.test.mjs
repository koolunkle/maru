import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

async function load(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)((name) => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  }, exports);
  return exports;
}
const app = await load('../src/utils/pick-seed-missions.ts', { '@/constants/domain': { DailyMissionCount: 3 } });
const server = await load('../supabase/functions/_shared/fallback.ts');
const profile = { id: 'user', categories: ['walk'], difficulty: 1, daily_minutes: 5 };
const mission = (id, difficulty, start_date = null, end_date = null) => ({ id, difficulty, start_date, end_date, minutes: 5, category: 'walk' });

for (const [name, pick] of [['앱', (rows, date) => app.pickSeedMissions(rows, profile, date, '2026-11-08')],
  ['서버', (rows, date) => server.pickSeeds(rows, profile, date)]]) {
  test(`${name}: 시작일과 종료일을 포함하고 기간 밖 후보를 제외한다`, () => {
    const rows = [mission('expired', 1, null, '2026-11-07'), mission('future', 1, '2026-11-09'),
      mission('boundary', 1, '2026-11-08', '2026-11-08'), mission('open', 1), mission('weekly', 3)];
    const result = pick(rows, '2026-11-08');
    assert.deepEqual(new Set(result.daily.map((m) => m.id)), new Set(['boundary', 'open']));
    assert.equal(result.weekly.id, 'weekly');
    assert.ok(!pick(rows, '2026-11-09').daily.some((m) => m.id === 'boundary'));
  });
  test(`${name}: 유효 후보가 없으면 기간 밖 미션으로 채우지 않는다`, () => {
    assert.deepEqual(pick([mission('expired', 1, null, '2026-11-07')], '2026-11-08'), { daily: [], weekly: null });
  });
}
