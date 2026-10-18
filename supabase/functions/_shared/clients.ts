import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { HttpError } from './http.ts';

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
