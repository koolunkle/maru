## 1. 화면과 라우트

- [x] 1.1 빗소리 행(스위치·볼륨)을 `src/components/rain-sound.tsx`로 분리한다
- [x] 1.2 `src/screens/help.tsx`(BackHeader "도움받을 수 있는 곳" + 기관 3곳)와 `src/app/help.tsx` 라우트를 만들고 루트 스택에 등록한다
- [x] 1.3 `src/screens/vault.tsx` 카드 아래에 "배경음"(`RainSound`)과 맨 아래 도움받을 수 있는 곳 링크를 둔다
- [x] 1.4 하단 탭에서 휴게소를 빼고 `src/app/(tabs)/rest.tsx`, `src/screens/rest.tsx`를 지운다
- [x] 1.5 주간 리포트 "도움 안내 보기"를 `/help`로 바꾸고, 설정에 "도움받을 수 있는 곳" 행을 추가한다

## 2. 문서

- [x] 2.1 DESIGN.md: 탭 바 5개, S10을 도움받을 수 있는 곳 화면으로, S14 마음 보관함에 배경음·도움 링크, 휴게소 언급 정리
- [x] 2.2 docs/ARCHITECTURE.md: 탭 표, 화면 표(S10 `/help`), 도움 안내 링크 설명
- [x] 2.3 docs/PRODUCT.md: 민수 8단계·지은 7단계·현우 6~7단계 화면과 문구, F12 이름
- [x] 2.4 `prepare-demo-rehearsal` README의 "휴게소 → 우체통"을 "마음 보관함 → 우체통"으로
- [x] 2.5 sync·archive할 때 `rest-area` Purpose를 새 구성에 맞춘다

## 3. 검증

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run format`
- [x] 3.2 `npm run spec:validate`
- [x] 3.3 로컬 웹에서 각 Scenario 확인: 탭 5개 순서, 마음 보관함의 카드·배경음·도움 링크, 빗소리 켜고 탭 이동, 설정·보관함에서 도움 화면 열고 뒤로 가기(주간 리포트 링크는 경로만 바꿔 typecheck로 확인)
- [x] 3.4 360px 폭에서 탭 라벨 5개가 잘리지 않는지 확인
