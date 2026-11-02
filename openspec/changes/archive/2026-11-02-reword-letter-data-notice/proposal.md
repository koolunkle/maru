# Proposal

## Why

docs/PRODUCT.md 1.3절의 판단하지 않는 느슨한 관계, 페르소나 민수를 위한 문구 수정이다. 주간 편지 생성 전 안내의 "무료 서비스에서는 입력 내용이 …"는 우리가 Gemini 무료 등급을 쓴다는 뜻인데, 사용자에게는 "이 앱의 무료 버전이라서 내 기록이 쓰인다"거나 "돈을 내면 달라진다"처럼 읽힐 수 있다. 알려야 할 사실(Google이 입력을 서비스 개선에 쓰고 사람이 볼 수 있음)은 그대로 두고, 요금제 표현을 뺀다.

## What Changes

- 안내 문구를 "무료 서비스에서는 입력 내용이 Google의 제품 개선과 사람 검토에 사용될 수 있어요."에서 "전달된 내용은 Google이 서비스를 개선하는 데 쓸 수 있고, 이 과정에서 Google 검토자가 읽을 수도 있어요."로 바꾼다.
- weekly-letter spec의 "생성 전 전송 안내" 요구사항에서 "무료 서비스에서는" 표현을 같은 뜻으로 바꾼다.

하지 않는 것:
- 전달하는 정보, 생성 조건("마음 리포트 보기"를 눌러야 만든다), 삭제 안내는 바꾸지 않는다.
- Gemini 요금 등급은 바꾸지 않는다(PRODUCT 4절 열린 문제 그대로).

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `weekly-letter`: 생성 전 전송 안내 문구.

## Impact

- 코드: `src/screens/letter.tsx` 문구 한 줄.
- DB 마이그레이션·Edge Function 재배포·app_config 변경: 없음. 웹 운영 반영이 필요하다.
