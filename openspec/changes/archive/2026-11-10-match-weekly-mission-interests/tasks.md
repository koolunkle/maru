# Tasks

## 1. 추천 함수

- [x] 1.1 `recommend-missions`가 관심 카테고리에 `culture`가 없으면 행사를 조회하지 않고 AI 입력의 `events`를 빈 배열로 둔다
- [x] 1.2 AI 기준 문구에 "weekly도 관심 카테고리 중 하나로 낸다"를 더한다
- [x] 1.3 `tests/recommend-events.test.mjs`: 문화·전시를 고르지 않은 사용자는 행사를 조회하지 않고 AI에 넘기지 않음, 고른 사용자는 그 구의 행사를 넘김. 고치기 전 코드에서 첫 테스트가 실패하는 것을 확인한다
- [x] 1.4 `docs/ARCHITECTURE.md`의 행사 설명을 고친다

## 2. 측정

- [x] 2.1 archive된 `measure-mission-recommendation/eval.mjs`의 상대 경로를 archive 위치에 맞추고, 같은 가상 사용자 24명·행사 스냅샷으로 AI 조건 2회를 다시 돌린다
- [x] 2.2 이번 주 미션 관심사 일치, 행사 연결 비율(문화·전시를 고른 사용자와 아닌 사용자), 오늘 미션 지표 변화 여부를 verification.md에 적는다

## 3. 검증

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run spec:validate`
- [x] 3.2 서버 함수는 미리보기 환경이 없어(`CONTRIBUTING.md` 3.4) Scenario는 테스트와 2절 측정으로 확인한다. 운영 반영 뒤 문화·전시를 고르지 않은 계정으로 이번 주 미션이 행사가 아닌지 본다

## Workflow follow-up

- 사람이 요청하면 최신 `main`에서 `recommend-missions`만 재배포한다(`CONTRIBUTING.md` 3.4).
