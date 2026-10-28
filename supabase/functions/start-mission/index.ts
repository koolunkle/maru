import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'npm:zod@4.6.7';
import { admin, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';

const request = z.object({ missionId: z.uuid(), type: z.enum(['daily', 'weekly']), dueAt: z.iso.datetime() });
Deno.serve(handler(async (req) => {
  const userId = await requireUserId(req);
  const input = request.safeParse(await req.json().catch(() => null));
  if (!input.success) throw new HttpError(400, 'invalid_mission');
  const { data, error } = await admin.rpc('start_mission', {
    p_user_id: userId, p_mission_id: input.data.missionId, p_type: input.data.type, p_due_at: input.data.dueAt,
  });
  if (error?.message === 'mission_limit') throw new HttpError(409, 'mission_limit');
  if (error) throw error;
  return json({ id: data });
}));
