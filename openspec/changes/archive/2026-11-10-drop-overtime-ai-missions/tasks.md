# Tasks

## 1. DB

- [x] 1.1 새 마이그레이션에서 `save_recommendation`이 AI 미션을 2~4개 받고 마지막을 이번 주 미션으로 보게 한다. 나머지 본문은 `20261101091000_mission_schedule`과 같다
- [x] 1.2 `supabase/tests/atomicity.sql`: AI 오늘 미션 1개 + 이번 주 미션이면 오늘 미션 3개(나머지는 시드)와 그 이번 주 미션, 이번 주 미션만이면 `invalid_missions`. 로컬 DB에서 `npm run test:sql`

## 2. 추천 함수

- [x] 2.1 `sanitize`에서 시간 깎기를 없애고, 하루 시간을 넘는 오늘 미션은 버린다. 남은 오늘 미션이 0개일 때만 시드 규칙으로 대체한다
- [x] 2.2 `tests/recommend-events.test.mjs`: 15분 미션 하나를 버리고 나머지 2개와 이번 주 미션을 저장, 모두 넘으면 시드 규칙 대체. 고치기 전 코드에서 실패하는 것을 확인한다
- [x] 2.3 `docs/ARCHITECTURE.md` 추천 흐름

## 3. 측정

- [x] 3.1 `eval.mjs`의 가짜 DB가 일부만 온 AI 미션을 DB처럼 시드로 채우게 하고, AI 조건 2회를 다시 돌린다
- [x] 3.2 시간 초과(최종), 시드 보충 비율, 관심사 일치 변화를 verification.md에 적는다

## 4. 검증

- [x] 4.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run spec:validate`, `npm run test:sql`
- [x] 4.2 서버 함수는 미리보기 환경이 없어 Scenario는 테스트와 측정으로 확인한다

## Workflow follow-up

- 사람이 요청하면 최신 `main`에서 `npx supabase db push` 뒤 `recommend-missions`를 배포한다(DB → 함수 순서).
