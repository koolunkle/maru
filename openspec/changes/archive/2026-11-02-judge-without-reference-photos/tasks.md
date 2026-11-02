## 1. 구현

- [x] 기준 사진 읽기 실패를 AI 판정과 분리하고, 실패하면 기준 사진 없이 판정한다.
- [x] 실패 원인을 서버 로그에 남긴다.

## 2. 검증

- [x] 기준 사진 읽기 실패 시 두 대체 설정 모두에서 기준 사진 없이 AI 판정하는지 테스트한다.
- [x] npm run typecheck, npm run lint, npm test, npm run spec:validate를 실행한다.
