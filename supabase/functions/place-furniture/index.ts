import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'npm:zod@4.6.7';

import { admin, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';

const request = z.object({
  slot: z.enum(['floor-1', 'floor-2', 'wall-1', 'wall-2', 'window', 'desk']),
  furnitureId: z.string().nullable(),
});

Deno.serve(handler(async (req) => {
  const userId = await requireUserId(req);
  const input = request.safeParse(await req.json().catch(() => null));
  if (!input.success) throw new HttpError(400, 'invalid_placement');
  const { error } = await admin.rpc('place_furniture', {
    p_user_id: userId, p_slot: input.data.slot, p_furniture_id: input.data.furnitureId,
  });
  if (error) throw error;
  return json({ ok: true });
}));
