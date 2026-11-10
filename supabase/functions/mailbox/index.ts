import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { z } from 'npm:zod@4.6.7';

import { admin, requireUserId } from '../_shared/clients.ts';
import { handler, HttpError, json } from '../_shared/http.ts';
import { moderate } from '../_shared/moderation.ts';

const RequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inbox') }),
  z.object({ action: z.literal('waiting') }),
  z.object({ action: z.literal('sent') }),
  z.object({ action: z.literal('read'), id: z.uuid() }),
  z.object({
    action: z.literal('send'),
    requestId: z
      .string()
      .min(16)
      .max(80)
      .regex(/^[a-zA-Z0-9-]+$/),
    body: z.string().trim().min(1).max(60),
  }),
]);

const SentColumns = 'id, request_id, body, status, created_at';
const InboxColumns = 'id, body, received_at, read_at';

Deno.serve(
  handler(async (req) => {
    if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
    const userId = await requireUserId(req);
    const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, 'invalid_request');
    const input = parsed.data;

    if (input.action === 'inbox') {
      const { error: claimError } = await admin.rpc('receive_mailbox_message', {
        recipient: userId,
      });
      if (claimError) throw claimError;
      const { data, error } = await admin
        .from('mailbox_messages')
        .select(InboxColumns)
        .eq('recipient_id', userId)
        .eq('status', 'published')
        .order('received_at', { ascending: false });
      if (error) throw error;
      return json(data);
    }

    // 탭 점: 배정하지 않고 읽을 한 줄이 있거나 열면 받을 수 있는지만 본다
    if (input.action === 'waiting') {
      const { data, error } = await admin.rpc('mailbox_waiting', { recipient: userId });
      if (error) throw error;
      return json({ waiting: data === true });
    }

    if (input.action === 'sent') {
      const { data, error } = await admin
        .from('mailbox_messages')
        .select(SentColumns)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json(data);
    }

    if (input.action === 'read') {
      const { error } = await admin
        .from('mailbox_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('recipient_id', userId)
        .eq('status', 'published')
        .is('read_at', null);
      if (error) throw error;
      const { data, error: readError } = await admin
        .from('mailbox_messages')
        .select(InboxColumns)
        .eq('id', input.id)
        .eq('recipient_id', userId)
        .eq('status', 'published')
        .maybeSingle();
      if (readError) throw readError;
      if (!data) throw new HttpError(404, 'not_found');
      return json(data);
    }

    // 하루(KST) 한 줄만 보낼 수 있다. 같은 요청의 재시도와 거절·위기 글은 세지 않는다.
    const kstToday = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: today, error: todayError } = await admin
      .from('mailbox_messages')
      .select('id')
      .eq('user_id', userId)
      .neq('request_id', input.requestId)
      .in('status', ['pending', 'approved', 'published'])
      .gte('created_at', `${kstToday}T00:00:00+09:00`)
      .limit(1);
    if (todayError) throw todayError;
    if (today && today.length > 0) throw new HttpError(409, 'daily_limit');

    // 같은 요청은 한 행만 보관한다. 응답 유실 후 재시도해도 다시 발송하지 않는다.
    const { error: insertError } = await admin.from('mailbox_messages').upsert(
      {
        user_id: userId,
        request_id: input.requestId,
        body: input.body,
      },
      { onConflict: 'user_id,request_id', ignoreDuplicates: true },
    );
    if (insertError) throw insertError;
    const { data: message, error } = await admin
      .from('mailbox_messages')
      .select(SentColumns)
      .eq('user_id', userId)
      .eq('request_id', input.requestId)
      .single();
    if (error) throw error;
    if (message.body !== input.body) throw new HttpError(409, 'request_body_changed');
    if (message.status !== 'pending') return json(message);

    const result = await moderate(message.body);
    if (!result) return json(message);
    const { data: moderated, error: updateError } = await admin
      .from('mailbox_messages')
      .update({ status: result.status })
      .eq('id', message.id)
      .eq('status', 'pending')
      .select(SentColumns)
      .maybeSingle();
    // 저장된 글을 재전송하지 않도록 검수 저장 오류도 대기 상태로 알린다.
    if (updateError) {
      console.error('mailbox moderation update', updateError);
      return json(message);
    }
    if (moderated) return json(moderated);
    const { data: current, error: currentError } = await admin
      .from('mailbox_messages')
      .select(SentColumns)
      .eq('id', message.id)
      .single();
    if (currentError) throw currentError;
    return json(current);
  }),
);
