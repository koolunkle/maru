import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const stored = new Map();
let storageError = false;
mock.module('@react-native-async-storage/async-storage', {
  defaultExport: {
    async setItem(key, value) {
      if (storageError) throw new Error('storage unavailable');
      stored.set(key, value);
    },
  },
});
const { MailboxMaxLength, sendMailboxMessage } = await import('../src/lib/mailbox.ts');

beforeEach(() => {
  stored.clear();
  storageError = false;
});

test('공백을 제거하고 실제 전달과 구분되는 로컬 상태로 보관한다', async () => {
  const message = await sendMailboxMessage('user-a', '  오늘도 응원해요  ');
  assert.equal(message.body, '오늘도 응원해요');
  assert.equal(message.status, 'local');
  assert.ok(Number.isFinite(Date.parse(message.createdAt)));
  assert.deepEqual(JSON.parse(stored.get(`@seoul-challenge/mailbox/user-a/${message.id}`)), message);
});

test('빈 입력·공백·60자 초과·계정 없음은 저장하지 않는다', async () => {
  for (const body of ['', ' \n\t ', '가'.repeat(MailboxMaxLength + 1)]) {
    await assert.rejects(sendMailboxMessage('user-a', body));
  }
  await assert.rejects(sendMailboxMessage('', '응원해요'));
  await assert.rejects(sendMailboxMessage('  ', '응원해요'));
  assert.equal(stored.size, 0);
  const message = await sendMailboxMessage('user-a', '가'.repeat(MailboxMaxLength));
  assert.equal(message.body.length, MailboxMaxLength);
});

test('계정·메시지별로 분리해 보관하고 앞선 글을 덮어쓰지 않는다', async () => {
  const first = await sendMailboxMessage('user-a', '첫 한 줄');
  await sendMailboxMessage('user-a', '다음 한 줄');
  await sendMailboxMessage('user-b', '다른 계정의 한 줄');
  assert.equal(stored.size, 3);
  assert.equal([...stored.keys()].filter((key) => key.startsWith('@seoul-challenge/mailbox/user-a/')).length, 2);
  assert.equal([...stored.keys()].filter((key) => key.startsWith('@seoul-challenge/mailbox/user-b/')).length, 1);
  assert.equal(JSON.parse(stored.get(`@seoul-challenge/mailbox/user-a/${first.id}`)).body, '첫 한 줄');
});

test('저장 오류를 호출자에게 알리고 재시도하면 한 번만 보관한다', async () => {
  storageError = true;
  await assert.rejects(sendMailboxMessage('user-a', '다시 보내볼 한 줄'), /storage unavailable/);
  assert.equal(stored.size, 0);
  storageError = false;
  await sendMailboxMessage('user-a', '다시 보내볼 한 줄');
  assert.equal(stored.size, 1);
});
