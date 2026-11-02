## Context

마음 보관함(우체통·한 줄 기록·타임캡슐)은 `src/screens/rest.tsx` 위쪽에 있고, 아래쪽에 도움 안내와 빗소리가 있다. 탭은 `src/app/(tabs)/_layout.tsx`에서 5개를 `Tabs.Screen`으로 선언한다. 카드 컴포넌트(`MailboxCard`, `DailyNoteCard`, `CapsuleCard`)는 이미 독립돼 있어 화면만 나누면 된다. 주간 리포트(`src/screens/letter.tsx`)의 "도움 안내 보기"는 `/rest`로 보낸다.

## Goals / Non-Goals

**Goals:**
- 마음 보관함을 홈 바로 오른쪽 탭으로 분리한다.
- 휴게소는 도움 안내와 빗소리만 남긴다.
- 카드 동작은 그대로 옮기고, 자동 수신함 열기·타임캡슐 도착 표시는 새 탭을 열 때 일어난다.

**Non-Goals:**
- 카드 내부 규칙, DB, Edge Function 변경.
- 탭 배지, 알림.

## Decisions

- **라우트와 화면**: `src/app/(tabs)/vault.tsx` → `src/screens/vault.tsx`의 `Vault`. 기존 라우트 이름 규칙(index·feed·record·room·rest)에 맞춰 짧은 영문 이름 `vault`를 쓴다. 화면 제목은 "마음 보관함"이다.
- **탭 순서**: `Tabs.Screen`을 index 바로 뒤에 `vault`로 선언한다. Expo Router는 선언 순서로 탭을 그린다. 아이콘은 Feather `archive`(기존 sun·coffee 등과 같은 계열).
- **화면 구성**: `Vault`에 `profile`이 있을 때만 `MailboxCard`·한 줄 기록 메뉴·`DailyNoteCard` 시트·`CapsuleCard`를 `rest.tsx`에서 그대로 옮긴다. 한 줄 기록의 오늘 기분 불러오기(`getDailyNote` + `useFocusEffect`)도 함께 옮겨 탭에 돌아올 때마다 갱신한다. 위에 안내문 한 줄("마음을 남기고 받는 곳이에요")을 둘지는 DESIGN.md 설명에 맞춰 작게 둔다.
- **자동 수신함 열기**: 이 로직은 `MailboxCard`가 마운트될 때 도는 것으로 보인다. 탭은 `js-tabs`라 화면이 한 번 마운트되면 유지될 수 있으므로, 구현 때 "탭에 들어올 때마다 하루 한 번"이 지켜지는지(포커스 기준인지 마운트 기준인지) 확인하고, 마운트 기준이면 포커스 기준으로 맞춘다. 기존 휴게소와 같은 조건이면 충분하다.
- **휴게소**: `rest.tsx`에서 마음 보관함 블록과 관련 상태(`noteOpen`, `todayMood`, `loadTodayNote`)·import를 지운다. 첫 섹션이 사라지므로 "도움받을 수 있는 곳" 위 간격을 첫 섹션 기준(`firstSection`)으로 맞춘다.
- **리포트 링크**: `/rest`는 그대로 둔다. 도움 안내가 휴게소에 남기 때문이다.
- **탭 6개 폭**: 탭 라벨 "마음 보관함"은 6자라 가장 길다. 360px 폭에서 라벨이 줄바꿈·잘림 없이 한 줄로 보이는지 확인한다. 잘리면 라벨만 "보관함"으로 줄이고 화면 제목은 "마음 보관함"을 유지한다.

## Risks / Trade-offs

- 탭이 6개로 늘어 좁은 화면에서 답답할 수 있다 → 위 폭 확인으로 대응하고, 안 되면 라벨 축약.
- 도움이 필요한 사람이 보관함에서 도움 안내를 바로 못 찾을 수 있다 → 위기 판정 시 우체통이 도움 안내 카드를 보여 주는 기존 동작은 그대로 유지된다. 보관함 화면에 휴게소로 가는 링크는 이번에 넣지 않는다.
- 기존 사용자는 한 줄 기록·타임캡슐이 옮겨진 걸 모를 수 있다 → 별도 안내는 하지 않는다. 필요하면 후속 change로 다룬다.

## DB 변경

없음.
