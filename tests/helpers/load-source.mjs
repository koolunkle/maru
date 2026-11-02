import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const testsDir = new URL('../', import.meta.url);

/**
 * TypeScript 소스를 CommonJS로 한 번 바꿔 두고, 실행할 때마다 새 exports를 돌려주는 함수를 만든다.
 * 테스트마다 다른 import·전역으로 같은 소스를 여러 번 실행할 때 쓴다.
 * @param {string} path tests/ 기준 상대 경로 (예: '../src/utils/date.ts')
 * @returns {Promise<(imports?: Record<string, unknown>, globals?: Record<string, unknown>) => Record<string, any>>}
 */
export async function compileSource(path) {
  const source = await readFile(new URL(path, testsDir), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  return (imports = {}, globals = {}) => {
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
  };
}

/**
 * TypeScript 소스를 CommonJS로 바꿔 실행하고 exports를 돌려준다. Expo·Deno 없이 실제 소스를 검사하기 위한 것이다.
 * @param {string} path tests/ 기준 상대 경로 (예: '../src/utils/date.ts')
 * @param {Record<string, unknown>} imports 소스가 import하는 이름 → 넣어 줄 모듈. 목록에 없는 import는 실패로 본다
 * @param {Record<string, unknown>} globals 전역으로 넣어 줄 값 (예: { Deno })
 */
export async function loadSource(path, imports = {}, globals = {}) {
  return (await compileSource(path))(imports, globals);
}
