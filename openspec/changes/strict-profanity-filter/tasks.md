# Tasks

## 1. 욕설 규칙 모듈

- [x] 1.1 `supabase/functions/_shared/moderation-profanity.ts`에 정규화(압축본·자모 문자열), 완성형·초성 사전, 허용 목록 제거 후 재검사를 구현한 `hasProfanity`를 만들고, 새 테스트(`tests/moderation-profanity.test.mjs`)에서 그대로 쓴 욕설·초성(`ㅅㅂ`)·끼우기(`시1발`, `씨 발`, `시.발`)·전각 변형이 걸리는지 확인한다
- [x] 1.2 같은 테스트에 오탐 표(`시발점`, `자살골`, `수박씨 발라`, "사부님", 기존 `tests/relay.test.mjs`의 일상 문장)를 넣고 걸리지 않는지, "시발점 시발"은 걸리는지 확인한다
- [x] 1.3 `hasCrisisHint`를 구현하고 "죽고 싶다", "자해", "사라지고 싶어"는 참, "자살골"은 거짓인지 테스트로 확인한다

## 2. 공통 검수 흐름

- [x] 2.1 `_shared/moderation.ts`의 `moderate()`를 design.md 4절 흐름으로 바꾸고 반환을 `{ status, judgedBy } | null`로 바꾼다. `tests/relay.test.mjs`에서 욕설 글은 AI 호출 0회로 `rejected`, 욕설+위기 힌트 글은 AI를 호출하고 AI `crisis`면 `crisis`, AI 실패면 `pending`인지 확인한다
- [x] 2.2 `ModerationSystem`의 rejected 기준을 spec 분류(조롱·비꼼·인신공격·비하, 애매하면 거절)로 넓히고, 테스트에서 시스템 문구에 해당 기준이 들어 있는지 확인한다
- [x] 2.3 `moderate-comment/index.ts`가 `judged_by`에 `judgedBy`를 쓰도록 바꾸고, AI 실패 중 욕설 댓글 요청이 `{ status: 'rejected', judged_by: 'rule' }`, 욕설 없는 글이 `{ status: 'pending' }`인지 `tests/relay.test.mjs`로 확인한다
- [x] 2.4 `mailbox/index.ts`가 새 반환 형태의 `status`를 쓰도록 바꾸고, AI 실패 중 욕설 한 줄이 `rejected`로 저장되는지 `tests/mailbox.test.mjs`로 확인한다
- [x] 2.5 `docs/ARCHITECTURE.md`의 `_shared/` 설명에 `moderation-profanity.ts`를 추가하고 F6 흐름에 규칙 거절 단계를 적는다
- [x] 2.6 `src/lib/mailbox.ts`의 우체통 거절 문구를 mailbox spec 문구로 바꾸고, `rg "연락처나 만남 제안" src`에 남은 곳이 없는지 확인한다

## 3. 검증

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run spec:validate`가 통과한다
- [ ] 3.2 미리보기 배포 URL에서 spec Scenario를 확인한다: 욕설·초성·끼우기 댓글 거절과 "이 댓글은 공개되지 않았어요", `시발점` 문장 비거절, 비꼼 댓글 거절, 욕설+"죽고 싶다" 글의 도움 안내 카드, 릴레이·우체통 욕설 거절

## Workflow follow-up

- 사람이 요청하면 최신 `main`에서 `moderate-comment`, `mailbox`만 재배포한다(`CONTRIBUTING.md` 3.4).
- 리뷰를 마친 뒤 change를 archive한다.
