// 문화행사 동기화 (PRD §6.2 sync-events)
// pg_cron이 매일 05:00 KST에 호출한다. 서울 열린데이터광장 culturalEventInfo 전체를 받아
// 앞으로 30일 안에 진행되는 행사를 events에 upsert → { fetched, upserted }
// 호출 확인: x-sync-secret 헤더 = SYNC_EVENTS_SECRET (cron은 Vault의 값을 보낸다)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { admin } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';
import { kstDate } from '../_shared/kst.ts';
import { type EventRecord, EventPageSize, eventPageUrl, readEventPage, toEvent, uniqueEvents } from '../_shared/seoul-events.ts';

const UpsertChunk = 500;

function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function fetchPage(key: string, start: number) {
  const res = await fetch(eventPageUrl(key, start, start + EventPageSize - 1), { signal: AbortSignal.timeout(20_000) });
  // 오류 메시지에 주소(인증키 포함)를 넣지 않는다
  if (!res.ok) throw new Error(`seoul_api_http_${res.status}`);
  return readEventPage(await res.json());
}

Deno.serve(
  handler(async (req) => {
    const secret = Deno.env.get('SYNC_EVENTS_SECRET');
    if (!secret || !sameSecret(req.headers.get('x-sync-secret') ?? '', secret)) throw new HttpError(401, 'unauthorized');
    const key = Deno.env.get('SEOUL_OPEN_API_KEY');
    if (!key) throw new HttpError(500, 'missing_api_key');

    const today = kstDate();
    const events: EventRecord[] = [];
    let fetched = 0;
    let total = Infinity;
    for (let start = 1; start <= total; start += EventPageSize) {
      const page = await fetchPage(key, start);
      total = page.total;
      fetched += page.rows.length;
      for (const row of page.rows) {
        const event = toEvent(row, today);
        if (event) events.push(event);
      }
      if (page.rows.length === 0) break;
    }

    const rows = uniqueEvents(events);
    for (let i = 0; i < rows.length; i += UpsertChunk) {
      const { error } = await admin.from('events').upsert(rows.slice(i, i + UpsertChunk), { onConflict: 'external_id' });
      if (error) throw error;
    }
    console.log('sync-events', { fetched, upserted: rows.length });
    return json({ fetched, upserted: rows.length });
  }),
);
