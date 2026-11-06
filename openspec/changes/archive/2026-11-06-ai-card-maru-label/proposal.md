# Proposal

## Why

본선 발표(11/9)에서 앱이 만든 문구를 "AI가"가 아니라 "MARU가" 건네는 말로 보여 주기로 했다(덱 v7, 발표대본 v7). 지금 AI 카드는 왼쪽 위에 "AI"라고 쓰여 있어 시연 영상 자막("MARU의 편지", "MARU가 알아봐 줘요")과 화면이 어긋난다.

## What Changes

- AI 카드 왼쪽 위 라벨을 "AI"에서 "MARU"로 바꾼다.
- copy-guidelines의 "AI 결과와 규칙 결과 구분" 요구사항에 라벨 문구를 적는다. AI가 만든 내용만 이 카드로 보여 주고 규칙 결과는 일반 카드로 보여 주는 규칙은 그대로다.

하지 않는 것:
- 카드 색·테두리·위치, AI가 만든 내용과 규칙 결과를 나누는 기준은 바꾸지 않는다.
- 덱 9쪽의 AI 운영 방식 설명, 부록의 AI 안전 설계 문서는 바꾸지 않는다(발표에서 AI 사용은 그대로 밝힌다).

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `copy-guidelines`: AI 카드 라벨 문구.

## Impact

- 코드: `src/components/ai-card.tsx` 라벨 한 줄. `DESIGN.md` 5.3 `ai-card` 설명.
- DB 마이그레이션·Edge Function 재배포·app_config 변경: 없음. 웹 운영 반영이 필요하다.
- 시연 영상(v10)은 다시 녹화하지 않고 라벨 부분만 덮어 맞춘다.
