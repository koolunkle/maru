import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../supabase/functions/_shared/mission-photos.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const jpeg = new Blob([new Uint8Array([255, 216, 255, 1])]);
const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])]);

function setup(rows, files = {}, stall = false) {
  const downloads = [];
  const query = {
    select() { return query; }, eq(key, id) { assert.equal(key, 'mission_id'); assert.equal(id, 'target'); return query; },
    order() { return query; }, limit(n) { assert.equal(n, 5); return query; },
    abortSignal() { return Promise.resolve({ data: rows, error: null }); },
  };
  const exports = {};
  const imports = {
    './clients.ts': { admin: {
      from(table) { assert.equal(table, 'mission_photos'); return query; },
      storage: { from(bucket) {
        assert.equal(bucket, 'mission-photos');
        return { async download(path, _options, { signal }) {
          downloads.push(path);
          if (stall) return new Promise((resolve) => signal.addEventListener('abort', () => resolve({ data: null, error: signal.reason }), { once: true }));
          return { data: files[path], error: null };
        } };
      } },
    } },
    'jsr:@std/encoding@1/base64': { encodeBase64: (bytes) => Buffer.from(bytes).toString('base64') },
  };
  new Function('require', 'exports', outputText)((name) => imports[name], exports);
  return { load: () => exports.loadMissionPhotos('target'), downloads };
}
test('기준 사진이 없으면 저장소를 읽지 않는다', async () => {
  const { load, downloads } = setup([]);
  assert.deepEqual(await load(), []);
  assert.deepEqual(downloads, []);
});

test('기준 사진 다운로드가 응답하지 않으면 5초 제한으로 비교를 중단한다', async () => {
  const keepAlive = setInterval(() => {}, 1000);
  try {
    await assert.rejects(setup([{ storage_path: 'stalled' }], {}, true).load(), /reference_photo_unavailable/);
  } finally {
    clearInterval(keepAlive);
  }
});
test('JPEG와 PNG를 실제 바이트로 판별하고 힌트를 보존한다', async () => {
  const { load } = setup([{ storage_path: 'a', hint: 'a' }, { storage_path: 'b', hint: 'b' }], { a: jpeg, b: png });
  const photos = await load();
  assert.deepEqual(photos.map((p) => [p.image.mimeType, p.hint]), [['image/jpeg', 'a'], ['image/png', 'b']]);
});
test('일부 다운로드 오류·지원하지 않는 형식·용량 초과·개수 초과를 거부한다', async () => {
  for (const files of [{ a: jpeg }, { a: jpeg, b: new Blob(['invalid']) }, { a: jpeg, b: new Blob([new Uint8Array(2097153)]) }]) {
    await assert.rejects(setup([{ storage_path: 'a' }, { storage_path: 'b' }], files).load());
  }
  const many = setup(Array.from({ length: 5 }, () => ({ storage_path: 'a' })), { a: jpeg });
  await assert.rejects(many.load());
  assert.deepEqual(many.downloads, []);
});
