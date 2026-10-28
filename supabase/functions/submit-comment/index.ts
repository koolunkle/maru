import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'npm:zod@4.6.7';
import { admin, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';

const request = z.object({ verificationId: z.uuid(), body: z.string().trim().min(1).max(200), requestId: z.string().min(1).max(100) });
Deno.serve(handler(async (req) => {
  const userId = await requireUserId(req);
  const input = request.safeParse(await req.json().catch(() => null));
  if (!input.success) throw new HttpError(400, 'invalid_comment');
  const { data, error } = await admin.rpc('submit_comment', {
    p_user_id: userId, p_verification_id: input.data.verificationId, p_body: input.data.body, p_request_id: input.data.requestId,
  });
  if (error?.message === 'request_body_changed') throw new HttpError(409, 'request_body_changed');
  if (error) throw error;
  return json(data);
}));
