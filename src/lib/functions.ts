import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

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

export type Recommendation = { daily: Mission[]; weekly: Mission | null };
export type JudgeResult = {
  result: 'pass' | 'retry' | 'privacy';
  message: string;
  streak: number | null;
  rewards: Furniture[];
};

export const Functions = {
  /** F2 오늘의 추천. refresh = '다른 미션 보기' (하루 1회) */
  recommendMissions: (refresh = false) => invoke<Recommendation>('recommend-missions', { refresh }),
  /** F4 사진 판정 + 완료·출석·보상 처리 */
  verifyMission: (verificationId: string) => invoke<JudgeResult>('verify-mission', { verification_id: verificationId }),
  /** F6 댓글 검수 */
  moderateComment: (commentId: string) =>
    invoke<{ status: 'approved' | 'rejected' | 'crisis' | 'pending' }>('moderate-comment', { comment_id: commentId }),
};
