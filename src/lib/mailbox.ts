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
  rejected: '이 한 줄은 전달되지 않았어요. 연락처나 만남 제안 없이 적어볼까요?',
  crisis: '이 한 줄은 전달되지 않았어요. 이야기를 들어줄 곳이 있어요.',
};

export function createMailboxRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12).padEnd(10, '0')}`;
}

async function invokeMailbox<T>(body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('mailbox', { body });
  if (error) throw error;
  if (data === null) throw new Error('우체통 응답이 없어요');
  return data;
}

export async function sendMailboxMessage(userId: string, text: string, requestId: string): Promise<MailboxMessage> {
  const body = text.trim();
  if (!userId.trim()) throw new Error('로그인이 필요해요');
  if (!body || body.length > MailboxMaxLength) throw new Error('한 줄은 1~60자로 적어 주세요');

  return invokeMailbox({ action: 'send', body, requestId });
}

export const getReceivedMailboxMessages = () => invokeMailbox<ReceivedMailboxMessage[]>({ action: 'inbox' });
export const getSentMailboxMessages = () => invokeMailbox<MailboxMessage[]>({ action: 'sent' });
export const markMailboxMessageRead = (id: string) => invokeMailbox<ReceivedMailboxMessage>({ action: 'read', id });
