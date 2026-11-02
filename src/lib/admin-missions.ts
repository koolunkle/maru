import type { Tables } from "@/types/database";

export type AdminMission = Tables<"missions">;
export type AdminPhoto = {
  id: number;
  storage_path: string;
  hint: string;
  url: string;
};
export type AdminMissionInput = Pick<
  AdminMission,
  | "title"
  | "category"
  | "difficulty"
  | "minutes"
  | "verify_hint"
  | "reason"
  | "start_date"
  | "end_date"
>;
export type AdminMissionPage = {
  items: AdminMission[];
  total: number;
  page: number;
};

const Messages: Record<string, string> = {
  admin_unauthorized: "관리자 비밀번호를 확인해 주세요.",
  admin_rate_limit:
    "입력이 반복되어 잠시 쉬고 있어요. 10분 뒤 다시 시도해 주세요.",
  admin_not_configured: "관리 기능을 준비 중이에요. 운영자에게 확인해 주세요.",
  invalid_mission: "제목·분류·난이도·시간·인증 힌트를 확인해 주세요.",
  invalid_dates: "시작일과 종료일을 확인해 주세요.",
  invalid_photo: "JPEG·PNG·WebP 사진을 선택해 주세요.",
  photo_too_large: "사진은 한 장당 2 MiB 이하로 선택해 주세요.",
  photo_limit: "기준 사진은 미션당 최대 4장이에요.",
  mission_has_records: "사진이나 사용자 활동이 연결된 미션은 삭제할 수 없어요.",
  mission_not_found: "미션을 찾지 못했어요. 목록을 다시 불러와 주세요.",
  photo_cleanup_required:
    "사진 정리가 끝나지 않았어요. 목록을 다시 불러와 삭제를 다시 시도해 주세요.",
};

/** 비밀번호는 호출 인자로만 전달하고 저장소나 URL에는 남기지 않는다. */
export async function adminRequest<T>(
  password: string,
  input: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-missions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      },
      body: JSON.stringify({ ...input, password }),
      signal: AbortSignal.timeout(45000),
    },
  );
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      Messages[body?.error] ?? "요청을 처리하지 못했어요. 다시 시도해 주세요.",
    );
  if (body === null)
    throw new Error("응답을 확인하지 못했어요. 다시 시도해 주세요.");
  return body as T;
}
