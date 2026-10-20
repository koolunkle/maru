// 생성형 AI 호출 단일 진입점. 제공자(Gemini / Anthropic)를 바꿔도 함수 코드는 그대로 둔다.
// 선택: AI_PROVIDER('gemini' | 'anthropic') → 없으면 GEMINI_API_KEY가 있을 때 Gemini, 아니면 Anthropic
import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.135.0/helpers/zod';
import { GoogleGenAI } from 'npm:@google/genai@2.30.0';
import { z } from 'npm:zod@4.6.7';

type Tier = 'main' | 'light';

/** main: 미션 생성·사진 판정 / light: 댓글 검수(호출이 잦아 경량 모델) */
const Models = {
  gemini: { main: 'gemini-3.8-flash', light: 'gemini-3.5-flash-lite' },
  anthropic: { main: 'claude-sonnet-5-5', light: 'claude-haiku-5-5' },
} as const;

/** Gemini 기본 추론 수준은 응답이 길어져 시간 초과가 잦다. 짧은 판단 작업이라 낮게 둔다. */
const GeminiThinking = { main: 'low', light: 'minimal' } as const;

const geminiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')?.trim();
const anthropicWorkspace = Deno.env.get('ANTHROPIC_WORKSPACE_ID')?.trim();

export const provider: 'gemini' | 'anthropic' =
  Deno.env.get('AI_PROVIDER') === 'anthropic' || (Deno.env.get('AI_PROVIDER') !== 'gemini' && !geminiKey)
    ? 'anthropic'
    : 'gemini';

/** 오류 로그에 함께 남길 설정 상태 (값은 포함하지 않는다) */
const setup = {
  provider,
  geminiKey: geminiKey ? 'set' : 'missing',
  anthropicKey: anthropicKey ? (anthropicKey.startsWith('sk-ant-') ? 'ok' : 'malformed') : 'missing',
  anthropicWorkspace: anthropicWorkspace ? 'set' : 'missing',
};

const gemini = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;
const anthropic = anthropicKey
  ? new Anthropic({
      apiKey: anthropicKey,
      maxRetries: 1,
      // 워크스페이스에 묶이지 않은 키는 요청마다 워크스페이스 ID 헤더가 필요하다
      ...(anthropicWorkspace ? { defaultHeaders: { 'anthropic-workspace-id': anthropicWorkspace } } : {}),
    })
  : null;

type Request<S extends z.ZodType> = {
  tier: Tier;
  system: string;
  text: string;
  /** base64 JPEG */
  image?: string;
  schema: S;
  timeoutMs: number;
};

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms)),
  ]);
}

/** main 모델이 이 시간 안에 답하지 않으면 경량 모델을 함께 호출해 먼저 온 결과를 쓴다 (혼잡 시 main이 응답 없이 멈춘다) */
const GeminiHedgeMs = 6_000;

async function viaGemini<S extends z.ZodType>(req: Request<S>): Promise<unknown> {
  if (req.tier === 'light') return geminiOnce(req, Models.gemini.light, GeminiThinking.light, req.timeoutMs);
  const startedAt = Date.now();
  let done = false;
  const primary = geminiOnce(req, Models.gemini.main, GeminiThinking.main, req.timeoutMs);
  const hedge = new Promise<unknown>((resolve, reject) => {
    let launched = false;
    const launch = () => {
      if (launched) return;
      launched = true;
      if (done) return reject(new Error('primary answered'));
      const left = req.timeoutMs - (Date.now() - startedAt);
      geminiOnce(req, Models.gemini.light, GeminiThinking.light, left).then(resolve, reject);
    };
    const timer = setTimeout(launch, GeminiHedgeMs);
    // main이 빨리 실패하면 기다리지 않고 바로 경량 모델로
    primary.then(
      () => {
        clearTimeout(timer);
        launched = true;
        reject(new Error('primary answered'));
      },
      () => {
        clearTimeout(timer);
        launch();
      },
    );
  });
  try {
    return await Promise.any([primary, hedge]);
  } catch (e) {
    throw e instanceof AggregateError ? e.errors[0] : e;
  } finally {
    done = true;
  }
}

async function geminiOnce<S extends z.ZodType>(
  req: Request<S>,
  model: string,
  thinking: 'low' | 'minimal',
  timeoutMs: number,
): Promise<unknown> {
  if (!gemini) throw new Error('GEMINI_API_KEY is not set');
  const { $schema: _, ...schema } = z.toJSONSchema(req.schema) as Record<string, unknown>;
  const interaction = await withTimeout(
    gemini.interactions.create({
      model,
      system_instruction: req.system,
      input: [
        { type: 'text', text: req.text },
        ...(req.image ? [{ type: 'image' as const, data: req.image, mime_type: 'image/jpeg' }] : []),
      ],
      response_format: { type: 'text', mime_type: 'application/json', schema },
      generation_config: { thinking_level: thinking },
      // 요청·응답을 Google 쪽에 보관하지 않는다
      store: false,
    }, {
      // SDK 기본값은 429·5xx를 지수 백오프로 재시도해 시간 제한 안에 원인이 드러나지 않는다
      timeout_ms: timeoutMs,
      retries: { strategy: 'none' },
    }),
    timeoutMs,
  );
  return JSON.parse(interaction.output_text ?? '');
}

async function viaAnthropic<S extends z.ZodType>(req: Request<S>): Promise<unknown> {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY is not set');
  const response = await anthropic.messages.parse(
    {
      model: Models.anthropic[req.tier],
      max_tokens: 4000,
      output_config: { effort: 'low', format: zodOutputFormat(req.schema) },
      system: req.system,
      messages: [
        {
          role: 'user',
          content: [
            ...(req.image ? [{ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: req.image } }] : []),
            { type: 'text' as const, text: req.text },
          ],
        },
      ],
    },
    { timeout: req.timeoutMs },
  );
  if (response.stop_reason === 'refusal') return null;
  return response.parsed_output;
}

/**
 * 스키마에 맞는 JSON을 생성한다. 키·크레딧·장애·시간 초과·형식 오류면 null
 * (호출하는 함수가 규칙 기반 대체로 넘어간다).
 */
export async function generateJson<S extends z.ZodType>(req: Request<S>): Promise<z.infer<S> | null> {
  try {
    const raw = provider === 'gemini' ? await viaGemini(req) : await viaAnthropic(req);
    const parsed = req.schema.safeParse(raw);
    if (!parsed.success) {
      console.error('ai invalid output', setup, parsed.error.issues.slice(0, 3));
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.error('ai error', setup, e);
    return null;
  }
}
