import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadSource } from './helpers/load-source.mjs';


const drafts = await loadSource('../src/lib/drafts.ts');

test('작성 중인 입력은 지울 때까지 키별로 남는다', () => {
  assert.equal(drafts.readDraft('capsule:a'), undefined);
  drafts.writeDraft('capsule:a', { body: '안녕', days: 30 });
  drafts.writeDraft('capsule:b', { body: '다른 계정', days: 7 });
  assert.deepEqual(drafts.readDraft('capsule:a'), { body: '안녕', days: 30 });
  drafts.clearDraft('capsule:a');
  assert.equal(drafts.readDraft('capsule:a'), undefined);
  assert.deepEqual(drafts.readDraft('capsule:b'), { body: '다른 계정', days: 7 });
});

test('기기 저장소를 쓰지 않는다', async () => {
  const source = await readFile(new URL('../src/lib/drafts.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /AsyncStorage|localStorage/);
});
