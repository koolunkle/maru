발표(11/9) 전 근거 수치로 쓰기 위해 2026-11-03에 실행한다.

## 1. 준비

- [x] 1.1 이번 주 행사 후보를 운영 DB에서 읽어 `events-snapshot.json`으로 고정한다(읽기만)
- [x] 1.2 `eval.mjs`를 만들고 가짜 AI(`--fake`)로 두 조건·지표·결과 JSON까지 돌아가는지 확인한다. 가짜 실행에서 시드 규칙의 사람 사이 겹침이 이미 낮게 나와, 실제 실행 전에 겹침을 보조 지표로 내렸다(design.md)

## 2. 실행

- [x] 2.1 A(AI) 24명 × 2회, R(시드 규칙) 24명 × 5회를 돌린다. 셸의 옛 `GEMINI_API_KEY` 환경 변수가 `.env`보다 우선하므로 `env -u GEMINI_API_KEY`로 실행한다
- [x] 2.2 운영 DB에 새 추천·미션 기록이 생기지 않았는지 확인한다

## 3. 기록

- [x] 3.1 지표 표와 눈에 띄는 추천 사례를 verification.md에 남기고, design.md의 읽는 기준으로 해석한다

## 4. 검증

- [x] 4.1 npm run spec:validate, npm run typecheck, npm run lint, npm test를 실행한다
