import AsyncStorage from '@react-native-async-storage/async-storage';

export const MailboxMaxLength = 60;

export type MailboxMessage = {
  id: string;
  body: string;
  createdAt: string;
  status: 'local';
};

/** shortcut: 현재는 기기 보관만 한다. 백엔드 연결 시 이 함수를 독립 우체통 API로 교체한다. */
export async function sendMailboxMessage(userId: string, text: string): Promise<MailboxMessage> {
  const body = text.trim();
  if (!userId.trim()) throw new Error('로그인이 필요해요');
  if (!body || body.length > MailboxMaxLength) throw new Error('한 줄은 1~60자로 적어 주세요');

  const message: MailboxMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    body,
    createdAt: new Date().toISOString(),
    status: 'local',
  };
  // 건별 키로 보관해 다른 창에서 작성해도 앞선 글을 덮어쓰지 않는다. 자동 발송하지 않는다.
  await AsyncStorage.setItem(`@seoul-challenge/mailbox/${userId}/${message.id}`, JSON.stringify(message));
  return message;
}
