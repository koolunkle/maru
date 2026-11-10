# Design

## Context

`recommend-missions`의 `sanitize`는 오늘 미션의 `minutes`를 `min(AI 값, daily_minutes)`로 깎는다. 오늘 미션이 금칙어 등으로 하나라도 빠지면(`daily.length < 3`) 추천 전체를 시드 규칙(`pickSeeds`)으로 대체한다. DB 함수 `save_recommendation`은 `p_ai_missions` 길이가 정확히 4가 아니면 `invalid_missions`를 내고, 저장 뒤에는 오늘 미션이 3개보다 적으면 시드로 채운다(난이도 +1 이하, `minutes <= daily_minutes` 우선, 관심 카테고리 우선). 이 보충은 기간이 끝난 미션을 빼면서 이미 쓰고 있다.

## Decisions

### 1. 함수: 깎지 않고 버린다
`sanitize`에서 시간 깎기를 없애고, 오늘 미션은 `minutes <= daily_minutes`인 것만 남긴다. 남은 오늘 미션이 1개 이상이고 이번 주 미션이 있으면 AI 결과로 저장한다. 0개면 지금처럼 시드 규칙으로 대체한다.

### 2. DB: 2~4개를 받고 마지막을 이번 주 미션으로 본다
`jsonb_array_length(p_ai_missions) not between 2 and 4`면 `invalid_missions`. 이번 주 미션은 `ids[cardinality(ids)]`, 오늘 미션은 그 앞. 나머지 본문은 `20261101091000_mission_schedule`과 같다. 빈자리는 기존 보충 루프가 채운다.
- 대안: 함수가 시드를 골라 AI 미션처럼 복사해 4개를 맞춰 보내기 → 시드가 사용자별 AI 미션으로 복제되고, 보충 규칙이 함수와 DB 두 곳에 생긴다.
- 대안: 4개 고정은 두고 버린 자리만 시드 id로 넘기기 → `p_daily_ids`와 `p_ai_missions`를 함께 받도록 함수 계약이 더 크게 바뀐다.

### 3. 측정
`eval.mjs`의 가짜 DB가 마지막 항목을 이번 주 미션으로 보고, 오늘 미션이 3개보다 적으면 DB와 같은 순서(첫 후보)로 시드를 채운다. AI 조건 2회를 다시 돌려 시간 초과(최종), 시드 보충 비율, 관심사 일치 변화를 본다.

## Risks / Trade-offs

- [시드로 채운 미션은 관심사 일치가 낮을 수 있다] → 시드 보충은 관심 카테고리를 우선한다. 측정으로 변화 폭을 기록한다.
- [마이그레이션이 함수 본문 전체를 다시 만든다] → 바뀐 줄은 세 줄이다. 로컬 DB의 SQL 시나리오(`atomicity.sql`)로 일부 AI 미션 저장과 1개(이번 주만) 거부를 확인한다.

## Migration Plan

1. 병합 뒤 최신 main에서 `npx supabase db push`.
2. `recommend-missions` 배포.
되돌릴 때는 함수를 이전 커밋으로 재배포한다. DB는 4개도 그대로 받으므로 되돌리지 않아도 된다.
