import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/admin-missions.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
function setup(response) {
  const calls = [];
  const exports = {};
  new Function("exports", "fetch", "process", outputText)(
    exports,
    async (url, options) => {
      calls.push({ url, options });
      return response;
    },
    {
      env: {
        EXPO_PUBLIC_SUPABASE_URL: "https://example.invalid",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
      },
    },
  );
  return { ...exports, calls };
}
test("관리자 비밀번호는 URL이나 저장소 대신 요청 본문에만 전달한다", async () => {
  const api = setup({ ok: true, json: async () => ({ ok: true }) });
  assert.deepEqual(
    await api.adminRequest("test-only-password", {
      action: "check",
      password: "ignored",
    }),
    { ok: true },
  );
  assert.equal(
    api.calls[0].url,
    "https://example.invalid/functions/v1/admin-missions",
  );
  assert.equal(api.calls[0].options.headers.apikey, "public-key");
  assert.deepEqual(JSON.parse(api.calls[0].options.body), {
    action: "check",
    password: "test-only-password",
  });
  assert.ok(api.calls[0].options.signal);
});
test("권한·저장소 오류와 잘못된 응답을 성공으로 숨기지 않는다", async () => {
  await assert.rejects(
    setup({
      ok: false,
      json: async () => ({ error: "admin_unauthorized" }),
    }).adminRequest("secret", { action: "check" }),
    /비밀번호/,
  );
  await assert.rejects(
    setup({
      ok: false,
      json: async () => ({ error: "photo_limit" }),
    }).adminRequest("secret", { action: "upload" }),
    /4장/,
  );
  await assert.rejects(
    setup({ ok: true, json: async () => null }).adminRequest("secret", {
      action: "list",
    }),
    /응답/,
  );
});
