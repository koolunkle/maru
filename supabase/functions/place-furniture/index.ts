// F7 내 방 가구 놓기·옮기기 (spec room-rewards)
// POST { slot, furnitureId }           → 그 자리에 놓기(null이면 비우기). 자리에 있던 가구는 방에서 빠진다
// POST { slot, furnitureId, move: true } → 옮기기. 자리에 다른 가구가 있으면 서로 자리를 바꾼다(한 트랜잭션)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'npm:zod@4.6.7';

import { admin, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';

const request = z.object({
  slot: z.enum(['floor-1', 'floor-2', 'wall-1', 'wall-2', 'window', 'desk']),
  furnitureId: z.string().nullable(),
  move: z.boolean().optional(),
});

Deno.serve(handler(async (req) => {
  const userId = await requireUserId(req);
  const input = request.safeParse(await req.json().catch(() => null));
  if (!input.success) throw new HttpError(400, 'invalid_placement');
  const { slot, furnitureId, move } = input.data;
  if (move && !furnitureId) throw new HttpError(400, 'invalid_placement');
  const { error } = move
    ? await admin.rpc('move_furniture', { p_user_id: userId, p_furniture_id: furnitureId!, p_slot: slot })
    : await admin.rpc('place_furniture', { p_user_id: userId, p_slot: slot, p_furniture_id: furnitureId });
  if (error) throw error;
  return json({ ok: true });
}));
