import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { compileSource } from "./helpers/load-source.mjs";

const run = await compileSource("../supabase/functions/admin-missions/index.ts");
const id = "10000000-0000-4000-8000-000000000081";
const secret = "test-only-admin-password-123456";
const mission = {
  title: "산책하기",
  category: "walk",
  difficulty: 1,
  minutes: 5,
  verify_hint: "하늘",
  reason: null,
  start_date: null,
  end_date: null,
};
const image = Buffer.from([255, 216, 255, 217]).toString("base64");

function setup(options = {}) {
  let endpoint;
  const calls = [];
  class HttpError extends Error {
    constructor(status, code) {
      super(code);
      this.status = status;
    }
  }
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  const client = {
    async rpc(name, args) {
      calls.push({ name, args });
      if (name === "check_admin_attempt")
        return {
          data: !options.rateLimit,
          error: options.rateError ? new Error("DB unavailable") : null,
        };
      return {
        data: 7,
        error: options.rpcError ? { message: options.rpcError } : null,
      };
    },
    from(table) {
      const op = { table, filters: [] };
      calls.push(op);
      const query = {
        select() {
          return query;
        },
        eq(k, v) {
          op.filters.push([k, v]);
          return query;
        },
        neq(k, v) {
          op.filters.push(["not", k, v]);
          return query;
        },
        order() {
          return query;
        },
        ilike(k, v) {
          op.search = [k, v];
          return query;
        },
        insert(value) {
          op.insert = value;
          return query;
        },
        update(value) {
          op.update = value;
          return query;
        },
        delete() {
          op.delete = true;
          return query;
        },
        range: async (from, to) => {
          op.range = [from, to];
          return { data: [], count: 0, error: null };
        },
        single: async () => ({ data: { id, ...mission }, error: null }),
        maybeSingle: async () => ({
          data:
            table === "missions"
              ? options.missingMission
                ? null
                : { id }
              : options.missingPhoto
                ? null
                : {
                    id: 7,
                    mission_id: id,
                    storage_path: `${id}/ref.jpg`,
                    hint: "원본",
                  },
          error: null,
        }),
        then(resolve, reject) {
          return Promise.resolve({
            data: options.photos ?? [],
            error:
              op.delete && options.deleteError
                ? new Error("DB delete unavailable")
                : null,
          }).then(resolve, reject);
        },
      };
      return query;
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, bytes, config) {
            calls.push({ upload: path, bucket, size: bytes.length, config });
            return {
              error: options.uploadError
                ? new Error("storage unavailable")
                : null,
            };
          },
          async remove(paths) {
            calls.push({ remove: paths, bucket });
            return {
              error: options.removeError
                ? new Error("storage unavailable")
                : null,
            };
          },
          async createSignedUrl(path, ttl) {
            calls.push({ signed: path, ttl });
            return {
              data: { signedUrl: "https://test.invalid/signed" },
              error: null,
            };
          },
        };
      },
    },
  };
  const imports = {
    "jsr:@supabase/functions-js/edge-runtime.d.ts": {},
    "jsr:@std/encoding@1/base64": {
      decodeBase64: (s) => new Uint8Array(Buffer.from(s, "base64")),
    },
    "npm:zod@4.6.7": { z },
    "../_shared/clients.ts": { admin: client },
    "../_shared/http.ts": {
      HttpError,
      json,
      handler: (fn) => async (req) => {
        if (req.method === "OPTIONS")
          return new Response(null, { status: 204 });
        try {
          return await fn(req);
        } catch (e) {
          return json(
            { error: e instanceof HttpError ? e.message : "internal_error" },
            e.status ?? 500,
          );
        }
      },
    },
  };
  run(imports, {
    Deno: {
      env: { get: () => (options.unconfigured ? undefined : secret) },
      serve(fn) {
        endpoint = fn;
      },
    },
  });
  return {
    calls,
    async invoke(body = {}, method = "POST") {
      const response = await endpoint(
        new Request("https://test.invalid/functions/v1/admin-missions", {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "203.0.113.1",
          },
          ...(method === "GET" || method === "OPTIONS"
            ? {}
            : { body: JSON.stringify({ password: secret, ...body }) }),
        }),
      );
      return {
        status: response.status,
        body: response.status === 204 ? null : await response.json(),
        headers: response.headers,
      };
    },
  };
}

test("비밀번호가 없거나 틀리면 모든 관리 동작을 차단한다", async () => {
  for (const action of [
    "check",
    "list",
    "save",
    "delete",
    "photos",
    "upload",
    "delete_photo",
  ]) {
    for (const password of ["", "wrong"]) {
      const api = setup();
      const result = await api.invoke({ action, password });
      assert.equal(result.status, 401);
      assert.equal(result.body.error, "admin_unauthorized");
      assert.ok(api.calls.every((c) => c.name === "check_admin_attempt"));
      assert.ok(
        api.calls.every((c) => !JSON.stringify(c).includes(password || secret)),
      );
    }
  }
});
test("설정 누락·입력 제한·DB 장애 시 권한을 부여하지 않는다", async () => {
  assert.equal(
    (await setup({ unconfigured: true }).invoke({ action: "check" })).status,
    503,
  );
  assert.equal(
    (await setup({ rateLimit: true }).invoke({ action: "list" })).status,
    429,
  );
  assert.equal(
    (await setup({ rateError: true }).invoke({ action: "list" })).status,
    500,
  );
});
test("비밀번호 검사는 전체 제한과 주소별 제한을 적용하고 응답 캐시를 막는다", async () => {
  const api = setup();
  const result = await api.invoke({ action: "check" });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(
    api.calls.map((c) => c.args.p_limit ?? 5),
    [100, 5],
  );
  assert.ok(
    api.calls.every((c) => c.args.p_valid && c.args.p_key_hash.length === 64),
  );
});
test("본문 크기·잘못된 입력·역전된 날짜를 거부한다", async () => {
  assert.equal(
    (
      await setup().invoke({
        action: "upload",
        image: "A".repeat(3 * 1024 * 1024),
      })
    ).status,
    413,
  );
  for (const changed of [
    { title: "" },
    { title: "가".repeat(41) },
    { difficulty: 6 },
    { minutes: 0 },
    { start_date: "2026-02-30" },
  ]) {
    assert.equal(
      (
        await setup().invoke({
          action: "save",
          mission: { ...mission, ...changed },
        })
      ).status,
      400,
    );
  }
  const result = await setup().invoke({
    action: "save",
    mission: { ...mission, start_date: "2026-11-03", end_date: "2026-11-02" },
  });
  assert.equal(result.body.error, "invalid_dates");
});
test("공용 미션만 페이지 조회하고 신규 미션은 seed로 저장한다", async () => {
  const api = setup();
  assert.equal(
    (await api.invoke({ action: "list", q: "_%", page: 2 })).status,
    200,
  );
  const list = api.calls.find((c) => c.table === "missions");
  assert.deepEqual(list.filters, [["not", "source", "ai"]]);
  assert.deepEqual(list.range, [20, 39]);
  assert.deepEqual(list.search, ["title", "%\\_\\%%"]);
  assert.equal((await api.invoke({ action: "save", mission })).status, 200);
  assert.equal(api.calls.find((c) => c.insert)?.insert.source, "seed");
  assert.equal(
    (
      await setup({ missingMission: true }).invoke({
        action: "save",
        id,
        mission,
      })
    ).status,
    404,
  );
});
test("사용자 기록이 있는 미션 삭제는 원자적 RPC에서 거절한다", async () => {
  const result = await setup({ rpcError: "mission_has_records" }).invoke({
    action: "delete",
    id,
  });
  assert.equal(result.status, 409);
  assert.equal(result.body.error, "mission_has_records");
});
test("이미지 형식·크기를 확인하고 연결 오류 시 업로드한 파일만 정리한다", async () => {
  assert.equal(
    (
      await setup().invoke({
        action: "upload",
        id,
        image: Buffer.from("text").toString("base64"),
      })
    ).status,
    400,
  );
  assert.equal(
    (await setup().invoke({ action: "upload", id, image: "A".repeat(2796205) }))
      .status,
    400,
  );
  const api = setup({ rpcError: "photo_limit" });
  const result = await api.invoke({
    action: "upload",
    id,
    image,
    hint: "원본 힌트",
  });
  assert.equal(result.status, 409);
  assert.deepEqual(api.calls.find((c) => c.remove).remove, [
    api.calls.find((c) => c.upload).upload,
  ]);
  assert.equal(
    api.calls.find((c) => c.name === "admin_attach_photo").args.p_hint,
    "원본 힌트",
  );
  const failed = setup({ rpcError: "photo_limit", removeError: true });
  assert.equal(
    (await failed.invoke({ action: "upload", id, image })).body.error,
    "photo_cleanup_required",
  );
});
test("사진 파일 삭제 오류는 기존 연결을 유지하고 연결 정리 오류는 재시도를 알린다", async () => {
  const api = setup({ removeError: true });
  assert.equal(
    (await api.invoke({ action: "delete_photo", photoId: 7 })).status,
    500,
  );
  assert.ok(!api.calls.some((c) => c.delete));
  assert.equal(
    (
      await setup({ deleteError: true }).invoke({
        action: "delete_photo",
        photoId: 7,
      })
    ).body.error,
    "photo_cleanup_required",
  );
  assert.equal(
    (
      await setup({ missingPhoto: true }).invoke({
        action: "delete_photo",
        photoId: 7,
      })
    ).status,
    200,
  );
});

test("등록한 사진의 경로·힌트와 5분 미리보기 서명을 보존한다", async () => {
  const api = setup({
    photos: [{ id: 7, storage_path: `${id}/ref.jpg`, hint: "간판" }],
  });
  const uploaded = await api.invoke({
    action: "upload",
    id,
    image,
    hint: "간판",
  });
  assert.equal(uploaded.status, 200);
  assert.equal(uploaded.body.id, 7);
  const upload = api.calls.find((c) => c.upload);
  assert.match(upload.upload, new RegExp(`^${id}/[0-9a-f-]+\\.jpg$`));
  assert.equal(upload.config.contentType, "image/jpeg");
  assert.ok(!api.calls.some((c) => c.remove));
  const listed = await api.invoke({ action: "photos", id });
  assert.deepEqual(listed.body, [
    {
      id: 7,
      storage_path: `${id}/ref.jpg`,
      hint: "간판",
      url: "https://test.invalid/signed",
    },
  ]);
  assert.equal(api.calls.find((c) => c.signed).ttl, 300);
  assert.equal(
    (await api.invoke({ action: "delete_photo", photoId: 7 })).status,
    200,
  );
  assert.ok(api.calls.some((c) => c.delete));
});

test("파일 업로드가 거절되면 사진 연결을 만들지 않는다", async () => {
  const api = setup({ uploadError: true });
  assert.equal((await api.invoke({ action: "upload", id, image })).status, 500);
  assert.ok(!api.calls.some((c) => c.name === "admin_attach_photo"));
});
