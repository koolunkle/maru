import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { decodeBase64 } from "jsr:@std/encoding@1/base64";
import { z } from "npm:zod@4.6.7";

import { admin } from "../_shared/clients.ts";
import { handler, HttpError, json } from "../_shared/http.ts";

const Categories = [
  "walk",
  "food",
  "culture",
  "growth",
  "neighborhood",
  "rhythm",
  "people",
] as const;
const MissionSchema = z
  .object({
    title: z.string().trim().min(1).max(40),
    category: z.enum(Categories),
    difficulty: z.number().int().min(1).max(5),
    minutes: z.number().int().min(1).max(1440),
    verify_hint: z.string().trim().min(1).max(30),
    reason: z.string().trim().max(50).nullable(),
    start_date: z.iso.date().nullable(),
    end_date: z.iso.date().nullable(),
  })
  .strict();

async function hash(text: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  );
}

async function authorize(req: Request, password: unknown) {
  const secret = Deno.env.get("ADMIN_PASSWORD");
  if (!secret || secret.length < 16)
    throw new HttpError(503, "admin_not_configured");
  const supplied =
    typeof password === "string" && password.length <= 512 ? password : "";
  const [expected, actual] = await Promise.all([hash(secret), hash(supplied)]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++)
    difference |= expected[i] ^ actual[i];
  // 가장 가까운 프록시 주소를 사용한다. 제공되지 않으면 공통 제한을 적용한다.
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "unknown";
  const key = Array.from(await hash(`${secret}:${ip}`), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  // 주소 헤더를 바꾸더라도 전체 비밀번호 추측 횟수에는 상한을 둔다.
  const globalKey = Array.from(await hash(`${secret}:global`), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const global = await admin.rpc("check_admin_attempt", {
    p_key_hash: globalKey,
    p_valid: difference === 0,
    p_limit: 100,
  });
  if (global.error) throw global.error;
  if (!global.data) throw new HttpError(429, "admin_rate_limit");
  const { data, error } = await admin.rpc("check_admin_attempt", {
    p_key_hash: key,
    p_valid: difference === 0,
  });
  if (error) throw error;
  if (!data) throw new HttpError(429, "admin_rate_limit");
  if (difference !== 0) throw new HttpError(401, "admin_unauthorized");
}

async function inputBody(req: Request) {
  if (req.method !== "POST") throw new HttpError(405, "method_not_allowed");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 3 * 1024 * 1024) {
      await reader.cancel();
      throw new HttpError(413, "photo_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;
  } catch {
    throw new HttpError(400, "invalid_request");
  }
}

function uuid(value: unknown) {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new HttpError(400, "invalid_mission");
  return parsed.data;
}

async function publicMission(id: string) {
  const { data, error } = await admin
    .from("missions")
    .select("id")
    .eq("id", id)
    .neq("source", "ai")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "mission_not_found");
}

const handleRequest = handler(async (req) => {
  const input = await inputBody(req);
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new HttpError(400, "invalid_request");
  await authorize(req, input.password);
  if (input.action === "check") return json({ ok: true });

  if (input.action === "list") {
    const page = z
      .number()
      .int()
      .min(1)
      .max(10000)
      .safeParse(input.page ?? 1);
    const q = z
      .string()
      .trim()
      .max(100)
      .safeParse(input.q ?? "");
    if (!page.success || !q.success)
      throw new HttpError(400, "invalid_request");
    let query = admin
      .from("missions")
      .select("*", { count: "exact" })
      .neq("source", "ai")
      .order("title")
      .order("id");
    if (q.data)
      query = query.ilike("title", `%${q.data.replace(/[\\%_]/g, "\\$&")}%`);
    const { data, error, count } = await query.range(
      (page.data - 1) * 20,
      page.data * 20 - 1,
    );
    if (error) throw error;
    return json({ items: data, total: count, page: page.data });
  }

  if (input.action === "save") {
    const parsed = MissionSchema.safeParse(input.mission);
    if (!parsed.success) throw new HttpError(400, "invalid_mission");
    const m = parsed.data;
    if (m.start_date && m.end_date && m.start_date > m.end_date)
      throw new HttpError(400, "invalid_dates");
    let result;
    if (input.id) {
      const id = uuid(input.id);
      await publicMission(id);
      result = await admin
        .from("missions")
        .update(m)
        .eq("id", id)
        .neq("source", "ai")
        .select("*")
        .single();
    } else
      result = await admin
        .from("missions")
        .insert({ ...m, source: "seed" })
        .select("*")
        .single();
    if (result.error) throw result.error;
    return json(result.data);
  }

  if (input.action === "delete") {
    const id = uuid(input.id);
    const { error } = await admin.rpc("admin_delete_mission", {
      p_mission_id: id,
    });
    if (error?.message === "mission_has_records")
      throw new HttpError(409, "mission_has_records");
    if (error?.message === "mission_not_found")
      throw new HttpError(404, "mission_not_found");
    if (error) throw error;
    return json({ ok: true });
  }

  if (input.action === "photos") {
    const id = uuid(input.id);
    await publicMission(id);
    const { data, error } = await admin
      .from("mission_photos")
      .select("id,storage_path,hint")
      .eq("mission_id", id)
      .order("id");
    if (error) throw error;
    const rows = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed, error } = await admin.storage
          .from("mission-photos")
          .createSignedUrl(row.storage_path, 300);
        if (error) throw error;
        return { ...row, url: signed.signedUrl };
      }),
    );
    return json(rows);
  }

  if (input.action === "upload") {
    const id = uuid(input.id);
    await publicMission(id);
    const hint = z
      .string()
      .max(2000)
      .safeParse(input.hint ?? "");
    if (
      !hint.success ||
      typeof input.image !== "string" ||
      input.image.length > 2796204
    )
      throw new HttpError(400, "invalid_photo");
    let bytes: Uint8Array;
    try {
      bytes = decodeBase64(input.image);
    } catch {
      throw new HttpError(400, "invalid_photo");
    }
    if (!bytes.length || bytes.length > 2097152)
      throw new HttpError(413, "photo_too_large");
    const mime =
      bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "image/jpeg"
        : [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
          ? "image/png"
          : bytes.length >= 12 &&
              String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
              String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
            ? "image/webp"
            : null;
    if (!mime) throw new HttpError(400, "invalid_photo");
    const path = `${id}/${crypto.randomUUID()}.${mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp"}`;
    const { error: uploadError } = await admin.storage
      .from("mission-photos")
      .upload(path, bytes, { contentType: mime });
    if (uploadError) throw uploadError;
    const { data, error } = await admin.rpc("admin_attach_photo", {
      p_mission_id: id,
      p_storage_path: path,
      p_hint: hint.data,
    });
    if (error) {
      const cleanup = await admin.storage.from("mission-photos").remove([path]);
      if (cleanup.error) {
        console.error("admin photo cleanup required", path);
        throw new HttpError(500, "photo_cleanup_required");
      }
      if (error.message === "photo_limit")
        throw new HttpError(409, "photo_limit");
      throw error;
    }
    return json({ id: data });
  }

  if (input.action === "delete_photo") {
    const parsed = z.number().int().positive().safeParse(input.photoId);
    if (!parsed.success) throw new HttpError(400, "invalid_photo");
    const { data: row, error } = await admin
      .from("mission_photos")
      .select("id,mission_id,storage_path,hint")
      .eq("id", parsed.data)
      .maybeSingle();
    if (error) throw error;
    if (!row) return json({ ok: true });
    await publicMission(row.mission_id);
    const storage = await admin.storage
      .from("mission-photos")
      .remove([row.storage_path]);
    if (storage.error) throw storage.error;
    // 파일 삭제가 끝날 때까지 연결을 유지해 미션 삭제와의 경합을 막는다.
    const removed = await admin
      .from("mission_photos")
      .delete()
      .eq("id", row.id);
    if (removed.error) throw new HttpError(500, "photo_cleanup_required");
    return json({ ok: true });
  }
  throw new HttpError(400, "invalid_action");
});
Deno.serve(async (req) => {
  const response = await handleRequest(req);
  response.headers.set("Cache-Control", "no-store");
  return response;
});
