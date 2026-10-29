import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

type Mission = Tables<'missions'>;
type Furniture = Tables<'furniture'>;

/** Edge Function 오류. code는 함수가 돌려준 { error } 값 (예: 'ai_unavailable', 'refresh_limit') */
export class FunctionError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function invoke<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => ({}));
      throw new FunctionError(error.context.status, payload.error ?? 'unknown');
    }
    throw new FunctionError(0, 'network');
  }
  return data as T;
}

/** 'ai' = 생성형 AI 결과, 'rule' = AI를 쓸 수 없을 때의 규칙 기반 대체 */
export type JudgedBy = 'ai' | 'rule';

export type Recommendation = { daily: Mission[]; weekly: Mission | null; source: JudgedBy };
export type JudgeResult = {
  result: 'pass' | 'retry' | 'privacy';
  message: string;
  streak: number | null;
  rewards: Furniture[];
  judged_by: JudgedBy;
};
/** F13 주간 편지와 그 주의 기록 */
export type WeeklyLetter = {
  body: string;
  source: 'ai' | 'rule';
  notes: { note_date: string; mood: number; text: string }[];
  missions: { completed_at: string; missions: { title: string } | null }[];
};
type ModerationResult = {
  status: 'approved' | 'rejected' | 'crisis' | 'pending' | 'published';
  judged_by: JudgedBy | null;
};

export const Functions = {
  /** F2 오늘의 추천. refresh = '다른 미션 보기' (하루 1회) */
  recommendMissions: (refresh = false, requestId?: string) => invoke<Recommendation>('recommend-missions', { refresh, requestId }),
  /** F4 사진 판정 + 완료·출석·보상 처리 */
  verifyMission: (verificationId: string) => invoke<JudgeResult>('verify-mission', { verification_id: verificationId }),
  /** F6 댓글 검수 */
  moderateComment: (commentId: string) =>
    invoke<ModerationResult>('moderate-comment', {
      comment_id: commentId,
    }),
  moderateRelay: (relayId: string) => invoke<ModerationResult>('moderate-comment', { relay_id: relayId }),
  /** F3 미션 시작 (한도 초과 시 code 'mission_limit') */
  startMission: (missionId: string, type: Enums<'mission_type'>, dueAt: string) =>
    invoke<{ id: string } | null>('start-mission', { missionId, type, dueAt }),
  /** F7 가구 놓기·비우기 */
  placeFurniture: (slot: Enums<'room_slot'>, furnitureId: string | null) => invoke<{ ok: boolean }>('place-furniture', { slot, furnitureId }),
  /** F6 댓글 남기기 (요청 ID로 중복 방지) */
  submitComment: (verificationId: string, body: string, requestId: string) =>
    invoke<Tables<'comments'> | null>('submit-comment', { verificationId, body, requestId }),
  /** F13 편지가 저장된 주차 목록 */
  listLetterWeeks: () => invoke<string[] | null>('write-weekly-letter', { action: 'list' }),
  /** F13 주간 편지 만들기·불러오기 */
  writeWeeklyLetter: (week: string) => invoke<WeeklyLetter | null>('write-weekly-letter', { week }),
};
