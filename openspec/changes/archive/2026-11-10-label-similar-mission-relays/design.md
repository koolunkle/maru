# Design

## Context

`get_relay_messages(mission uuid)`는 `returns table (body text)`로, 같은 미션 글을 먼저(`order by (r.mission_id = t.id) desc`) 최신순으로 정렬해 3개를 돌려준다(`20261027110000_relay_messages.sql`). 앱은 `src/lib/missions.ts`에서 `body`만 꺼내 `string[]`으로 쓰고, `src/screens/mission-detail.tsx`가 `relay-item`으로 그린다.

## Goals / Non-Goals

**Goals:**
- 한 줄마다 같은 미션의 글인지 앱이 알 수 있게 한다.
- 지금 운영 웹이 새 DB와 함께 동작한다(DB를 먼저 반영).

**Non-Goals:**
- 고르는 규칙 변경. 다른 미션의 id·제목 노출.

## Decisions

### 1. 반환에 `same_mission boolean` 추가
`returns table (body text, same_mission boolean)`로 바꾸고 `r.mission_id = t.id`를 그대로 돌려준다. 정렬에 쓰던 식과 같아 규칙이 어긋날 일이 없다.
- 반환 형태가 바뀌면 `create or replace`가 안 되므로 새 마이그레이션에서 `drop function` 뒤 다시 만들고 권한(`authenticated`만 실행)을 다시 준다.
- 대안: 출처 미션 id를 돌려주기 → 앱이 필요한 것은 같은지 여부뿐이고, 다른 사람의 미션 id를 내보낼 이유가 없다.

### 2. 표시
`relay-item` 안에서 본문 위에 `caption` `steel` "비슷한 미션에서", 4px 간격. 스크린 리더는 "비슷한 미션에서, {본문}"으로 한 번에 읽는다. 같은 미션 글은 지금과 같다.

### 3. 호환
지금 운영 웹은 `r.body`만 읽으므로 열이 늘어도 동작한다. DB를 먼저 반영하고 웹을 배포한다. DB 반영과 웹 배포 사이에는 표시만 없다.

## Risks / Trade-offs

- [drop과 create 사이에 호출] → 한 마이그레이션(한 트랜잭션) 안에서 처리해 중간 상태가 보이지 않는다.
- [로컬 타입 생성과 운영 차이] → 로컬 DB에 마이그레이션을 모두 적용한 뒤 `gen types --local`로 만든다. 운영 반영 뒤 `--project-id`로 다시 만들어 차이가 없는지 본다.

## Migration Plan

1. PR 병합 뒤 관리자가 최신 main에서 `npx supabase db push`.
2. 웹 배포. 되돌릴 때는 이전 정의로 함수를 다시 만드는 마이그레이션을 새로 쓴다(적용된 파일은 고치지 않는다).
