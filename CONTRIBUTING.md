# 함께 작업하기

처음 합류했다면 1 → 2 → 3 순서로 진행한다. 문서 목록과 각 문서가 답하는 질문은 [README.md](./README.md#문서)에 있다.

## 1. 접근 권한 받기

저장소 관리자에게 아래 세 가지를 요청한다.

| 대상 | 필요한 이유 | 요청 내용 |
| --- | --- | --- |
| GitHub `koolunkle/maru` | 브랜치 push, PR | Collaborator 초대 (Write) |
| Supabase 프로젝트 `seoul-challenge` | 마이그레이션 적용, 함수 배포, 로그 확인 | 조직 멤버 초대 (Developer) |
| Expo 조직 `koolunkles-team` | 미리보기 배포 | 조직 멤버 초대 (Developer) |

DB 작업(`supabase link`·`db push`)을 맡으면 DB 비밀번호를 추가로 받는다. 비밀번호 관리자나 1회성 비밀 링크로 받고, 메신저로 받지 않는다.

**받지 않는 것**

- `service_role` / `sb_secret_…` 키 — 함수에 자동으로 들어가므로 사람이 가질 이유가 없다.
- AI API 키(Gemini, Anthropic) — Supabase 함수 시크릿에만 있다. 개인 PC·저장소·메신저로 받지 않는다. 함수를 내 PC에서 돌려야 하면 관리자에게 개인 키 발급을 요청한다.

**DB 비밀번호는 파일로 저장하지 않는다.** `.env.local`에 넣지 않는다(앱은 쓰지 않고, 번들에 들어갈 수 있다). Supabase CLI가 물어볼 때만 입력한다. 화면 작업만 한다면 필요 없다.

**각자 하는 로그인**

```bash
npx supabase login                                       # 개인 계정으로 로그인
npx supabase link --project-ref jpipzrmspryzvjykxefm     # DB 작업자만. DB 비밀번호 입력
npx eas-cli@latest login                                 # 미리보기 배포할 사람만
```

시크릿·운영 설정값·Vault의 목록과 바꾸는 방법은 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 9절.

## 2. 내 PC에서 실행하기

필요: Node.js 22, Git, (휴대폰 확인 시) Expo Go 앱, (시드를 다시 만들 때) Python 3.

```bash
git clone https://github.com/koolunkle/maru.git
cd maru
npm install
cp .env.example .env.local
npm run web        # 브라우저에서 확인
npm start          # QR 코드를 Expo Go로 찍어 휴대폰에서 확인
```

`.env.example`에는 publishable 키가 이미 들어 있다. 이 키는 공개용(배포된 웹에도 포함)이라 그대로 써도 된다. service_role·secret 키는 어디에도 넣지 않는다.

로컬 앱도 운영 DB에 연결된다. 테스트하며 만든 익명 계정과 사진은 작업이 끝나면 지운다(7절).

점검표:

- [ ] `npm run web`으로 시작 화면이 뜨고 '시작하기' → 온보딩까지 진행된다
- [ ] `npm run typecheck`, `npm run lint`, `npm run spec:validate` 통과
- [ ] (DB·함수 담당) Supabase 초대 수락, `supabase login`·`link` 후 `npx supabase migration list`에서 로컬·원격 짝이 맞다
- [ ] (배포 담당) Expo 조직 초대 수락, `npx eas-cli@latest login`

## 3. 작업 흐름 (OpenSpec)

### 3.1 change가 필요한 작업인지 고르기

| 작업 | 할 일 |
| --- | --- |
| 사용자가 겪는 동작이 바뀐다(기능 추가·변경·삭제, 문구·규칙 변경) | **change를 만든다.** 아래 3.2 |
| spec대로 동작하지 않는 버그를 고친다 | change 없이 GitHub Issue → PR. PR 본문에 어긴 spec과 Requirement 이름을 적는다 |
| 리팩터링·도구·문서·운영 준비처럼 동작이 그대로다 | change 없이 PR. 묶어서 관리할 만큼 크면 `skip_specs: true` change로 만든다(예: `prepare-demo-rehearsal`) |

spec이 틀렸다는 걸 발견했는데 지금 동작이 맞다면, 그것도 동작 변경과 같이 change로 spec을 고친다. 코드와 spec이 다른 상태로 PR을 합치지 않는다.

### 3.2 change 한 사이클

OpenSpec CLI는 개발 의존성으로 들어 있다(`npm run spec -- <명령>`). Claude Code의 `/opsx:*` 명령은 터미널에서 `openspec`을 바로 부르므로, 쓰려면 한 번 `npm i -g @fission-ai/openspec@1.16.0`을 한다.

1. **제안**: main에서 브랜치를 만들고(`feat/add-mission-share`처럼 change 이름 그대로. `develop`으로 보낼 작업이면 `develop`에서, 3.3) `/opsx:propose "하고 싶은 것"`을 실행하거나 `npm run spec -- new change <이름>`으로 폴더를 만든다. `openspec/changes/<이름>/`에 아래를 쓴다.
   - `proposal.md` — 이 작업의 PRD. 왜(PRODUCT의 어느 문제·페르소나), 무엇이 바뀌나, 하지 않는 것, 영향(DB·함수·운영 설정)
   - `specs/<capability>/spec.md` — 기존 spec과의 차이. `## ADDED` / `## MODIFIED`(바뀐 Requirement 전체) / `## REMOVED`(이유 포함) Requirements
   - `design.md` — 기술 결정이 있을 때만(테이블·RLS·함수, 고른 방법과 버린 방법)
   - `tasks.md` — 체크리스트. 마지막 그룹은 검증
2. **제안 리뷰**: `npm run spec:validate`를 통과시킨 뒤 제안 문서만으로 PR(draft)을 열어 방향을 먼저 맞춘다. 작은 변경이면 구현까지 한 PR에 넣어도 된다.
3. **구현**: `/opsx:apply`로 `tasks.md`를 하나씩 체크하며 구현한다. 하다가 범위가 바뀌면 코드보다 change 문서를 먼저 고친다(`/opsx:update`).
4. **검사 → 미리보기 배포 → PR**: 아래 검사와 미리보기 배포. PR 본문에 change 이름과 각 Scenario를 어떻게 확인했는지 적는다.
5. **합치기**: 리뷰어 1명 승인 후 작성자가 합친다(Squash and merge. 단 `develop` → main은 3.3). 합치기 전에 같은 PR에서 `/opsx:archive`(또는 `npm run spec -- archive <이름>`)로 change를 `changes/archive/`로 옮긴다. 이때 차이가 `openspec/specs/`에 합쳐져, main의 spec이 늘 지금 동작과 같다.
6. 운영 반영(웹·함수·마이그레이션)은 관리자가 main에 합쳐진 코드로 한다(3.4).

진행 중인 작업과 남은 할 일은 `npm run spec -- list`로 본다. 담당자는 change 폴더의 PR 작성자다.

### 3.3 브랜치: main과 develop

| 브랜치 | 쓰임 |
| --- | --- |
| `main` | 운영과 같은 코드. 대부분의 PR은 여기로 보낸다. spec(`openspec/specs/`)도 main이 기준이다 |
| `develop` | 여러 PR을 모아 먼저 맞춰 볼 큰 작업용 통합 브랜치(예: 기준 사진 판정). 필요한 작업만 여기로 보낸다 |

- `develop`으로 보낼 작업은 최신 `develop`에서 브랜치를 만들고, PR의 base를 `develop`으로 연다.
- main에 새 PR이 합쳐지면 `develop`에도 main을 합쳐 따라오게 한다(`git switch develop && git merge origin/main`, PR 또는 관리자).
- `develop` → main은 PR로 올리고 **"Create a merge commit"으로 합친다.** squash로 합치면 `develop`과 main의 이력이 어긋나 다음에 충돌이 난다. squash를 썼다면 합친 직후 `develop`을 main으로 다시 맞춘다.
- `develop`은 GitHub 보호 규칙으로 삭제·강제 push를 막아 둔다. 저장소가 머지한 브랜치를 자동으로 지우게 되어 있어, 보호하지 않으면 develop → main을 합칠 때 `develop`도 지워진다. 보호 규칙을 풀지 않는다.
- `develop`에서는 운영에 배포하지 않는다(3.4). 백엔드가 운영 하나뿐이라 `develop`을 따로 시험할 서버 환경은 없다. 서버를 바꾸는 작업은 미리보기 웹과 테스트로 확인하고, 운영 반영은 main에 들어간 뒤에 한다.

### 3.4 운영 반영 규칙

운영 웹, 서버 함수, DB는 모두 하나를 함께 쓴다. 누군가 자기 작업본으로 배포하면 다른 사람이 배포한 코드를 덮어쓴다.

- **운영 반영은 관리자만, main에 합쳐진 코드로만 한다.** 반영 전에 `git switch main && git pull`로 최신 main인지 확인하고, 커밋하지 않은 변경이 없어야 한다(`git status`).
- 대상은 세 가지다: 웹(`eas deploy --prod`), 서버 함수(`supabase functions deploy`), 마이그레이션(`supabase db push`).
- 함수는 바뀐 것만 이름을 붙여 배포한다. 이름 없이 `supabase functions deploy`를 실행하면 모든 함수가 내 작업본으로 바뀐다.
- `admin-missions`만 `--no-verify-jwt`를 붙여 배포한다. 빼면 관리자 화면이 막힌다. 다른 함수에는 붙이지 않는다(`docs/ADMIN.md`).
- 반영 순서는 DB → 함수 → 웹이다. 앞 단계가 없으면 뒤 단계가 실패한다.
- PR 본문에 합친 뒤 할 운영 반영(명령과 순서)을 적고, 관리자는 반영한 뒤 PR에 "반영함" 댓글을 남긴다.
- 개인 작업 확인은 미리보기 웹(`eas deploy`, `--prod` 없이)으로 한다. 서버 함수는 개인 확인용으로 운영에 배포하지 않는다.

### 검사 (PR 전에 반드시)

```bash
npm run typecheck
npm run lint          # 코드 규칙 + 포맷(Prettier). 포맷 오류는 npm run format으로 고친다
npm test
```

포맷은 Prettier가 정한다(작은따옴표, 줄 100자, `.prettierrc.json`). VS Code는 저장할 때 자동으로 맞춘다(추천 확장 설치). 문서(`*.md`)·생성 파일·마이그레이션은 포맷하지 않는다(`.prettierignore`).

### 미리보기 배포 (운영과 분리된 주소)

```bash
npx eas-cli@latest login           # 처음 한 번. Expo 조직 초대를 수락한 계정으로
npx expo export -p web
npx eas-cli@latest deploy          # --prod 없이. 출력된 미리보기 URL을 PR에 붙인다
```

- 운영 배포(`--prod`)는 관리자만 main에서 한다(3.4). PR을 합쳐도 운영 주소는 바뀌지 않으니, 합친 뒤 아래를 실행한다.

```bash
git switch main && git pull && npm install
npx expo export -p web
npx eas-cli@latest deploy --prod   # 운영 URL(seoul-challenge.expo.app)이 바로 바뀐다
```

- `app.json`의 `owner`·`extra.eas.projectId`는 바꾸지 않는다. 각자 Expo 프로젝트를 새로 만들어 연결하지 않는다. 배포 권한 오류가 나면 관리자에게 알린다.

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

- [ ] change 이름(또는 고친 spec의 Requirement)을 적고, 각 Scenario를 어떻게 확인했는지 적었다
- [ ] 동작이 바뀌었다면 change를 archive해서 `openspec/specs/`가 바뀐 동작과 같다. 화면 모양이 바뀌었다면 DESIGN.md도 고쳤다
- [ ] `npm run spec:validate` 통과
- [ ] 테이블·함수·폴더가 바뀌었다면 docs/ARCHITECTURE.md를 고쳤다
- [ ] `npm run typecheck`, `npm run lint`(포맷 포함), `npm test` 통과
- [ ] 미리보기 URL에서 웹 동작 확인, 가능하면 Expo Go에서도 확인
- [ ] DB 변경이 있으면 마이그레이션 파일과 `src/types/database.ts`를 함께 올렸다
- [ ] 동료 프로토타입에서 가져온 기능이면 PR 본문에 출처를 적었다

## 5. 코드 규칙 요약

- **Expo SDK 58.** API가 자주 바뀐다. 기억에 의존하지 말고 문서를 확인한다: <https://docs.expo.dev/versions/v58.0.0/>. 패키지는 `npx expo install <이름>`으로만 설치한다.
- **import 경로:** `Stack` ← `expo-router/stack`, `Tabs` ← `expo-router/js-tabs`, `Link` ← `expo-router/link`, `Redirect`·`router`·`useLocalSearchParams` ← `expo-router`.
- **폴더:** 라우트는 `src/app/`(파일 하나가 화면 하나), 화면 본문은 `src/screens/`, 공용 UI는 `src/components/`, 훅은 `src/hooks/`, 상수는 `src/constants/`.
- **디자인:** 색·크기는 `src/constants/theme.ts` 토큰만 쓴다(DESIGN.md와 같은 값). 아이콘은 Feather(UI)와 MaterialCommunityIcons(가구·화분)만. 이모지 금지.
- **문구:** spec `copy-guidelines`. 사용자에게 보이는 곳에 '외로움·고립·우울·상담·실패'를 쓰지 않는다(휴게소의 기관명 '외로움안녕120'만 예외). 해요체·제안형.
- **웹 호환:** 필수 기능은 웹에서 동작해야 한다. `Alert.alert`는 웹에서 뜨지 않으니 화면 안 문구나 바텀 시트로 안내한다.
- **AI:** 앱에서 AI API를 직접 부르지 않는다. 서버 함수 `supabase/functions/_shared/ai.ts`의 `generateJson`만 쓰고, 실패 시 대체 동작을 반드시 둔다(각 spec의 'AI를 쓸 수 없을 때' Requirement).
- AI 도구가 만든 코드는 담당자가 직접 읽고 실행해 확인한 뒤 올린다.

## 6. DB·서버 함수 변경

DB는 운영 프로젝트 하나를 함께 쓴다. 마이그레이션과 함수 배포는 바로 운영에 반영되므로, PR이 main에 합쳐진 뒤 관리자가 적용한다(3.4).

처음 한 번:

```bash
npx supabase login
npx supabase link --project-ref jpipzrmspryzvjykxefm   # DB 비밀번호는 관리자에게 받는다
npx supabase migration list                             # 로컬 파일과 원격 기록이 모두 짝지어져야 한다
```

마이그레이션:

```bash
npx supabase migration new relay_messages               # supabase/migrations/<타임스탬프>_relay_messages.sql 생성
# SQL 작성 → PR 리뷰 → main에 합친 뒤 관리자가(3.4)
npx supabase db push
npx supabase gen types typescript --project-id jpipzrmspryzvjykxefm > src/types/database.ts
```

- 새 테이블에는 RLS를 켜고 정책을 같은 파일에 쓴다. 클라이언트가 바꾸면 안 되는 컬럼은 컬럼 단위 권한으로 막는다(기존 `profiles` 참고).
- 적용 후 Supabase 대시보드 Advisors에서 새 보안 경고가 없는지 확인한다.
- 이미 적용된 마이그레이션 파일은 고치지 않는다. 바꿀 내용은 새 파일로 만든다.

서버 함수(관리자, 최신 main에서):

```bash
npx supabase functions deploy moderate-comment --project-ref jpipzrmspryzvjykxefm   # 바뀐 함수만 이름을 붙여서
npx supabase functions deploy admin-missions --project-ref jpipzrmspryzvjykxefm --no-verify-jwt   # 이 함수만 예외
```

실행 로그는 Supabase 대시보드 Edge Functions → 함수 → Logs에서 본다. AI 실패 원인은 `ai error` 줄에 남는다.

- 함수는 `_shared/`를 함께 배포한다. `_shared/ai.ts`를 고쳤다면 이를 쓰는 함수(`recommend-missions`, `verify-mission`, `moderate-comment`, `mailbox`, `write-weekly-letter`)를 모두 다시 배포한다.
- 환경 변수를 바꾼 뒤에도 함수를 다시 배포해야 반영된다.

## 7. 테스트 데이터와 시연 모드

- 테스트는 익명 계정으로 한다. 브라우저 시크릿 창을 쓰면 계정이 섞이지 않는다.
- 끝나면 Supabase 대시보드 Authentication에서 그 계정을 지운다(관련 행은 함께 지워진다). 사진은 Storage `verifications` 버킷의 같은 사용자 폴더를 지운다.
- 저작권이 있는 이미지(만화·캐릭터·남의 사진)는 피드에 공개로 올리지 않는다.
- 댓글·릴레이 공개를 1분으로 줄이려면 SQL Editor에서 `select public.set_demo_mode(true);`. 끝나면 `false`로 되돌린다.
