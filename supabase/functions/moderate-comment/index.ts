// F6 익명 댓글 검수 (PRD §6 F6)
// POST { comment_id } 또는 { relay_id } → { status, judged_by }
// AI 검수에 실패하면 pending으로 남겨 공개하지 않는다
// 클라이언트가 댓글 insert 직후 호출한다. 공개는 pg_cron(publish_due_comments)이 처리.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'npm:zod@4.6.7';

import { generateJson } from '../_shared/ai.ts';
import { admin, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';
import { filterModerationText } from '../_shared/moderation-privacy.ts';

const ResultSchema = z.object({ status: z.enum(['approved', 'rejected', 'crisis']) });
const RequestSchema = z.object({ comment_id: z.uuid().optional(), relay_id: z.uuid().optional() });

const System = `익명 커뮤니티 댓글 하나를 분류하세요.
- crisis: 자해·자살 암시, 극단적인 무망감 표현. (다른 기준보다 우선)
- rejected: 욕설·비하·혐오, 전화번호·SNS 계정·오픈채팅 등 연락처 교환, 광고·외부 URL, 만남 장소·시간 제안.
- approved: 그 외.`;

Deno.serve(
  handler(async (req) => {
    const userId = await requireUserId(req);
    const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, 'invalid_request');
    const { comment_id: commentId, relay_id: relayId } = parsed.data;
    if (Boolean(commentId) === Boolean(relayId)) throw new HttpError(400, 'one_id_required');
    const table = relayId ? 'relay_messages' : 'comments';

    const { data: c, error: readError } = await admin
      .from(table)
      .select('id, user_id, body, status')
      .eq('id', relayId ?? commentId)
      .maybeSingle();
    if (readError) throw readError;
    if (!c || c.user_id !== userId) throw new HttpError(404, 'not_found');
    if (c.status !== 'pending') return json({ status: c.status, judged_by: null });

    const filtered = filterModerationText(c.body);
    const result = await generateJson({
      tier: 'light',
      system: System,
      text: filtered.text,
      schema: ResultSchema,
      timeoutMs: 10_000,
    });
    const status = result?.status === 'approved' && filtered.hasContact ? 'rejected' : result?.status ?? null;
    // 검수 실패 시 pending 유지 → 공개되지 않는다
    if (!status) return json({ status: 'pending', judged_by: null });

    const { data: updated, error: updateError } = await admin
      .from(table)
      .update({ status })
      .eq('id', c.id)
      .eq('status', 'pending')
      .select('status')
      .maybeSingle();
    if (updateError) throw updateError;
    if (updated) return json({ status: updated.status, judged_by: 'ai' });
    const { data: current, error: currentError } = await admin.from(table).select('status').eq('id', c.id).single();
    if (currentError) throw currentError;
    return json({ status: current.status, judged_by: null });
  }),
);
