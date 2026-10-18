// F6 익명 댓글 검수 (PRD §6 F6)
// POST { comment_id } → { status: 'approved' | 'rejected' | 'crisis' | 'pending', judged_by: 'ai' | null }
// AI 검수에 실패하면 pending으로 남겨 공개하지 않는다
// 클라이언트가 댓글 insert 직후 호출한다. 공개는 pg_cron(publish_due_comments)이 처리.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.135.0/helpers/zod';
import { z } from 'npm:zod@4.6.7';

import { admin, anthropic, anthropicSetup, Models, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';

const ResultSchema = z.object({ status: z.enum(['approved', 'rejected', 'crisis']) });

const System = `익명 커뮤니티 댓글 하나를 분류하세요.
- crisis: 자해·자살 암시, 극단적인 무망감 표현. (다른 기준보다 우선)
- rejected: 욕설·비하·혐오, 전화번호·SNS 계정·오픈채팅 등 연락처 교환, 광고·외부 URL, 만남 장소·시간 제안.
- approved: 그 외.`;

Deno.serve(
  handler(async (req) => {
    const userId = await requireUserId(req);
    const { comment_id } = (await req.json().catch(() => ({}))) as { comment_id?: string };
    if (!comment_id) throw new HttpError(400, 'comment_id_required');

    const { data: c } = await admin.from('comments').select('id, user_id, body, status').eq('id', comment_id).single();
    if (!c || c.user_id !== userId) throw new HttpError(404, 'not_found');
    if (c.status !== 'pending') return json({ status: c.status, judged_by: null });

    let status: z.infer<typeof ResultSchema>['status'] | null = null;
    try {
      const response = await anthropic.messages.parse(
        {
          model: Models.light,
          max_tokens: 1000,
          output_config: { effort: 'low', format: zodOutputFormat(ResultSchema) },
          system: System,
          messages: [{ role: 'user', content: c.body }],
        },
        { timeout: 10_000 },
      );
      if (response.stop_reason !== 'refusal') status = response.parsed_output?.status ?? null;
    } catch (e) {
      console.error('anthropic', anthropicSetup, e);
    }
    // 검수 실패 시 pending 유지 → 공개되지 않는다
    if (!status) return json({ status: 'pending', judged_by: null });

    await admin.from('comments').update({ status }).eq('id', c.id);
    return json({ status, judged_by: 'ai' });
  }),
);
