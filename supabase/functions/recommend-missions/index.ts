// F2. AI 미션 추천 (PRD §6 F2)
// POST { refresh?: boolean } → { daily: Mission[], weekly: Mission | null, source: 'ai' | 'rule' }
// - 당일(KST) 추천이 있으면 그대로 반환, refresh는 하루 1회
// - AI를 쓸 수 없으면 365 서울챌린지 시드에서 규칙대로 골라 저장한다(source: 'rule')
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.135.0/helpers/zod';
import { z } from 'npm:zod@4.6.7';

import { admin, anthropic, anthropicSetup, Models, requireUserId } from '../_shared/clients.ts';
import { CopyRules, hasBannedWord } from '../_shared/copy.ts';
import { pickSeeds } from '../_shared/fallback.ts';
import { handler, HttpError, json } from '../_shared/http.ts';
import { addDays, kstDate } from '../_shared/kst.ts';

const Categories = ['walk', 'food', 'culture', 'growth', 'neighborhood', 'rhythm', 'people'] as const;

const MissionSchema = z.object({
  title: z.string(),
  category: z.enum(Categories),
  difficulty: z.number().int(),
  minutes: z.number().int(),
  verify_hint: z.string(),
  reason: z.string(),
  event_id: z.string().nullable(),
});
const OutputSchema = z.object({
  daily: z.array(MissionSchema),
  weekly: MissionSchema,
});
type AiMission = z.infer<typeof MissionSchema>;

const System = `당신은 서울에 사는 청년에게 하루 5분짜리 작은 일상 미션을 추천합니다.
사용자는 부담 없이 밖으로 나가거나 생활 리듬을 되찾는 작은 성공을 쌓고 싶어 합니다.

난이도 정의:
1 = 5분, 집 반경 100m / 2 = 15분, 동네 / 3 = 30분, 공공장소 방문 / 4 = 1시간 이상, 행사 참여 / 5 = 다른 사람과 함께하는 활동

출력 규칙:
- daily는 정확히 3개, weekly는 1개.
- daily의 minutes는 사용자의 하루 가능 시간 이하, difficulty는 사용자 난이도 이하 또는 +1까지.
- weekly의 difficulty는 사용자 난이도 +1 이상.
- 관심 카테고리를 우선하되, 같은 미션을 반복하지 않고 최근 완료하지 못한 미션과 비슷한 것은 더 쉽게 만든다.
- 365 서울챌린지 과제나 문화행사를 참고해도 되고 새로 만들어도 된다. 문화행사를 쓰면 event_id에 그 id를, 아니면 null.
- title 40자 이하, verify_hint(사진에 담을 대상) 30자 이하, reason(이 사용자에게 추천하는 이유) 50자 이하.
- 사진 한 장으로 인증할 수 있는 미션만 낸다. 다른 사람의 얼굴이 찍혀야 하는 미션은 내지 않는다.
${CopyRules}`;

type MissionRow = { id: string; source: string; title: string; category: string; difficulty: number; minutes: number };

function sanitize(m: AiMission, maxMinutes: number | null): AiMission | null {
  const text = `${m.title} ${m.verify_hint} ${m.reason}`;
  if (hasBannedWord(text) || !m.title.trim() || !m.verify_hint.trim()) return null;
  return {
    ...m,
    title: m.title.trim().slice(0, 40),
    verify_hint: m.verify_hint.trim().slice(0, 30),
    reason: m.reason.trim().slice(0, 50),
    difficulty: Math.min(5, Math.max(1, m.difficulty)),
    minutes: Math.max(1, maxMinutes ? Math.min(m.minutes, maxMinutes) : m.minutes),
  };
}

Deno.serve(
  handler(async (req) => {
    const userId = await requireUserId(req);
    const { refresh = false } = (await req.json().catch(() => ({}))) as { refresh?: boolean };
    const today = kstDate();

    const { data: existing } = await admin
      .from('daily_recommendations')
      .select('daily_mission_ids, weekly_mission_id, refresh_count')
      .eq('user_id', userId)
      .eq('rec_date', today)
      .maybeSingle();

    if (existing && !refresh) {
      const ids = [...existing.daily_mission_ids, existing.weekly_mission_id].filter(Boolean);
      const { data } = await admin.from('missions').select('*').in('id', ids);
      const byId = new Map((data ?? []).map((m: MissionRow) => [m.id, m]));
      const daily = existing.daily_mission_ids.map((id: string) => byId.get(id)).filter(Boolean);
      return json({
        daily,
        weekly: byId.get(existing.weekly_mission_id) ?? null,
        source: daily.some((m: MissionRow) => m.source === 'ai') ? 'ai' : 'rule',
      });
    }
    if (existing && existing.refresh_count >= 1) throw new HttpError(409, 'refresh_limit');

    const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).single();
    if (!profile?.onboarded_at) throw new HttpError(400, 'not_onboarded');

    const [history, seeds, events] = await Promise.all([
      admin
        .from('user_missions')
        .select('type, status, missions(title, category, difficulty)')
        .eq('user_id', userId)
        .gte('started_at', `${addDays(today, -14)}T00:00:00+09:00`)
        .order('started_at', { ascending: false })
        .limit(30),
      admin.from('missions').select('*').eq('source', 'seed'),
      admin
        .from('events')
        .select('id, title, place, start_date, end_date')
        .eq('district', profile.district)
        .gte('end_date', today)
        .lte('start_date', addDays(today, 7))
        .limit(10),
    ]);

    async function save(dailyIds: string[], weeklyId: string | null) {
      const { error } = await admin.from('daily_recommendations').upsert({
        user_id: userId,
        rec_date: today,
        daily_mission_ids: dailyIds,
        weekly_mission_id: weeklyId,
        refresh_count: existing ? existing.refresh_count + 1 : 0,
      });
      if (error) throw error;
    }

    const context = {
      user: {
        categories: profile.categories,
        district: profile.district,
        daily_minutes: profile.daily_minutes,
        difficulty: profile.difficulty,
        preferences: profile.preferences,
      },
      recent_missions: history.data ?? [],
      seoul_challenge: (seeds.data ?? []).map(({ seed_no, title, category, difficulty, minutes }: Record<string, unknown>) => ({
        seed_no,
        title,
        category,
        difficulty,
        minutes,
      })),
      events: events.data ?? [],
      today,
    };

    let parsed: z.infer<typeof OutputSchema> | null = null;
    try {
      const response = await anthropic.messages.parse(
        {
          model: Models.main,
          max_tokens: 4000,
          output_config: { effort: 'low', format: zodOutputFormat(OutputSchema) },
          system: System,
          messages: [{ role: 'user', content: JSON.stringify(context) }],
        },
        { timeout: 15_000 },
      );
      if (response.stop_reason !== 'refusal') parsed = response.parsed_output;
    } catch (e) {
      console.error('anthropic', anthropicSetup, e);
    }

    const daily = (parsed?.daily ?? [])
      .map((m) => sanitize(m, profile.daily_minutes))
      .filter((m): m is AiMission => m !== null)
      .slice(0, 3);
    const weekly = parsed ? sanitize(parsed.weekly, null) : null;

    // AI 결과가 없거나 규칙을 어기면 시드 규칙으로 대체
    if (daily.length < 3 || !weekly) {
      const exclude = existing ? [...existing.daily_mission_ids, existing.weekly_mission_id].filter(Boolean) : [];
      let picked = pickSeeds(seeds.data ?? [], profile, exclude);
      // 직전 추천을 빼고 3개가 안 되면 전체에서 다시 고른다
      if (picked.daily.length < 3) picked = pickSeeds(seeds.data ?? [], profile);
      await save(
        picked.daily.map((m) => m.id),
        picked.weekly?.id ?? null,
      );
      return json({ ...picked, source: 'rule' });
    }

    const eventIds = new Set((events.data ?? []).map((e: { id: string }) => e.id));
    const rows = [...daily, weekly].map((m) => ({
      source: 'ai',
      created_for: userId,
      title: m.title,
      category: m.category,
      difficulty: m.difficulty,
      minutes: m.minutes,
      verify_hint: m.verify_hint,
      reason: m.reason,
      event_id: m.event_id && eventIds.has(m.event_id) ? m.event_id : null,
    }));
    const { data: inserted, error } = await admin.from('missions').insert(rows).select('*');
    if (error) throw error;

    await save(
      inserted.slice(0, 3).map((m: MissionRow) => m.id),
      inserted[3].id,
    );
    return json({ daily: inserted.slice(0, 3), weekly: inserted[3], source: 'ai' });
  }),
);
