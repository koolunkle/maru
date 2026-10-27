---
version: alpha
name: seoul-challenge-design
description: 따뜻한 오프화이트 위에 카테고리별 파스텔 카드로 하루 5분 미션을 보여주는, 헤어라인 중심의 웜 미니멀 디자인 시스템.

colors:
  canvas: "#faf9f7"
  surface: "#ffffff"
  surface-sunken: "#f3f1ee"
  hairline: "#e8e5e0"
  hairline-strong: "#cfcbc4"
  ink: "#2b2a27"
  slate: "#5f5d57"
  steel: "#6b6862"
  muted: "#b5b1a9"
  primary: "#4f5bd5"
  primary-pressed: "#3f4ab8"
  primary-soft: "#eceefb"
  on-primary: "#ffffff"
  accent: "#f08a3e"
  accent-ink: "#a8520f"
  accent-soft: "#fff1e5"
  success: "#2f9e5b"
  error: "#d9483b"
  help-soft: "#e8f1fb"
  tint-walk: "#ddf2e3"
  tint-food: "#ffe8d4"
  tint-culture: "#e8e2f6"
  tint-growth: "#fdf3cf"
  tint-neighborhood: "#dcecfa"
  tint-rhythm: "#f5efe3"
  tint-people: "#fce3ec"
  room-wall: "#f3ede4"
  room-floor: "#e3d5c3"
  dark-canvas: "#151517"
  dark-surface: "#1f1f22"
  dark-hairline: "#2e2e33"
  dark-ink: "#ecebe8"
  dark-slate: "#a9a7a1"
  dark-primary: "#8a93f0"
  dark-primary-soft: "#262a4a"
  dark-accent: "#f5a065"
  dark-primary-pressed: "#6f79e6"
  dark-on-primary: "#151517"
  dark-muted: "#5f5d57"
  dark-accent-soft: "#2e2620"
  dark-success: "#4cbb78"
  dark-error: "#e8695e"
  dark-help-soft: "#1e2a38"
  dark-room-wall: "#2a2723"
  dark-room-floor: "#3a332b"

typography:
  display:
    fontFamily: Pretendard-Bold
    fontSize: 28px
    lineHeight: 36px
    letterSpacing: -0.5px
  title-lg:
    fontFamily: Pretendard-Bold
    fontSize: 22px
    lineHeight: 30px
    letterSpacing: -0.3px
  title-md:
    fontFamily: Pretendard-SemiBold
    fontSize: 18px
    lineHeight: 26px
    letterSpacing: -0.2px
  body-md:
    fontFamily: Pretendard-Regular
    fontSize: 16px
    lineHeight: 24px
  body-sm:
    fontFamily: Pretendard-Regular
    fontSize: 14px
    lineHeight: 21px
  caption:
    fontFamily: Pretendard-Regular
    fontSize: 13px
    lineHeight: 18px
  label:
    fontFamily: Pretendard-SemiBold
    fontSize: 12px
    lineHeight: 16px
  button:
    fontFamily: Pretendard-SemiBold
    fontSize: 16px
    lineHeight: 22px

rounded:
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 48px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 52px
    paddingX: 20px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 52px
    paddingX: 20px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.slate}"
    typography: "{typography.body-sm}"
    height: 44px
    paddingX: 12px
  mission-card:
    backgroundColor: "{colors.tint-<category>}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-base:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: 20px
  ai-card:
    backgroundColor: "{colors.primary-soft}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  help-card:
    backgroundColor: "{colors.help-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  reward-badge:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 24px
    paddingX: 10px
  chip-category:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: 40px
    paddingX: 14px
  chip-category-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    border: "1px solid {colors.ink}"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-strong}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    minHeight: 48px
    padding: "12px 14px"
  text-input-focused:
    border: "2px solid {colors.primary}"
  comment-pending:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.steel}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 12px
  tab-bar:
    backgroundColor: "{colors.surface}"
    borderTop: "1px solid {colors.hairline}"
    activeColor: "{colors.ink}"
    inactiveColor: "{colors.muted}"
    height: 64px
  room-slot:
    border: "1.5px dashed {colors.hairline-strong}"
    rounded: "{rounded.md}"
    size: 64px
  growth-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: 16px
    iconSize: 48px
    iconColor: "{colors.success}"
    meterHeight: 6px
    meterColor: "{colors.success}"
  relay-item:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px
  letter-card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: 20px
  list-row:
    height: 56px
    borderBottom: "1px solid {colors.hairline}"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl} {rounded.xl} 0 0"
    padding: 24px
    scrim: "rgba(0,0,0,0.3)"
---

# DESIGN — 맞춤형 서울챌린지

> 모든 값은 위 frontmatter 토큰이 단일 출처다. 기능·문구는 [PRD.md](./PRD.md).

## 1. 컨셉 한 줄

**"따뜻한 종이 위에 놓인 오늘의 작은 미션 카드"** — 오프화이트 배경, 파스텔 카테고리 카드, 얇은 선만으로 구성해 부담 없이 하나만 고르게 한다.

## 2. 무드 키워드

| 키워드 | 구현 규칙 |
| --- | --- |
| 웜 미니멀 | 배경 `canvas` #faf9f7, 텍스트 `ink` #2b2a27. 순백·순흑 미사용 |
| 파스텔 카드 | 미션 카드는 카테고리 틴트 7색 중 하나로 채움. 테두리·그림자 없음 |
| 헤어라인 | 면 구분은 1px `hairline`. 그림자는 시트·하단 고정 영역에만 |
| 차분함 | 강조색은 화면당 인디고 1곳(주요 버튼) + 오렌지 1곳(보상)까지 |

## 3. 컬러 팔레트

### 3.1 60-30-10 배분

| 비율 | 역할 | 토큰 (HEX) | 적용 위치 |
| --- | --- | --- | --- |
| 60% | 중립 베이스 | `canvas` #faf9f7, `surface` #ffffff | 화면 배경, 일반 카드, 탭 바, 입력창 |
| 30% | 보조 면 | `tint-*` 7색, `primary-soft` #eceefb, `surface-sunken` #f3f1ee, `hairline` #e8e5e0 | 미션 카드, AI 카드, 대기 댓글, 구분선 |
| 10% | 강조 | `primary` #4f5bd5 (약 7%), `accent` #f08a3e (약 3%) | 주요 버튼, 활성 표시 / 보상 뱃지, 연속 출석 |

텍스트 색(`ink`, `slate`, `steel`)은 배분 계산에서 제외한다.

### 3.2 전체 토큰

| 그룹 | 토큰 | HEX | 용도 |
| --- | --- | --- | --- |
| 베이스 | `canvas` | #faf9f7 | 화면 배경 |
| | `surface` | #ffffff | 카드, 탭 바, 입력창 |
| | `surface-sunken` | #f3f1ee | 공개 대기 댓글, 비활성 영역 |
| | `hairline` | #e8e5e0 | 카드 테두리, 구분선 |
| | `hairline-strong` | #cfcbc4 | 입력창·보조 버튼 테두리, 빈 슬롯 |
| 텍스트 | `ink` | #2b2a27 | 제목, 본문 (대비 13.6:1) |
| | `slate` | #5f5d57 | 보조 텍스트 (6.3:1) |
| | `steel` | #6b6862 | 캡션, 메타 (5.3:1) |
| | `muted` | #b5b1a9 | 비활성 아이콘·텍스트 전용 |
| 브랜드 | `primary` | #4f5bd5 | 주요 버튼, 링크, AI 카드 테두리 (흰 글자 대비 5.5:1) |
| | `primary-pressed` | #3f4ab8 | 눌림·호버 |
| | `primary-soft` | #eceefb | AI 카드 배경 |
| | `accent` | #f08a3e | 보상·출석 아이콘 (텍스트 사용 금지) |
| | `accent-ink` | #a8520f | 오렌지 계열 텍스트 (4.9:1) |
| | `accent-soft` | #fff1e5 | 보상 뱃지 배경 |
| 상태 | `success` | #2f9e5b | 인증 통과 아이콘 |
| | `error` | #d9483b | 입력 검증 오류만 |
| | `help-soft` | #e8f1fb | 도움 안내 카드 배경 |
| 카테고리 | `tint-walk` | #ddf2e3 | 산책·운동 |
| | `tint-food` | #ffe8d4 | 요리·식사 |
| | `tint-culture` | #e8e2f6 | 문화·전시 |
| | `tint-growth` | #fdf3cf | 자기계발 |
| | `tint-neighborhood` | #dcecfa | 동네 탐방 |
| | `tint-rhythm` | #f5efe3 | 생활 리듬 |
| | `tint-people` | #fce3ec | 사람 만나기 |
| 내 방 | `room-wall` | #f3ede4 | 방 벽 |
| | `room-floor` | #e3d5c3 | 방 바닥 |

### 3.3 다크 모드

시스템 설정(`useColorScheme`)을 따른다.

| 라이트 | 다크 |
| --- | --- |
| `canvas` | `dark-canvas` #151517 |
| `surface` | `dark-surface` #1f1f22 |
| `hairline`, `hairline-strong` | `dark-hairline` #2e2e33 |
| `ink` / `slate`, `steel` | `dark-ink` #ecebe8 / `dark-slate` #a9a7a1 |
| `primary` / `primary-soft` | `dark-primary` #8a93f0 / `dark-primary-soft` #262a4a |
| `accent`, `accent-ink` | `dark-accent` #f5a065 |
| `primary-pressed` | `dark-primary-pressed` #6f79e6 |
| `on-primary` | `dark-on-primary` #151517 (대비 6.5:1) |
| `muted` | `dark-muted` #5f5d57 |
| `accent-soft` | `dark-accent-soft` #2e2620 |
| `success` / `error` | `dark-success` #4cbb78 / `dark-error` #e8695e |
| `help-soft` | `dark-help-soft` #1e2a38 |
| `mission-card` 틴트 배경 | `dark-surface` 배경 + 왼쪽 4px 막대(해당 `tint-*` 색) |
| `room-wall` / `room-floor` | `dark-room-wall` #2a2723 / `dark-room-floor` #3a332b |

## 4. 타이포그래피

### 4.1 폰트

- **Pretendard 1종만** 사용. Regular(400) · SemiBold(600) · Bold(700) 3개 굵기.
- 파일: `assets/fonts/Pretendard-Regular.otf`, `Pretendard-SemiBold.otf`, `Pretendard-Bold.otf` (출처 github.com/orioncactus/pretendard, OFL).
- `expo-font`의 `useFonts`로 로드하고, 굵기는 `fontWeight`가 아니라 `fontFamily` 이름으로 지정한다.
- 숫자(연속 출석, 달성률)는 `fontVariant: ['tabular-nums']`.

### 4.2 스케일

| 토큰 | 크기 / 행간 | 굵기 | 자간 | 용도 |
| --- | --- | --- | --- | --- |
| `display` | 28 / 36 | Bold | -0.5 | 온보딩 질문, S7 달성률 숫자 |
| `title-lg` | 22 / 30 | Bold | -0.3 | 화면 제목 |
| `title-md` | 18 / 26 | SemiBold | -0.2 | 카드 제목, 미션명 |
| `body-md` | 16 / 24 | Regular | 0 | 본문 기본값 |
| `body-sm` | 14 / 21 | Regular | 0 | 보조 설명, 칩 |
| `caption` | 13 / 18 | Regular | 0 | 메타 정보, 시각 |
| `label` | 12 / 16 | SemiBold | 0 | 뱃지, 카테고리 라벨 |
| `button` | 16 / 22 | SemiBold | 0 | 버튼 |

### 4.3 대비와 여백 규칙

- 한 화면에 쓰는 크기는 최대 4단계. 제목과 본문 크기 비는 1.4배 이상(22:16, 18:13).
- 제목 → 본문 간격 8px, 본문 문단 간격 12px, 블록(카드 묶음) 간격 32px.
- 본문 최대 폭 440px. 줄바꿈은 `word-break: keep-all`(웹), 한 문장 2줄 이내.

## 5. 섹션 구성

### 5.1 공통 레이아웃

| 항목 | 값 |
| --- | --- |
| 기준 폭 | 375px. 웹은 최대 480px 컬럼 중앙 정렬, 컬럼 바깥 `canvas` |
| 좌우 여백 | 20px |
| 상단 헤더 | 높이 56px, 화면 제목 `title-lg` 좌측 정렬, 우측 아이콘 버튼 44×44 |
| 카드 간격 | 12px |
| 섹션 간격 | 32px |
| 하단 고정 버튼 | 좌우 20px, 하단 16px + safe area, 위 경계 elevation 1 |
| 탭 바 | 64px + safe area. 아이콘 24px + `label`. 탭 5개와 Feather 아이콘: 홈 `sun`, 피드 `message-circle`, 기록 `calendar`, 내 방 `home`, 휴게소 `coffee` |
| 아이콘 | `@expo/vector-icons`의 Feather, 기본 24px, 선 굵기 기본값 |

### 5.2 화면별 구조 (위 → 아래)

| 화면 | 구조 |
| --- | --- |
| S1 시작 | 세로 중앙: 서비스명 `display` → 8px → 소개 `body-md` `slate` / 하단 고정: `button-primary` "시작하기" |
| S2 온보딩 | 상단 진행 표시(3칸 막대, 높이 4px, 활성 `primary`) → 24px → 질문 `display` → 24px → 선택지(카테고리: 칩 flex-wrap 간격 8px / 구: 2열 그리드 칩 / 시간: 세로 `card-base` 3개) / 하단 고정: "다음" |
| S3 홈 | 헤더(날짜 `title-lg` + 설정 아이콘) → 연속 출석 줄(`zap` 아이콘 `accent` + "{N}일째" `title-md`) → 32px → "오늘의 미션" `title-md` → `mission-card` ×3 → 32px → "이번 주 미션" → `mission-card` ×1 → `button-ghost` "다른 미션 보기" |
| S4 미션 상세 | 상단 틴트 영역(카테고리 `tint`, 높이 160px, 미션명 `title-lg`, 라벨 줄) → 인증 힌트 `card-base` → 추천 이유 `ai-card` → 같이 할래요 행(인원 `body-sm` + `button-secondary` 작은 높이 40px) / 하단 고정: "시작하기" 또는 "인증하기" |
| S5 인증 | 사진 영역 1:1, `rounded.lg`, 비어 있으면 `surface-sunken` + `camera` 아이콘 + "사진 추가" → 16px → `text-input` 소감(3줄, 우하단 "0/100" `caption`) → 공개 토글 행 / 하단 고정: "제출하기". 판정 중: 전체 오버레이 대신 버튼을 로딩 상태로. 결과: `ai-card`에 결과 문구 + 보상 시 `reward-badge` |
| S6 피드 | 게시물 `card-base`: 닉네임 `label` + 시각 `caption` → 사진 1:1 → 소감 `body-md` → 빠른 반응 칩 3개 → 댓글 목록(`body-sm`, 들여쓰기 없음) → 댓글 입력 1줄 |
| S7 기록 | 이번 주 달성률 `display` 숫자 + 막대(높이 8px, `primary`, 배경 `surface-sunken`) → 32px → 월간 캘린더(7열, 출석일 원 28px `accent-soft` 채움 + 숫자 `accent-ink`) → 32px → 이번 주 편지(F13, 아래 통합 예정 표) |
| S8 내 방 | 방 영역(5.4) → 16px → "가진 가구" `title-md` → 가구 그리드 4열(칸 72px, `card-base`, 가구 아이콘 32px + 이름 `caption`) |
| S9 설정 | `list-row` 목록. 닉네임 → 관심 카테고리 → 생활권 → 하루 가능 시간(오른쪽 `chevron-right`) → 하단 출처 `caption`. 도움 안내는 S10으로 옮긴다 |

통합 예정 화면·요소 (PRD F10~F16)

| 화면·위치 | 구조 |
| --- | --- |
| S3 성장 화분 (F11) | 연속 출석 줄 → 12px → `growth-card`: 왼쪽 단계 아이콘 48px, 오른쪽 문구 `title-md` → 8px → 진행 막대(높이 6px, `success`, 배경 `surface-sunken`) → 4px → 단계 이름 4개 `caption`(현재 단계만 `success` SemiBold). 그 아래 32px 뒤 "오늘의 미션" |
| S3 타임캡슐 도착 (F16) | 미션 목록 위 `card-base` 한 장: `mail` 아이콘 20px `accent` + 문구 `body-md` + `chevron-right` |
| S3 마음 우체통 카드 (F14) | 미션 영역 아래 → `card-base`: Feather `mail` 24px `accent` + "마음 우체통" `title-md` + 안 읽은 글이 있으면 "아직 읽지 않은 한 줄 {N}개가 있어요", 없으면 "한 줄을 주고받아 볼까요?" `caption` `steel` + `chevron-right`. 카드 전체가 터치 영역. 미션·릴레이와 독립 |
| S3 마음 우체통 수신함 (F14) | `bottom-sheet`: "마음 우체통" `title-md` → 받은 한 줄·보낸 한 줄 전환 버튼 → `list-row` 목록(본문 1줄 말줄임, 안 읽음은 `accent` 라벨, 읽음은 `steel`) → "한 줄 쓰기" `button-primary` → "닫기" `button-ghost`. 목록은 가상화하고 로딩·빈 상태·오류·다시 불러오기 제공. 본문은 `letter-card`에 "누군가가 보낸 한 줄" + 전체 글 + "목록으로". 작성자 정보·답장 기능 없음 |
| S3 마음 우체통 작성 (F14) | `bottom-sheet`: Feather `mail` 32px `accent` → 12px → 제목 "누군가에게 한 줄 보내볼까요?" `title-md` → 안내 `body-sm` → `text-input` 여러 줄(0/60) → "검수를 거친 뒤 다른 사람에게 전달돼요" `comment-pending` → `button-primary` "보내기" → `button-ghost` "우체통으로". 저장 후 `check-circle` + "한 줄을 맡겼어요" + 본문 `relay-item` + 실제 검수 상태 안내 + "우체통으로". 비공개 결과는 중립 문구, 위기 표현에는 `help-card`. 보낸 목록의 검수 대기 항목에는 "검수 다시 요청". 키보드 회피·스크롤·safe area 적용, 최대 폭 480px |
| S4 먼저 해낸 사람의 한 줄 (F10) | 같이 할래요 행 아래 32px → 제목 `title-md` → 8px → `relay-item` 최대 3개(간격 8px, 따옴표·닉네임 없음). 없으면 `caption` `steel` 한 줄 |
| S5 다음 사람에게 한 줄 (F10) | 판정 결과 `ai-card` 아래 24px → 제목 `title-md` → 8px → `text-input` 1줄(우하단 "0/60") → 하단 고정 버튼이 "남기기"로 바뀌고 그 위에 `button-ghost` "건너뛰기". 남긴 뒤 `comment-pending` 형태로 "약 {N}시간 뒤 다음 사람에게 보여요" |
| S7 이번 주 편지 (F13) | 월간 캘린더 아래 32px → `letter-card`: "이번 주 편지" `label` `steel`, 기분·한 줄·완료 미션 안내, `button-ghost` "이번 주 마음 리포트 보기". 통계 조회와 독립적으로 표시 |
| S3 한 줄 기록 메뉴 (F15) | 마음 우체통 아래 24px → `card-base`: Feather `edit-3`, "한 줄 기록", 안내 문구와 `chevron-right`. 누르면 S13으로 이동 |
| S13 한 줄 기록 (F15) | `BackHeader` "한 줄 기록" → "오늘 한 줄" `title-md` → 안내 `body-sm` → 기분 칩 5개(`chip-category` 모양, 아이콘 + 이름, 줄바꿈) → 선택 입력 `text-input`(0/60) → `button-primary` "저장하기". 기존 기록은 불러와 수정하고, 삭제는 화면 안 확인 후 실행. 로딩·저장 오류·재시도 표시 |
| S10 마음 휴게소 (F12) | 헤더 "마음 휴게소" `title-lg` → 8px → 안내 `body-sm` `slate` → 24px → `list-row` 3개(아이콘 24px + 이름 `body-md` + 설명 `caption` `steel`, 오른쪽 `chevron-right`): 외로움안녕120 `phone`(설명에 번호 120 표시), 서울마음편의점 `map-pin`, 청년마음건강 지원사업 `heart` → 32px → "배경음" `title-md` → `list-row`: `cloud-rain` + "빗소리 틀어 두기" + Switch → 켜져 있을 때만 볼륨 슬라이더(0~100%) |
| S11 주간 편지 (F13) | `BackHeader`와 KST 주차 → Gemini 원문 전송·보관 안내와 생성 버튼 → 실제 기분·한 줄·완료 미션 목록 → AI 편지는 `ai-card`, 기본 편지는 일반 카드 → 마음이 무거운 기록이 있으면 `help-soft`와 설정 안내 → 지난 3주 및 보관된 주차 목록과 이번 주 복귀. 현재 표시되는 원본과 과거 생성 편지의 시점 차이를 안내한다. |
| S12 타임캡슐 (F16) | `BackHeader` "타임캡슐" → `text-input` 3줄(우하단 "0/100") → 8px → 열리는 날 칩 3개(7일 뒤·30일 뒤·100일 뒤) → 하단 고정 "보내기" / 위쪽 목록: `list-row`(`lock` 아이콘 + 열리는 날짜, 열린 것은 `unlock` + 첫 줄) |

### 5.3 컴포넌트 구조

| 컴포넌트 | 구조 |
| --- | --- |
| `mission-card` | 1행: 카테고리 `label` · 소요 시간 `label` (`slate`) / 2행: 미션명 `title-md` (최대 2줄) / 3행(선택): `reward-badge` 다음 보상 / 우측 화살표 `chevron-right` 20px. 카드 전체가 터치 영역 |
| `ai-card` | 좌상단 "AI" `label`(`primary`) → 8px → 본문 `body-md`. AI가 만든 텍스트는 이 컴포넌트로만 표시 |
| `help-card` | 제목 `title-md` "이야기를 들어줄 곳이 있어요" → 8px → 설명 `body-sm` → 16px → `button-primary` "외로움안녕120 전화하기"(`phone` 아이콘, `tel:120`) |
| `reward-badge` | 아이콘 14px(`award`, `accent`) + 텍스트. 예: "스탠드 획득", "3일째" |
| `comment-pending` | `clock` 아이콘 14px + "약 {N}시간 뒤 공개돼요" |
| 판정 `retry` | `ai-card` 동일 형태, 아이콘 `rotate-ccw` `slate`. 빨간색 없음 |
| 판정 `pass` | `check-circle` 32px `success` + 응원 문구 |
| `growth-card` 단계 아이콘 (F11) | MaterialCommunityIcons 48px `success`. 0개 `pot-outline`(`muted`) → 1개 `sprout-outline` → 2개 `sprout` → 3개 `flower-tulip`(`accent`). 가구와 같은 아이콘 세트를 쓰되 내 방 슬롯에는 놓지 않는다 |
| 기분 칩 (F15) | Feather 18px + 이름: 마음이 가벼워요 `sun`, 조금 가벼워요 `sunrise`, 보통이에요 `cloud`, 조금 무거워요 `cloud-drizzle`, 마음이 무거워요 `cloud-rain`. 선택 시 `chip-category-selected`. 표정 아이콘·이모지는 쓰지 않는다 |
| `relay-item` | 본문만 `body-sm`. 작성자·시각을 표시하지 않는다 |

### 5.4 내 방

- 방 영역: 폭 = 컬럼 폭 − 40px, 높이 = 폭 × 0.85, `rounded.lg`, 벽(상단 60%) `room-wall`, 바닥(하단 40%) `room-floor`.
- 슬롯 중심 좌표(방 영역 기준 %, 64×64 박스를 중심 정렬):

| 슬롯 | x | y |
| --- | --- | --- |
| `wall-1` | 20% | 22% |
| `window` | 50% | 20% |
| `wall-2` | 80% | 22% |
| `desk` | 78% | 55% |
| `floor-1` | 28% | 80% |
| `floor-2` | 66% | 82% |

- 빈 슬롯: 점선 `room-slot` + `plus` 아이콘 16px `muted`. 배치된 슬롯: 테두리 없이 가구 아이콘 40px.
- 가구 표현: `@expo/vector-icons`의 MaterialCommunityIcons. UI 아이콘(Feather)과 구분해 가구에만 쓴다.

| 가구 id | 아이콘 이름 | 색 |
| --- | --- | --- |
| `plant` | `sprout` | `success` |
| `lamp` | `lamp` | `accent` |
| `sofa` | `sofa` | `primary` |
| `shoe_rack` | `shoe-sneaker` | `slate` |
| `clock` | `clock-outline` | `ink` |
| `poster` | `image-frame` | `accent-ink` |

## 6. 인터랙션

| 대상 | 동작 | 값 |
| --- | --- | --- |
| 모든 터치 요소 | 눌림 | opacity 0.85, scale 0.98, 100ms |
| 버튼 (웹 hover) | 배경 변경 | `primary` → `primary-pressed`, 150ms ease |
| 카드 (웹 hover) | 테두리 변경 | `hairline` → `hairline-strong`, 150ms, `cursor: pointer` |
| 포커스 (웹 키보드) | 외곽선 | 2px `primary`, offset 2px |
| 스택 화면 전환 | 기본값 | Expo Router Stack 기본(네이티브 슬라이드, 웹 즉시 전환) |
| 탭 전환 | 없음 | 애니메이션 없음 |
| 바텀 시트 열림 | 아래에서 위로 | translateY 100% → 0, 250ms ease-out, 뒤 배경 rgba(0,0,0,0.3) |
| AI 로딩 (미션 추천) | 스켈레톤 | `primary-soft` 카드 3개, opacity 0.5 ↔ 1, 1200ms 반복 + "미션을 고르고 있어요" `caption` |
| AI 로딩 (인증 판정) | 버튼 로딩 | 버튼 텍스트 → ActivityIndicator(`on-primary`), 비활성 |
| 인증 통과 | 아이콘 등장 | `check-circle` scale 0.6 → 1, spring(damping 15, stiffness 200) |
| 보상 획득 | 뱃지 등장 | opacity 0 → 1, translateY 8px → 0, 200ms ease-out, 통과 아이콘 후 150ms 지연 |
| 가구 배치 | 아이콘 등장 | scale 0.8 → 1, spring(damping 12) |
| 성장 화분 단계 상승 (F11) | 아이콘 교체 | 이전 아이콘 opacity 1 → 0(120ms) 후 새 아이콘 scale 0.6 → 1, spring(damping 12, stiffness 180). 진행 막대 너비 250ms ease-out. 홈 진입 시 한 번만 |
| 마음 우체통 (F14) | 바텀 시트 | 위 '바텀 시트 열림'과 같다 |
| 릴레이 남기기 완료 (F10) | 문구 교체 | 입력 영역 opacity 1 → 0, 대기 문구 opacity 0 → 1, 각 150ms |
| 햅틱 (네이티브만) | 인증 통과, 보상 획득 | `expo-haptics` `notificationAsync(Success)` |
| 동작 줄이기 설정 | 대체 | `AccessibilityInfo.isReduceMotionEnabled()` 참이면 모든 모션을 opacity 150ms로 대체 |

구현: `react-native-reanimated`. 위 표에 없는 모션은 추가하지 않는다.

## 7. 레퍼런스

| 출처 | 가져온 특성 | 가져오지 않은 특성 |
| --- | --- | --- |
| Notion ([awesome-design-md](https://github.com/VoltAgent/awesome-design-md) DESIGN.md) | 웜 뉴트럴 배경, 파스텔 틴트 카드, 헤어라인 우선, 사각 버튼(pill 미사용), frontmatter 토큰 구조 | 네이비 히어로 밴드, 보라 primary, 장식 일러스트 |
| 싸이월드 미니홈피 | '방 꾸미기'로 보상을 모으는 구조, 고정 슬롯 배치 | 픽셀 아트, 자동 재생 배경음악, 일촌·방명록 |
| 동료 프로토타입 ([sesac-hackathon-seoul-challenge](https://github.com/lilill16171df/sesac-hackathon-seoul-challenge)) | 응원 릴레이·성장 화분·마음 휴게소·주간 편지·우체통·한 줄 기록·타임캡슐의 경험 구성, 사용자가 켜는 빗소리 | 세이지 그린 팔레트, 이모지 아이콘, 포인트 구매, 화면 가운데 팝업 |
| Pretendard | 한글·영문 균형, 웹·앱 공통 서체 | — |

## 8. 금지사항

| 금지 | 이유 / 대체 |
| --- | --- |
| 토큰 외 HEX·px 하드코딩 | 일관성. `theme.ts`의 토큰만 참조 |
| 두 번째 서체, Pretendard 외 굵기(Light, ExtraBold 등) | 4.1의 3개 굵기만 |
| `primary`·`accent`를 넓은 면 배경으로 사용 | 강조 10% 초과. 넓은 면은 `primary-soft`·`accent-soft` |
| `accent` #f08a3e를 텍스트 색으로 사용 | 대비 부족. `accent-ink` 사용 |
| 실패·미완료·위기에 빨간색, 경고 아이콘(`alert-triangle`) | 부정적 신호 회피. 무채색 또는 `help-soft` |
| pill 모양 버튼 | pill은 칩·뱃지 전용 |
| 그라데이션, 글래스모피즘, 네온·형광색 | 웜 미니멀과 충돌 |
| 캐릭터·마스코트, 이모지 | 유치함 회피, OS마다 모양이 달라짐. 아이콘은 Feather(UI)와 MaterialCommunityIcons(가구)만 |
| 미션 카드에 그림자·테두리 | 틴트 면만으로 구분 |
| 화면당 주요 버튼 2개 이상 | 하나의 행동만 강조 |
| 6절에 없는 애니메이션(바운스, 파티클, 컨페티) | 차분함 유지 |
| 순백 #ffffff 화면 배경, 순흑 #000000 텍스트 | `canvas`, `ink` 사용 |
| 소리 자동 재생, 앱 시작 시 소리 | 사용자가 휴게소에서 켤 때만 재생(F12) |
| 화면 가운데 모달 팝업 | 확인·안내는 화면 안 문구 또는 `bottom-sheet`. 웹에서 `Alert.alert`는 표시되지 않는다 |
