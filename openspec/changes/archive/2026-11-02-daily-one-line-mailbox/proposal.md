# Proposal

## Why

마음 우체통의 원칙은 하루 한 줄이다. 지금은 받은 한 줄 목록 아래에 '한 줄 쓰기'와 '보낸 한 줄'이 늘 같이 보여서, 오늘 이미 보냈어도 또 쓰게 되고 아직 보낸 적 없는 사람에게는 빈 '보낸 한 줄'이 눈에 띈다. 오늘 상태에 맞는 버튼 하나만 보여 하루 한 줄을 자연스럽게 지키게 한다.

## What Changes

- 받은 한 줄 목록 아래 버튼이 오늘(KST) 보낸 한 줄 여부로 갈린다.
  - 오늘 보낸 한 줄이 없으면 '한 줄 쓰기'만 보인다.
  - 오늘 보낸 한 줄이 있으면 '한 줄 쓰기'는 없고 '보낸 한 줄'만 보인다.
- 검수에서 거절되거나 위기로 분류된 한 줄은 오늘 보낸 것으로 세지 않는다. 다시 써 볼 수 있어야 한다.

하지 않는 것:
- 거절·위기 글은 하루 제한에 세지 않는다. 동시에 두 요청이 들어오면 둘 다 저장될 수 있다(DB 제약은 두지 않는다).
- 글자 수, 검수, 받기 규칙은 바꾸지 않는다.

## Capabilities

### New Capabilities

없음.

### Modified Capabilities

- `mailbox`: 한 줄 보내기를 하루 한 줄로 안내하고 버튼을 오늘 보낸 여부에 맞춘다.

## Impact

- 코드: `src/components/mailbox-card.tsx`, `supabase/functions/mailbox/index.ts`, `tests/mailbox.test.mjs`.
- DB 마이그레이션: 없음. Edge Function 재배포: 필요(mailbox, 사람이 요청할 때만).
