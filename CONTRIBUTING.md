# 함께 작업하기

처음 합류했다면 1 → 2 → 3 순서로 진행한 뒤 [docs/ROADMAP.md](./docs/ROADMAP.md)에서 작업을 하나 가져간다.

| 문서 | 내용 |
| --- | --- |
| [docs/PRD.md](./docs/PRD.md) | 기능·데이터·문구 명세. 무엇을 만들지의 기준 |
| [DESIGN.md](./DESIGN.md) | 색·글꼴·화면 구조·애니메이션. 어떻게 보일지의 기준 |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | 통합 작업 목록, 담당, 완료 기준 |
| [AGENTS.md](./AGENTS.md) | AI 코딩 도구에 주는 규칙(사람에게도 같은 규칙) |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 폴더 지도, 주요 흐름, 화면별 구현 상태 |
| [docs/ENV.md](./docs/ENV.md) | 환경 변수·시크릿·운영 설정값, 전달할 권한과 점검표 |

## 1. 접근 권한 받기

저장소 관리자에게 아래 세 가지를 요청한다.

| 대상 | 필요한 이유 | 요청 내용 |
| --- | --- | --- |
| GitHub `koolunkle/seoul-challenge` | 브랜치 push, PR | Collaborator 초대 (Write) |
| Supabase 프로젝트 `seoul-challenge` | 마이그레이션 적용, 함수 배포, 로그 확인 | 조직 멤버 초대 (Developer) |
| Expo 프로젝트 `@koolunkle/seoul-challenge` | 미리보기 배포 | 프로젝트 멤버 추가 |

AI API 키(Gemini, Anthropic)는 Supabase 함수 환경 변수에만 있다. 개인 PC나 저장소, 메신저로 받지 않는다. DB 작업을 맡으면 DB 비밀번호를 추가로 받는다. 무엇을 받고 무엇을 받지 않는지는 [docs/ENV.md](./docs/ENV.md) D절.

## 2. 내 PC에서 실행하기

필요: Node.js 22, Git, (휴대폰 확인 시) Expo Go 앱.

```bash
git clone https://github.com/koolunkle/seoul-challenge.git
cd seoul-challenge
npm install
cp .env.example .env.local
npm run web        # 브라우저에서 확인
npm start          # QR 코드를 Expo Go로 찍어 휴대폰에서 확인
```

`.env.example`에는 publishable 키가 이미 들어 있다. 이 키는 공개용(배포된 웹에도 포함)이라 그대로 써도 된다. service_role·secret 키는 어디에도 넣지 않는다.

로컬 앱도 운영 DB에 연결된다. 테스트하며 만든 익명 계정과 사진은 작업이 끝나면 지운다(5절).

## 3. 작업 흐름

1. [docs/ROADMAP.md](./docs/ROADMAP.md)에서 `대기` 작업을 골라 담당에 이름을, 상태에 `진행`을 적고 main에 바로 커밋한다(`docs: T4 담당 지정`).
2. main에서 작업 브랜치를 만든다. 이름은 ROADMAP의 브랜치 칸 그대로(`feat/t4-growth-plant`).
3. 명세와 다르게 만들어야 하면 **코드보다 docs/PRD.md·DESIGN.md를 먼저 고친다**. 같은 PR에 넣는다.
4. 구현 → 검사 → 미리보기 배포 → PR.
5. 리뷰어 1명 승인 후 작성자가 합친다(Squash and merge). ROADMAP 상태를 `완료`로 바꾼다.
6. 운영 배포(`--prod`)는 관리자가 합친 뒤에 한다.

### 검사 (PR 전에 반드시)

```bash
npm run typecheck
npm run lint
```

### 미리보기 배포 (운영과 분리된 주소)

```bash
npx expo export -p web
npx eas-cli@latest deploy          # --prod 없이. 출력된 미리보기 URL을 PR에 붙인다
```

## 4. 커밋·PR 규칙

커밋 제목은 Conventional Commits 형식에 한국어로 쓴다. 본문이 필요하면 `-` 불릿으로 나열한다. `Co-Authored-By`, `Session` 같은 줄은 넣지 않는다.

```
feat(app): 홈에 성장 화분 추가

- 오늘 완료한 일일 미션 수로 화분 단계 계산
- 단계가 오를 때 한 번 성장 동작, 동작 줄이기 설정 시 opacity로 대체
```

| 타입 | 쓰임 | scope 예 |
| --- | --- | --- |
| `feat` | 기능 추가 | `app`, `db`, `functions` |
| `fix` | 버그 수정 | 위와 같음 |
| `docs` | 문서만 변경 | 생략 |
| `chore` | 설정·도구·배포 | `deploy` |
| `refactor` | 동작 변화 없는 구조 변경 | 위와 같음 |

PR 본문 체크리스트:

- [ ] ROADMAP 작업 ID와 완료 기준을 적고, 기준을 어떻게 확인했는지 적었다
- [ ] 명세가 바뀌었다면 docs/PRD.md·DESIGN.md를 같이 고쳤다
- [ ] `npm run typecheck`, `npm run lint` 통과
- [ ] 미리보기 URL에서 웹 동작 확인, 가능하면 Expo Go에서도 확인
- [ ] DB 변경이 있으면 마이그레이션 파일과 `src/types/database.ts`를 함께 올렸다
- [ ] 동료 프로토타입에서 가져온 기능이면 PR 본문에 출처를 적었다

## 5. 코드 규칙 요약

- **Expo SDK 58.** API가 자주 바뀐다. 기억에 의존하지 말고 문서를 확인한다: <https://docs.expo.dev/versions/v58.0.0/>. 패키지는 `npx expo install <이름>`으로만 설치한다.
- **import 경로:** `Stack` ← `expo-router/stack`, `Tabs` ← `expo-router/js-tabs`, `Link` ← `expo-router/link`, `Redirect`·`router`·`useLocalSearchParams` ← `expo-router`.
- **폴더:** 라우트는 `src/app/`(파일 하나가 화면 하나), 화면 본문은 `src/screens/`, 공용 UI는 `src/components/`, 훅은 `src/hooks/`, 상수는 `src/constants/`.
- **디자인:** 색·크기는 `src/constants/theme.ts` 토큰만 쓴다(DESIGN.md와 같은 값). 아이콘은 Feather(UI)와 MaterialCommunityIcons(가구·화분)만. 이모지 금지.
- **문구:** PRD §7. 사용자에게 보이는 곳에 '외로움·고립·우울·상담·실패'를 쓰지 않는다(휴게소의 기관명 '외로움안녕120'만 예외). 해요체·제안형.
- **웹 호환:** 필수 기능은 웹에서 동작해야 한다. `Alert.alert`는 웹에서 뜨지 않으니 화면 안 문구나 바텀 시트로 안내한다.
- **AI:** 앱에서 AI API를 직접 부르지 않는다. 서버 함수 `supabase/functions/_shared/ai.ts`의 `generateJson`만 쓰고, 실패 시 대체 동작을 반드시 둔다(PRD §8.2).
- AI 도구가 만든 코드는 담당자가 직접 읽고 실행해 확인한 뒤 올린다.

## 6. DB·서버 함수 변경

DB는 운영 프로젝트 하나를 함께 쓴다. 마이그레이션은 바로 운영에 반영되므로 PR 리뷰 후에 적용한다.

처음 한 번:

```bash
npx supabase login
npx supabase link --project-ref jpipzrmspryzvjykxefm   # DB 비밀번호는 관리자에게 받는다
npx supabase migration list                             # 로컬 파일과 원격 기록이 모두 짝지어져야 한다
```

마이그레이션:

```bash
npx supabase migration new relay_messages               # supabase/migrations/<타임스탬프>_relay_messages.sql 생성
# SQL 작성 → PR 리뷰 → 승인 후
npx supabase db push
npx supabase gen types typescript --project-id jpipzrmspryzvjykxefm > src/types/database.ts
```

- 새 테이블에는 RLS를 켜고 정책을 같은 파일에 쓴다. 클라이언트가 바꾸면 안 되는 컬럼은 컬럼 단위 권한으로 막는다(기존 `profiles` 참고).
- 적용 후 Supabase 대시보드 Advisors에서 새 보안 경고가 없는지 확인한다.
- 이미 적용된 마이그레이션 파일은 고치지 않는다. 바꿀 내용은 새 파일로 만든다.

서버 함수:

```bash
npx supabase functions deploy moderate-comment --project-ref jpipzrmspryzvjykxefm
```

실행 로그는 Supabase 대시보드 Edge Functions → 함수 → Logs에서 본다. AI 실패 원인은 `ai error` 줄에 남는다.

- 함수는 `_shared/`를 함께 배포한다. `_shared/ai.ts`를 고쳤다면 이를 쓰는 함수(`recommend-missions`, `verify-mission`, `moderate-comment`, 이후 `write-weekly-letter`)를 모두 다시 배포한다.
- 환경 변수를 바꾼 뒤에도 함수를 다시 배포해야 반영된다.

## 7. 테스트 데이터와 시연 모드

- 테스트는 익명 계정으로 한다. 브라우저 시크릿 창을 쓰면 계정이 섞이지 않는다.
- 끝나면 Supabase 대시보드 Authentication에서 그 계정을 지운다(관련 행은 함께 지워진다). 사진은 Storage `verifications` 버킷의 같은 사용자 폴더를 지운다.
- 저작권이 있는 이미지(만화·캐릭터·남의 사진)는 피드에 공개로 올리지 않는다.
- 댓글·릴레이 공개를 1분으로 줄이려면 SQL Editor에서 `select public.set_demo_mode(true);`. 끝나면 `false`로 되돌린다.
