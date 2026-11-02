import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { compileSource } from './helpers/load-source.mjs';

const run = await compileSource('../supabase/functions/_shared/ai.ts');

for (const provider of ['gemini', 'anthropic']) {
  test(`${provider}: 기존 텍스트·단일 사진과 다중 형식을 모두 지원한다`, async () => {
    let sent;
    class GoogleGenAI {
      interactions = {
        create: async (request) => {
          sent = request;
          return { output_text: '{"ok":true}' };
        },
      };
    }
    class Anthropic {
      messages = {
        parse: async (request) => {
          sent = request;
          return { parsed_output: { ok: true } };
        },
      };
    }
    const imports = {
      'npm:@google/genai@2.30.0': { GoogleGenAI },
      'npm:@anthropic-ai/sdk@0.135.0': { __esModule: true, default: Anthropic },
      'npm:@anthropic-ai/sdk@0.135.0/helpers/zod': { zodOutputFormat: () => ({}) },
      'npm:zod@4.6.7': { z },
    };
    const exports = run(imports, {
      Deno: { env: { get: (name) => (name === 'AI_PROVIDER' ? provider : 'test-key') } },
    });
    const base = {
      tier: 'light',
      system: 'system',
      text: 'text',
      schema: z.object({ ok: z.boolean() }),
      timeoutMs: 50,
    };
    for (const extra of [
      {},
      { image: 'submission' },
      { image: 'submission', referenceImages: [{ data: 'reference', mimeType: 'image/png' }] },
    ]) {
      assert.deepEqual(await exports.generateJson({ ...base, ...extra }), { ok: true });
      const parts = provider === 'gemini' ? sent.input : sent.messages[0].content;
      const images = parts.filter((p) => p.type === 'image');
      assert.equal(images.length, extra.image ? (extra.referenceImages ? 2 : 1) : 0);
      if (images.length)
        assert.equal(provider === 'gemini' ? images[0].data : images[0].source.data, 'submission');
      if (images.length === 2)
        assert.equal(
          provider === 'gemini' ? images[1].mime_type : images[1].source.media_type,
          'image/png',
        );
    }
  });
}

test('Gemini가 응답하지 않으면 제한 시간에 null을 반환해 대체 경로로 넘긴다', async () => {
  class GoogleGenAI {
    interactions = { create: () => new Promise(() => {}) };
  }
  const imports = {
    'npm:@google/genai@2.30.0': { GoogleGenAI },
    'npm:@anthropic-ai/sdk@0.135.0': {},
    'npm:@anthropic-ai/sdk@0.135.0/helpers/zod': {},
    'npm:zod@4.6.7': { z },
  };
  const exports = run(imports, {
    Deno: {
      env: {
        get: (name) =>
          name === 'AI_PROVIDER' ? 'gemini' : name === 'GEMINI_API_KEY' ? 'test-key' : undefined,
      },
    },
  });
  const result = await exports.generateJson({
    tier: 'light',
    system: 'system',
    text: 'text',
    schema: z.object({ ok: z.boolean() }),
    timeoutMs: 20,
  });
  assert.equal(result, null);
});
