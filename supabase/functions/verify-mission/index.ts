// F4 사진 인증 판정 + F5 출석 + F7 가구 보상 (PRD §6)
// POST { verification_id } → { result, message, streak, rewards: Furniture[], judged_by: 'ai' | 'rule' }
// AI를 쓸 수 없으면 app_config.verify_fallback에 따라 통과('pass') 또는 재시도 안내('retry_later')
// 클라이언트가 사진 업로드 → verifications insert(ai_result null) 후 호출한다.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import { z } from 'npm:zod@4.6.7';

import { generateJson } from '../_shared/ai.ts';
import { admin, requireUserId } from '../_shared/clients.ts';
import { CopyRules, hasBannedWord } from '../_shared/copy.ts';
import { handler, HttpError, json } from '../_shared/http.ts';
import { filterModerationText } from '../_shared/moderation-privacy.ts';

const JudgeSchema = z.object({
  result: z.enum(['pass', 'retry', 'privacy']),
  message: z.string(),
});

const System = `사용자가 일상 미션을 했다는 인증 사진과 한 줄 소감을 보냅니다. 사진을 보고 판정하세요.

판정 기준:
- pass: 사진이 인증 힌트와 관련 있다고 볼 수 있음. 애매하면 pass.
- retry: 빈 화면, 미션과 완전히 무관한 사진, 인터넷 이미지를 캡처한 것으로 보이는 경우에만.
- privacy: 사람 얼굴 정면, 차량 번호판, 주소·전화번호가 알아볼 수 있게 찍힌 경우. (미션은 완료로 인정된다)

message: 사용자에게 보여줄 한 문장, 40자 이하.
- pass/privacy면 해낸 것을 구체적으로 짚어 주는 따뜻한 말.
- retry면 무엇이 잘 안 보이는지 담담하게 알려 주고 다시 찍어볼지 제안.
${CopyRules}`;

const FallbackMessage = {
  pass: '오늘의 미션을 해냈어요',
  retry: '미션이 잘 안 보여요. 다시 찍어볼까요?',
  privacy: '얼굴이나 개인정보가 보여서 비공개로 저장했어요',
} as const;

Deno.serve(
  handler(async (req) => {
    const userId = await requireUserId(req);
    const { verification_id } = (await req.json().catch(() => ({}))) as { verification_id?: string };
    if (!verification_id) throw new HttpError(400, 'verification_id_required');

    const { data: v } = await admin
      .from('verifications')
      .select('id, user_id, photo_path, text, ai_result, user_mission_id, user_missions(id, status, type, missions(title, verify_hint, category, event_id))')
      .eq('id', verification_id)
      .single();
    if (!v || v.user_id !== userId) throw new HttpError(404, 'not_found');
    if (v.ai_result) {
      const { data: saved, error } = await admin.from('verification_responses').select('response').eq('verification_id', v.id).maybeSingle();
      if (error) throw error;
      if (saved) return json(saved.response);
      throw new HttpError(409, 'already_judged');
    }
    const um = v.user_missions;
    if (!um || !['in_progress', 'judging'].includes(um.status)) throw new HttpError(409, 'mission_not_active');

    const { data: file, error: dlError } = await admin.storage.from('verifications').download(v.photo_path);
    if (dlError || !file) throw new HttpError(400, 'photo_missing');
    const image = encodeBase64(new Uint8Array(await file.arrayBuffer()));

    const { error: judgingError } = await admin.from('user_missions').update({ status: 'judging' }).eq('id', um.id).eq('status', 'in_progress');
    if (judgingError) throw judgingError;

    let judged = await generateJson({
      tier: 'main',
      system: System,
      text: JSON.stringify({ mission: um.missions.title, verify_hint: um.missions.verify_hint, user_note: filterModerationText(v.text ?? '').text }),
      image,
      schema: JudgeSchema,
      timeoutMs: 20_000,
    });
    let judgedBy: 'ai' | 'rule' = 'ai';
    if (!judged) {
      const { data: config } = await admin.from('app_config').select('value').eq('key', 'verify_fallback').maybeSingle();
      if (config?.value !== 'pass') {
        // 다시 시도할 수 있도록 진행 중 상태로 되돌린다
        const { error } = await admin.from('user_missions').update({ status: 'in_progress' }).eq('id', um.id).eq('status', 'judging');
        if (error) throw error;
        throw new HttpError(503, 'ai_unavailable');
      }
      // PRD F4 '관대한 판정' 원칙에 따라 통과 처리
      judged = { result: 'pass', message: FallbackMessage.pass };
      judgedBy = 'rule';
    }

    const message =
      judged.message.trim() && !hasBannedWord(judged.message) ? judged.message.trim().slice(0, 60) : FallbackMessage[judged.result];

    const { data: result, error } = await admin.rpc('finish_verification', {
      p_user_id: userId, p_verification_id: v.id, p_result: judged.result, p_message: message, p_judged_by: judgedBy,
    });
    if (error) throw error;
    return json(result);
  }),
);
