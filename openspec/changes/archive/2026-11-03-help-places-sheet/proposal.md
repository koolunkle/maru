# Proposal

## Why

마음 보관함은 쉬러 온 사람(docs/PRODUCT.md 페르소나)이 머무는 화면이다. 맨 아래 "도움받을 수 있는 곳" 링크를 누르면 다른 화면으로 넘어가 흐름이 끊긴다. 한 줄 기록·타임캡슐처럼 바텀시트로 열어 마음 보관함을 떠나지 않고 확인하게 한다.

## What Changes

- 마음 보관함 맨 아래 "도움받을 수 있는 곳" 링크를 누르면 화면 이동 대신 바텀시트가 열리고, 시트 안에 세 곳이 지금과 같은 행으로 보인다.
- 주간 리포트의 "도움 안내 보기"와 설정의 "도움받을 수 있는 곳"은 지금처럼 별도 화면으로 연다.

하지 않는 것:
- 세 곳의 이름·설명·링크, 행을 누르는 동작은 바꾸지 않는다.
- 별도 화면(`/help`)은 없애지 않는다.

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `rest-area`: 마음 보관함의 도움받을 수 있는 곳 링크를 바텀시트로 연다.

## Impact

- 코드: `src/screens/vault.tsx`, `src/screens/help.tsx`, 새 컴포넌트 `src/components/help-place-list.tsx`. DESIGN.md S14 행 갱신.
- DB 마이그레이션: 없음. Edge Function 재배포: 없음. 운영 설정값 변경: 없음.
