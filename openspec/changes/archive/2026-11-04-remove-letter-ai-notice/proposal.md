# Proposal

## Why

주간 편지 생성 전 안내에서 AI 제공자(Google Gemini)에 무엇이 전달되고 Google이 어떻게 쓸 수 있는지 설명하는 문구를 빼 달라는 요청이다. 생성 전 화면을 짧게 두고, 기록 보관에 관한 안내만 남긴다.

## What Changes

- 생성 전 안내에서 "편지를 만들 때 이 주의 기분과 한 줄 원문, 완료한 미션이 Google Gemini에 전달돼요."와 "전달된 내용은 Google이 서비스를 개선하는 데 쓸 수 있고, 이 과정에서 Google 검토자가 읽을 수도 있어요."를 지운다.
- "기록과 편지는 자동 삭제되지 않아요. 원본을 삭제해도 이미 만든 편지에 내용이 남을 수 있어요."는 남긴다.
- weekly-letter spec의 "생성 전 전송 안내" 요구사항을 보관 안내만 보이도록 바꾼다.

하지 않는 것:
- AI에 보내는 정보, 개인정보 가리기, 생성 조건("마음 리포트 보기"를 눌러야 만든다)은 바꾸지 않는다.
- Gemini 요금 등급은 바꾸지 않는다(PRODUCT 4절 열린 문제 그대로).

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `weekly-letter`: 생성 전 안내 문구.

## Impact

- 코드: `src/screens/letter.tsx` 문구 두 개 삭제. `DESIGN.md` S11 설명.
- DB 마이그레이션·Edge Function 재배포·app_config 변경: 없음. 웹 운영 반영이 필요하다.
