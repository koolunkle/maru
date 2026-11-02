# Proposal

## Why

docs/PRODUCT.md 1.3절의 "입구는 '도움'이 아니라 '오늘 할 일'" 원칙과 발표 페르소나 민수를 위한 변경이다. split-mind-vault-tab 뒤로 하단 탭이 6개가 되면서 360px 폭에서 "마음 보관함" 라벨이 "마음 보…"로 잘리고, 휴게소 탭에는 도움받을 수 있는 곳 세 줄과 빗소리 하나만 남았다. 탭 하나가 사실상 상담 창구 목록이 되어 앱이 도움을 앞세우는 모양이 됐고, 모바일 하단 탭 권장 개수(3~5개)도 넘는다.

## What Changes

- 하단 탭을 홈·마음 보관함·피드·기록·내 방 5개로 줄인다. 휴게소 탭을 없앤다.
- 빗소리 배경음(켜기·끄기·볼륨)을 마음 보관함 탭 아래 "배경음"으로 옮긴다. 동작은 그대로다.
- 도움받을 수 있는 곳(외로움안녕120·서울마음편의점·청년마음건강 지원사업)을 탭이 아닌 별도 화면으로 둔다. 다음 세 곳에서 연다.
  - 주간 리포트의 "도움 안내 보기"
  - 설정의 "도움받을 수 있는 곳" 행
  - 마음 보관함 맨 아래 "도움받을 수 있는 곳" 링크
- 위기 표현에 보이는 도움 안내 카드(120 전화)는 그대로다.
- 시연 자료와 문서의 휴게소 경로를 새 경로로 고친다.

하지 않는 것:
- 우체통·한 줄 기록·타임캡슐·빗소리 자체의 규칙은 바꾸지 않는다.
- 도움 기관 목록과 주소는 바꾸지 않는다.
- 옛 주소 `/rest`로 들어오는 경우는 따로 처리하지 않는다(앱 안 링크는 모두 바꾼다).

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `rest-area`: 휴게소 탭을 없애고, 탭을 5개로 줄이고, 빗소리를 마음 보관함으로, 도움받을 수 있는 곳을 별도 화면으로 옮긴다.
- `weekly-letter`: "도움 안내 보기"가 도움받을 수 있는 곳 화면으로 간다.
- `copy-guidelines`: 기관명 예외가 적용되는 곳을 휴게소에서 도움받을 수 있는 곳 화면으로 바꾼다.

## Impact

- 코드: `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/rest.tsx`(삭제), `src/app/help.tsx`(새 라우트), `src/app/_layout.tsx`(스택 등록), `src/screens/help.tsx`(새 화면, `rest.tsx`에서 옮김), `src/screens/vault.tsx`, `src/screens/settings/index.tsx`, `src/screens/letter.tsx`, `src/components/rain-sound.tsx`(빗소리 행을 컴포넌트로 분리).
- 문서: DESIGN.md, docs/ARCHITECTURE.md, docs/PRODUCT.md, `prepare-demo-rehearsal` README.
- DB 마이그레이션: 없음. Edge Function 재배포: 없음. 운영 설정값(app_config) 변경: 없음. 웹 운영 반영(eas deploy)이 필요하다.
