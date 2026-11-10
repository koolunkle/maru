# Design

## Context

`mailbox` 함수의 `inbox` 동작은 `receive_mailbox_message(recipient)`를 먼저 불러, 안 읽은 글이 없고 오늘(KST) 받은 글도 없으면 가장 오래된 승인 글을 그 사람에게 배정한다(`20261029100000_mailbox_daily_receive.sql`). 탭 점을 위해 `inbox`를 부르면 탭을 옮길 때마다 글이 배정돼, 마음 보관함에 들어가지도 않은 사람에게 글이 묶인다.

## Goals / Non-Goals

**Goals:**
- 배정 없이 "점을 보일지"만 알 수 있게 한다.
- 점 조건이 배정 조건과 어긋나지 않는다.

**Non-Goals:**
- 실시간 구독, 푸시, 숫자 배지.

## Decisions

### 1. DB 함수 `mailbox_waiting(recipient) returns boolean`
배정 함수 바로 옆(같은 KST 하루 경계식)에 둔다. 참이 되는 경우: 공개된 안 읽은 글이 있다, 또는 오늘 받은 글이 없고 다른 사람의 승인 글이 있다. `stable`, `security definer`, `service_role`만 실행.
- 대안: Edge Function에서 쿼리 세 번 → 배정 조건이 SQL과 TS 두 곳에 생겨 어긋날 수 있다.
- 승인 글이 있다는 사실만 참·거짓으로 돌려주므로 작성자나 글 수가 드러나지 않는다.

### 2. `mailbox` 함수에 `waiting` 동작
`{ action: 'waiting' }` → `{ waiting: boolean }`. JWT 사용자만 대상으로 한다.

### 3. 앱
하단 탭 레이아웃이 탭 포커스가 바뀔 때와 앱이 다시 활성화될 때 `waiting`을 부른다. 마음 보관함 탭이 포커스면 부르지 않고 점을 숨긴다. 점은 `tabBarBadge: ''`와 `tabBarBadgeStyle`(8px 원, `accent`)로 그리고, `tabBarAccessibilityLabel`을 "마음 보관함, 새 한 줄이 있어요"로 바꾼다. 조회가 실패하면 점을 숨긴다(오류 안내 없음).

## Risks / Trade-offs

- [탭 이동마다 함수 호출] → 결과가 참·거짓 하나이고 쿼리는 인덱스 조건 세 개다. 사용자가 늘어 부담이 되면 짧은 캐시를 둔다.
- [점이 보인 뒤 다른 사람이 그 글을 먼저 받음] → 마음 보관함에 들어가면 받을 글이 없을 수 있다. 다음 탭 이동 때 점이 사라진다.

## Migration Plan

1. 병합 뒤 최신 main에서 `supabase db push` → `supabase functions deploy mailbox` → 웹 export·배포.
2. 되돌릴 때는 웹을 이전 배포로 되돌리면 충분하다. 함수와 DB 함수는 남아 있어도 부르는 곳이 없다.
