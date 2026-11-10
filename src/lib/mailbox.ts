import type { Enums } from '@/types/database';

import { invoke } from './functions';

export const MailboxMaxLength = 60;

export type MailboxMessage = {
  id: string;
  body: string;
  request_id: string;
  created_at: string;
  status: Enums<'comment_status'>;
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

/** 오류는 다른 함수와 같은 FunctionError(code 예: 'daily_limit')다. 빈 응답은 빈 목록으로 숨기지 않는다 */
async function invokeMailbox<T>(body: object): Promise<T> {
  const data = await invoke<T | null>('mailbox', body);
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
/** 마음 보관함 탭 점. 한 줄을 배정하지 않는다 */
export const hasWaitingMailbox = async () =>
  (await invokeMailbox<{ waiting: boolean }>({ action: 'waiting' })).waiting;
export const getSentMailboxMessages = () => invokeMailbox<MailboxMessage[]>({ action: 'sent' });
export const markMailboxMessageRead = (id: string) =>
  invokeMailbox<ReceivedMailboxMessage>({ action: 'read', id });
