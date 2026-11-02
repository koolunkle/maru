import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const testsDir = new URL('../', import.meta.url);

/**
 * TypeScript 소스를 CommonJS로 바꿔 실행하고 exports를 돌려준다. Expo·Deno 없이 실제 소스를 검사하기 위한 것이다.
 * @param {string} path tests/ 기준 상대 경로 (예: '../src/utils/date.ts')
 * @param {Record<string, unknown>} imports 소스가 import하는 이름 → 넣어 줄 모듈. 목록에 없는 import는 실패로 본다
 * @param {Record<string, unknown>} globals 전역으로 넣어 줄 값 (예: { Deno })
 */
export async function loadSource(path, imports = {}, globals = {}) {
  const source = await readFile(new URL(path, testsDir), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
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
