import { supabase } from './supabase';

export const MailboxMaxLength = 60;

export type MailboxMessage = {
  id: string;
  body: string;
  request_id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'crisis' | 'published';
};

export type ReceivedMailboxMessage = {
  id: string;
  body: string;
  received_at: string;
  read_at: string | null;
};

export const MailboxStatus: Record<MailboxMessage['status'], string> = {
  pending: '검수를 기다리고 있어요. 아직 전달되지 않았어요.',
  approved: '검수를 마쳤어요. 누군가의 우체통에 도착할 차례예요.',
  published: '누군가의 우체통에 한 줄이 도착했어요.',
  rejected: '이 한 줄은 전달되지 않았어요. 누구나 편하게 읽을 수 있는 말로 다시 적어볼까요?',
  crisis: '이 한 줄은 전달되지 않았어요. 이야기를 들어줄 곳이 있어요.',
};

/** 우체통 함수가 돌려준 오류. code는 함수의 { error } 값 (예: 'daily_limit') */
export class MailboxError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function invokeMailbox<T>(body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('mailbox', { body });
  if (error) {
    // 함수가 HTTP 오류로 답하면 context에 응답이 담긴다. 그 밖의 오류(네트워크)는 그대로 던진다
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      const payload = await context.json().catch(() => ({}));
      throw new MailboxError(context.status, payload?.error ?? 'unknown');
    }
    throw error;
  }
  if (data === null) throw new Error('우체통 응답이 없어요');
  return data;
}

export async function sendMailboxMessage(
  userId: string,
  text: string,
  requestId: string,
): Promise<MailboxMessage> {
  const body = text.trim();
  if (!userId.trim()) throw new Error('로그인이 필요해요');
  if (!body || body.length > MailboxMaxLength) throw new Error('한 줄은 1~60자로 적어 주세요');

  return invokeMailbox({ action: 'send', body, requestId });
}

export const getReceivedMailboxMessages = () =>
  invokeMailbox<ReceivedMailboxMessage[]>({ action: 'inbox' });
export const getSentMailboxMessages = () => invokeMailbox<MailboxMessage[]>({ action: 'sent' });
export const markMailboxMessageRead = (id: string) =>
  invokeMailbox<ReceivedMailboxMessage>({ action: 'read', id });
