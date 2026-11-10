# Tasks

## 1. DB

- [x] 1.1 새 마이그레이션에 `mailbox_waiting(recipient uuid) returns boolean`(service_role 전용)을 만든다
- [x] 1.2 `supabase/tests/mailbox.sql`에 점 조건(받을 글 있음·안 읽음·오늘 받음·본인 글만·배정하지 않음·클라이언트 실행 금지)을 더하고 로컬 DB에서 돌린다

## 2. 함수

- [x] 2.1 `mailbox`에 `waiting` 동작을 더하고 `tests/mailbox.test.mjs`에 JWT 사용자로만 부르는지 시험을 더한다

## 3. 앱

- [x] 3.1 `src/lib/mailbox.ts`에 `hasWaitingMailbox()`
- [x] 3.2 하단 탭 레이아웃에서 탭 포커스 변경·앱 복귀 때 확인하고, 마음 보관함 탭이 아닐 때만 점과 접근성 이름을 보인다
- [x] 3.3 DESIGN.md tab-bar에 점을 적는다

## 4. 검증

- [x] 4.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:sql`, `npm run spec:validate`

## Workflow follow-up

- 사람이 요청하면 최신 `main`에서 `supabase db push` → `supabase functions deploy mailbox` → 웹 export·배포(`CONTRIBUTING.md` 3.4).
