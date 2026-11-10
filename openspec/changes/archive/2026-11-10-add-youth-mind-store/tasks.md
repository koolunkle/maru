# Tasks

## 1. 앱

- [x] 1.1 `src/constants/help.ts`의 서울마음편의점 다음에 청년마음편의점(`coffee` 아이콘, 서울시 복지 누리집 서울잇다플레이스 안내 주소)을 더한다
- [x] 1.2 `help-place-list.tsx`의 "세 곳" 주석과 DESIGN.md S10 행을 네 곳으로 고친다

## 2. 검증

- [x] 2.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run spec:validate`
- [x] 2.2 로컬 웹은 로그인 전이라 `/help`가 시작 화면으로 넘어가고, 시작하면 운영 DB에 익명 계정이 생겨 화면 확인은 하지 않았다. 목록은 같은 컴포넌트가 데이터대로 그리므로 운영 반영 뒤 운영 URL에서 네 곳과 새 창 열림을 확인한다. 안내 주소(서울시 복지 누리집 「서울잇다플레이스」, 2026-09-28 갱신)는 청년마음편의점 1호점 소개를 담은 것을 확인했다

## Workflow follow-up

- 사람이 요청하면 최신 `main`에서 웹을 배포한다(`CONTRIBUTING.md` 3.4).
