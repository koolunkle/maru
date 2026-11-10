# Tasks

## 1. DB

- [x] 1.1 새 마이그레이션에서 `get_relay_messages`를 `returns table (body text, same_mission boolean)`으로 다시 만들고(`drop` 뒤 `create`, 권한 다시 부여) 고르는 규칙은 그대로 둔다
- [x] 1.2 `supabase/tests/relay.sql`에 같은 미션 글은 `same_mission = true`, 같은 카테고리 다른 미션 글은 `false`인지 확인을 더하고 로컬 DB에서 실행한다
- [x] 1.3 로컬 DB에 마이그레이션을 적용하고 `gen types --local`로 이 함수의 반환 형태를 확인해 `src/types/database.ts`에 반영한다. 로컬 생성기는 기존 파일과 형식이 달라 파일 전체를 바꾸지 않았다. 운영 반영 뒤 `--project-id`로 다시 만들어 대조한다

## 2. 앱

- [x] 2.1 `src/lib/missions.ts`가 함수가 돌려준 `{ body, same_mission }`을 그대로 넘긴다
- [x] 2.2 `src/screens/mission-detail.tsx`의 `relay-item`에서 `same_mission`이 `false`면 본문 위에 "비슷한 미션에서"(`caption` `steel`)를 보이고, 스크린 리더가 함께 읽게 한다
- [x] 2.3 DESIGN.md S4 "먼저 해낸 사람의 한 줄" 행에 출처 표시를 적는다

## 3. 검증

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run spec:validate`
- [x] 3.2 미리보기 배포는 운영 DB를 쓰므로 DB 반영 전에는 표시를 확인할 수 없다. 로컬 설정 파일이 없어 로컬에서 익명 로그인 온보딩도 할 수 없어, 로컬 DB에 로그인한 사용자로 함수를 불러 같은 미션 글은 `same_mission: true`, 비슷한 미션 글은 `false`인 것을 확인했다. 화면 표시는 운영 반영 뒤 운영 URL에서 확인한다

## Workflow follow-up

- 사람이 요청하면 최신 `main`에서 `npx supabase db push` 뒤 웹을 배포한다(`CONTRIBUTING.md` 3.4). 반영 뒤 운영 기준으로 타입을 다시 만들어 차이가 없는지 본다.
