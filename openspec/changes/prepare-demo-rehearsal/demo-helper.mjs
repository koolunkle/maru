// 보조 계정으로 우체통 글 1개와 릴레이 한 줄 1개를 앱과 같은 경로로 보낸다 (tasks 1.2, 1.3).
// 익명 계정 생성 → 온보딩 → 산책 미션 시작 → 사진 인증(AI 판정) → 릴레이 한 줄 → 우체통 글.
// 검수도 실제 서버 함수가 한다. 앱의 publishable 키만 쓰고 서버 키는 쓰지 않는다.
//
// 실행 (저장소 루트에서): node --env-file=.env.local openspec/changes/prepare-demo-rehearsal/demo-helper.mjs <사진.jpg>
// 사진은 "노란색이 보이는 풍경이나 사물"이어야 인증이 통과한다. 출력된 사용자 id는 정리(tasks 3.3) 때 쓴다.
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const RelayBody = '노란 거 하나 찾으니 늘 걷던 길이 조금 달라 보였어요';
const MailboxBody = '오늘 하나 해낸 것만으로도 충분해요. 내일도 천천히 해 봐요';
const SeedNo = 4; // 길에서 노란색 찾아 찍기 (산책). 민수 데모 계정과 같은 카테고리

const photoPath = process.argv[2];
if (!photoPath) throw new Error('사진 경로를 넘겨 주세요');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('.env.local의 EXPO_PUBLIC_SUPABASE_* 값이 필요합니다');

const supabase = createClient(url, key, { auth: { persistSession: false } });
const must = ({ data, error }, step) => {
  if (error) throw new Error(`${step}: ${error.message ?? error}`);
  return data;
};
async function invoke(name, body) {
  return must(await supabase.functions.invoke(name, { body }), name);
}
const kstEndOfDay = () => {
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  return new Date(`${today}T23:59:59.999+09:00`).toISOString();
};

const { user } = must(await supabase.auth.signInAnonymously(), '익명 계정');
console.log('보조 계정:', user.id);

must(
  await supabase
    .from('profiles')
    .update({
      categories: ['walk', 'culture'],
      district: '종로구',
      daily_minutes: 5,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', user.id),
  '온보딩',
);

const mission = must(
  await supabase.from('missions').select('id, title').eq('source', 'seed').eq('seed_no', SeedNo).single(),
  '미션 조회',
);
const started = await invoke('start-mission', {
  missionId: mission.id,
  type: 'daily',
  dueAt: kstEndOfDay(),
});
console.log('미션 시작:', mission.title);

const path = `${user.id}/${Date.now()}-helper.jpg`;
must(
  await supabase.storage
    .from('verifications')
    .upload(path, await readFile(photoPath), { contentType: 'image/jpeg' }),
  '사진 올리기',
);
const verification = must(
  await supabase
    .from('verifications')
    .insert({ user_mission_id: started.id, photo_path: path, text: '', is_public: false })
    .select('id')
    .single(),
  '인증 저장',
);
const judged = await invoke('verify-mission', { verification_id: verification.id });
console.log('인증 판정:', judged.result, judged.judged_by, judged.message);
if (judged.result === 'retry') throw new Error('인증이 통과하지 않았습니다. 노란색이 잘 보이는 사진으로 다시 실행해 주세요');

const relay = must(
  await supabase.from('relay_messages').insert({ mission_id: mission.id, body: RelayBody }).select('id').single(),
  '릴레이 저장',
);
console.log('릴레이 검수:', (await invoke('moderate-comment', { relay_id: relay.id })).status);

const mail = await invoke('mailbox', {
  action: 'send',
  body: MailboxBody,
  requestId: `demo-helper-${Date.now()}`,
});
console.log('우체통 검수:', mail.status);
console.log('완료. 정리할 때 이 사용자 id를 지웁니다:', user.id);
