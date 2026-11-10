# Design

## Context

공통 검수는 `supabase/functions/_shared/moderation.ts`의 `moderate(body)` 하나다. 지금 순서는 `filterModerationText`(연락처·개인정보 정규식 마스킹) → `generateJson`(tier `light`, 10초) → AI가 `approved`인데 `hasContact`면 `rejected`. AI가 실패하면 `null`을 돌려주고 호출한 쪽(`moderate-comment`, `mailbox`)이 `pending`으로 둔다. `moderate-comment`는 응답에 `judged_by: 'ai'`를 넣고, 앱의 `JudgedBy` 타입은 이미 `'ai' | 'rule'`이다.

`_shared/copy.ts`의 `BannedWords`는 AI가 만든 문구 검사용이라 이번 사전과 섞지 않는다.

## Goals / Non-Goals

**Goals:**
- 욕설 판정을 AI 앞의 결정적 규칙으로 옮겨, AI 장애·오판과 상관없이 명백한 욕설을 거절한다.
- 호출 쪽(`moderate-comment`, `mailbox`)과 앱 코드는 거의 바꾸지 않는다.

**Non-Goals:**
- 비방·조롱의 규칙 판정. 문맥이 필요하므로 AI 프롬프트 강화로만 다룬다.
- 형태소 분석기 등 새 의존성.

## Decisions

### 1. 새 모듈 `_shared/moderation-profanity.ts`
`normalizeForProfanity(text)`, `hasProfanity(text)`, `hasCrisisHint(text)`를 둔다. `moderation-privacy.ts`는 AI에 보내기 전 마스킹 전용이라 판정 로직을 섞지 않는다.
- 대안: `moderation.ts`에 직접 넣기 → 사전이 길어 검수 흐름이 묻히고 테스트 대상이 커진다.

### 2. 정규화 순서
1) `NFKC`(전각·호환 문자) → 2) 소문자화 → 3) 한글 완성형·자모 외 문자(공백, 숫자, 특수문자, 영문)를 지운 "압축본" 생성.
- 완성형 사전: 압축본에 대한 정규식. 숫자·공백·특수문자 끼우기는 3)에서 이미 사라지므로 음절 변형만 나열한다(예: `[시씨쒸쓔][발빨벌뻘]`, `병[신싄딱]`, `좆`, `개[새세]끼` 등).
- 초성 사전: 원문을 1)~2)만 거친 뒤 자모 사이 공백·특수문자를 지운 문자열에서 연속 자모(`ㅅㅂ`, `ㅆㅂ`, `ㅂㅅ`, `ㅈㄹ`, `ㅄ` 등)만 본다.
- 완성형을 초성으로 바꿔 대조하지 않는다. "사부님"→`ㅅㅂㄴ`처럼 일상어 오탐이 크다.
- 대안: 외부 비속어 라이브러리 → Deno 호환성·유지보수 불확실, 사전을 팀이 통제하기 어렵다.

### 3. 허용 목록은 "제거 후 재검사"
허용어(`시발점`, `시발역`, `자살골`, `수박씨발라`, `씨발라먹` 등)를 압축본에서 먼저 지우고 나서 사전을 대조한다. 허용어 안의 욕설 조각만 빠지고, 같은 글에 따로 쓴 욕설은 그대로 걸린다.
- 대안: 허용어가 있으면 통과 → "시발점 시발" 같은 우회가 생긴다.

### 4. `moderate()` 흐름
```
profane = hasProfanity(body)
filtered = filterModerationText(body)
ai = generateJson(...)                      // 기존. 욕설이 있어도 부른다
if (!ai) return profane && !hasCrisisHint(body) ? { status: 'rejected', judgedBy: 'rule' } : null
status = ai.status === 'approved' && (filtered.hasContact || profane) ? 'rejected' : ai.status
return { status, judgedBy: 'ai' }
```
- 반환 타입을 `{ status, judgedBy } | null`로 바꾼다. `moderate-comment`는 `judged_by`에 그대로 쓰고, `mailbox`는 `status`만 쓴다.
- 욕설 글도 AI를 먼저 부른다. 처음에는 위기 힌트가 없는 욕설 글을 AI 없이 거절했으나, "병신같은 나 죽어야지", "ㅅㅂ 살 이유가 없어"처럼 힌트 목록에 없는 위기 표현이 도움 안내 없이 거절되는 문제가 리뷰에서 나왔다. 키워드 목록으로는 위기 표현을 다 덮을 수 없으므로 위기 판정은 늘 AI가 한다. 대가는 욕설 글 한 건당 AI 호출 한 번이다.
- 욕설 글은 AI가 `approved`로 봐도 `profane`이라 거절된다(위기면 위기 유지).
- `hasCrisisHint`는 분류가 아니라 "AI를 쓸 수 없을 때 규칙 거절을 보류할지"만 정한다. 키워드: `죽고 싶`, `죽고싶`, `자살`(허용어 제거 후), `자해`, `끝내고 싶`, `사라지고 싶`, `살기 싫` 등. 넓게 잡아도 결과는 AI 판정으로 넘어가는 것뿐이라 오탐 비용이 낮다.

### 5. AI 기준 문구 강화
`ModerationSystem`의 rejected 줄을 spec 분류와 같게 넓히고 "crisis가 아닌 글이 rejected에 해당하는지 애매하면 rejected"를 넣는다. 위기가 애매한 글이 거절로 밀리지 않도록 범위를 crisis가 아닌 글로 한정한다. crisis 우선 문장은 유지한다.

## Risks / Trade-offs

- [사전 누락으로 새 변형 욕설이 통과] → AI가 2차로 막는다. 사전은 테스트 표와 함께 늘린다.
- [허용 목록 밖 일상어 오탐(예: 지명·인명)] → 오탐 사례를 테스트 표에 넣고 허용 목록에 추가. 오탐은 거절일 뿐 위기 경로에는 영향 없음(위기 힌트 우선).
- ["애매하면 거절"로 응원 글 거절 증가] → 기존 응원 Scenario를 회귀 테스트로 유지. 운영에서 거절률이 눈에 띄게 오르면 문구를 조정한다.
- [사전이 코드에 평문으로 들어감] → 서버 전용 Edge Function 코드라 앱 번들에 실리지 않는다.

## Migration Plan

DB 변경 없음. `moderate-comment`, `mailbox`만 다시 배포한다(사람이 요청할 때). 되돌릴 때는 이전 커밋으로 두 함수를 재배포한다.
