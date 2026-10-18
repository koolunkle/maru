import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { HttpError } from './http.ts';

/** 미션 생성·사진 판정 / 댓글 검수(호출이 잦아 경량 모델) */
export const Models = {
  main: 'claude-sonnet-5-5',
  light: 'claude-haiku-5-5',
} as const;

const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

// 키 설정 문제 진단용: 값은 남기지 않고 형태만 기록한다
if (!apiKey) console.error('ANTHROPIC_API_KEY is not set');
else if (!apiKey.startsWith('sk-ant-') || apiKey.trim() !== apiKey) {
  console.error(`ANTHROPIC_API_KEY looks malformed (length ${apiKey.length}, sk-ant- prefix: ${apiKey.startsWith('sk-ant-')}, surrounding whitespace: ${apiKey.trim() !== apiKey})`);
}

// 워크스페이스에 묶이지 않은 키는 요청마다 워크스페이스 ID 헤더가 필요하다
const workspaceId = Deno.env.get('ANTHROPIC_WORKSPACE_ID')?.trim();
if (!workspaceId) {
  const names = Object.keys(Deno.env.toObject()).filter((k) => k.toUpperCase().includes('ANTHROPIC'));
  console.error(`ANTHROPIC_WORKSPACE_ID is not set (ANTHROPIC env names: ${names.join(', ') || 'none'})`);
} else if (!workspaceId.startsWith('wrkspc_')) {
  console.error(`ANTHROPIC_WORKSPACE_ID looks malformed (length ${workspaceId.length}, wrkspc_ prefix: false)`);
}

/** 오류 로그에 함께 남길 설정 상태 (값은 포함하지 않는다) */
export const anthropicSetup = {
  apiKey: apiKey ? (apiKey.startsWith('sk-ant-') ? 'ok' : 'malformed') : 'missing',
  workspaceId: workspaceId ? (workspaceId.startsWith('wrkspc_') ? 'ok' : 'malformed') : 'missing',
};

export const anthropic = new Anthropic({
  apiKey,
  maxRetries: 1,
  ...(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}),
});

/** RLS를 우회하는 서버 전용 클라이언트. 사용자 확인 후에만 쓴다. */
export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

/** Authorization 헤더의 JWT로 호출자 확인 */
export async function requireUserId(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new HttpError(401, 'unauthorized');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'unauthorized');
  return data.user.id;
}
