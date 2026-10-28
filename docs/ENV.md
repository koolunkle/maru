# 환경 변수·권한 가이드

> 이 프로젝트에서 값을 넣는 곳은 다섯 군데다. 처음 합류했다면 **A만 하면 앱이 뜬다.** B~D는 담당 작업에 따라 필요할 때 본다.

| 구분 | 위치 | 누가 | 언제 필요한가 |
| --- | --- | --- | --- |
| A. 앱 환경 변수 | `.env.local` (내 PC, git 제외) | 모든 팀원 | 앱 실행·웹 배포 |
| B. 서버 함수 시크릿 | Supabase Edge Function Secrets | 관리자 | AI·공공데이터 키 변경 |
| C. 운영 설정값 | DB `public.app_config` 테이블 | DB 권한자 | 시연 모드, AI 장애 시 판정 방식 |
| D. 계정·CLI 로그인 | GitHub·Supabase·Expo 계정 | 모든 팀원(작업별) | push, 마이그레이션, 함수·웹 배포 |
| E. 예약 작업 비밀값 | Supabase Vault | 관리자 | cron이 함수를 부를 때(문화행사 동기화) |

---

## 값 조회 위치 한눈에 보기

| 값 | 어디서 조회하나 | 누가 조회하나 | 어떻게 전달하나 |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 대시보드 → Project Settings → Data API → Project URL | 누구나 | 전달 불필요(`.env.example`에 있음) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 대시보드 → Project Settings → API Keys → Publishable key | 누구나 | 전달 불필요(`.env.example`에 있음) |
| `GEMINI_API_KEY` | Google AI Studio → API keys (<https://aistudio.google.com/apikey>) | 관리자 | 전달하지 않음. 관리자가 Supabase Secrets에 직접 등록 |
| `ANTHROPIC_API_KEY` | Claude Console → Settings → API Keys (<https://console.anthropic.com/>) | 관리자 | 위와 같음 |
| `ANTHROPIC_WORKSPACE_ID` | Claude Console → Settings → Workspaces → 해당 워크스페이스 ID | 관리자 | 위와 같음 |
| `SEOUL_OPEN_API_KEY` | 서울 열린데이터광장 → 로그인 → 인증키 신청 (<https://data.seoul.go.kr/together/mypage/actkeyMain.do>) | 관리자 | 위와 같음 |
| `SYNC_EVENTS_SECRET` | 직접 만든 임의 문자열(예: `openssl rand -hex 32`) | 관리자 | Secrets와 Vault 두 곳에만 넣는다. 전달하지 않음 |
| 등록된 시크릿 이름 확인 | Supabase 대시보드 → Edge Functions → Secrets, 또는 `npx supabase secrets list` | Supabase 멤버 | 값은 다시 볼 수 없고 해시만 보인다 |
| `app_config` 값 | Supabase 대시보드 → Table Editor → `app_config`, 또는 SQL Editor | Supabase 멤버 | 전달 불필요 |
| DB 비밀번호 | **조회 불가.** Project Settings → Database → Reset database password로 재설정만 가능 | 관리자 | 비밀번호 관리자·1회성 비밀 링크. 메신저 금지 |
| Expo 프로젝트 ID | `app.json`의 `owner`, `extra.eas.projectId` | 누구나 | 전달 불필요. 바꾸지 않는다 |

- 재설정한 DB 비밀번호는 기존에 `supabase link` 해 둔 사람도 다시 입력해야 한다. 재설정 전에 팀에 알린다.
- AI 키는 한 번 만든 뒤 콘솔에서도 전체 값을 다시 볼 수 없다. 잃어버리면 새로 발급하고 이전 키는 폐기한다.

---

## A. 앱 환경 변수 (`.env.local`)

```bash
cp .env.example .env.local
```

`.env.example`에 실제 값이 이미 들어 있으므로 복사만 하면 된다.

| 변수 | 값 | 출처 | 공개 여부 |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://jpipzrmspryzvjykxefm.supabase.co` | Supabase 대시보드 → Project Settings → Data API | 공개 |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (`.env.example` 참고) | Supabase 대시보드 → Project Settings → API Keys → Publishable key | 공개 |

- 읽는 곳은 `src/lib/supabase.ts` 한 곳이다. 둘 중 하나라도 없으면 앱 시작 시 `EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 없습니다` 오류로 멈춘다.
- `EXPO_PUBLIC_` 접두사가 붙은 값은 **번들에 그대로 들어가 누구나 볼 수 있다.** 그래서 publishable 키만 넣는다. 데이터 보호는 키가 아니라 RLS 정책이 맡는다.
- 값을 바꾼 뒤에는 개발 서버를 캐시 없이 다시 띄운다: `npx expo start --clear`.
- 웹 배포(`npx expo export -p web`)는 **배포하는 사람 PC의 `.env.local`** 을 번들에 넣는다. 배포 전에 값이 맞는지 확인한다.
- `.env*.local`은 `.gitignore`에 있다. `.env.example`만 커밋한다.

> 앱에 절대 넣지 않는 값: `service_role` 키, `sb_secret_…` 키, DB 비밀번호, AI API 키. 클라이언트 코드나 `EXPO_PUBLIC_*`에 들어가면 배포된 웹에서 그대로 노출된다.

---

## B. 서버 함수 시크릿 (Supabase Edge Function Secrets)

AI 호출은 앱이 아니라 Edge Function(`supabase/functions/`)이 한다. 키는 Supabase 프로젝트에만 있고 팀원 PC에는 두지 않는다.

| 이름 | 필수 | 용도 | 읽는 곳 |
| --- | --- | --- | --- |
| `SUPABASE_URL` | 자동 | 서버 클라이언트 주소 | `_shared/clients.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | 자동 | RLS를 우회하는 서버 전용 키 | `_shared/clients.ts` |
| `GEMINI_API_KEY` | 둘 중 하나 | Gemini 사용. 있으면 기본 제공자 | `_shared/ai.ts` |
| `ANTHROPIC_API_KEY` | 둘 중 하나 | Claude 사용. `sk-ant-`로 시작 | `_shared/ai.ts` |
| `ANTHROPIC_WORKSPACE_ID` | 선택 | 워크스페이스에 묶이지 않은 Anthropic 키일 때 필요 | `_shared/ai.ts` |
| `AI_PROVIDER` | 선택 | `gemini` 또는 `anthropic`으로 강제 선택 | `_shared/ai.ts` |
| `SEOUL_OPEN_API_KEY` | 행사 동기화 시 | 서울 열린데이터광장 일반 인증키. 주소 경로에 들어가므로 로그에 주소를 남기지 않는다 | `sync-events` |
| `SYNC_EVENTS_SECRET` | 행사 동기화 시 | cron만 `sync-events`를 부를 수 있게 하는 비밀값. Vault `sync_events_secret`과 같은 값 | `sync-events` |

- **자동** 항목은 Supabase가 모든 함수에 넣어 준다. 직접 설정하지 않는다(`SUPABASE_` 접두사는 예약어라 설정도 안 된다).
- 제공자 선택 규칙: `AI_PROVIDER=anthropic` → Claude / `AI_PROVIDER=gemini` → Gemini / 비어 있으면 `GEMINI_API_KEY`가 있을 때 Gemini, 없으면 Claude.
- 사용 모델은 `_shared/ai.ts`의 `Models` 상수에 있다(`main` = 미션 생성·사진 판정, `light` = 댓글 검수).
- 키가 없거나 AI가 실패해도 앱은 멈추지 않는다(PRD §8.2): 추천은 시드 미션, 판정은 `verify_fallback`(C), **댓글은 `pending`으로 남아 공개되지 않는다.**
- Gemini 무료 등급은 입력이 Google 제품 개선·사람 검토에 쓰일 수 있다. 실제 참가자를 받기 전에 유료 등급 또는 Claude로 바꾼다(PRD §8.3).

확인·변경(관리자):

```bash
npx supabase secrets list --project-ref jpipzrmspryzvjykxefm         # 이름과 해시만 보인다
npx supabase secrets set AI_PROVIDER=anthropic --project-ref jpipzrmspryzvjykxefm
# 시크릿을 바꾼 뒤에는 AI를 쓰는 함수를 모두 다시 배포한다
npx supabase functions deploy recommend-missions --project-ref jpipzrmspryzvjykxefm
npx supabase functions deploy verify-mission --project-ref jpipzrmspryzvjykxefm
npx supabase functions deploy moderate-comment --project-ref jpipzrmspryzvjykxefm
```

행사 동기화 키를 바꾼 뒤에는 `npx supabase functions deploy sync-events --project-ref jpipzrmspryzvjykxefm`.

AI가 동작하지 않을 때는 대시보드 Edge Functions → 함수 → Logs에서 `ai error` 줄을 본다. 로그에 키 값은 남지 않고 `provider`, `geminiKey: set|missing`, `anthropicKey: ok|malformed|missing` 같은 설정 상태만 남는다.

### 함수를 내 PC에서 실행할 때 (선택)

`npx supabase functions serve`로 로컬 실행하려면 `supabase/functions/.env`에 위 AI 키를 넣는다. 이 파일은 `.gitignore`에 등록되어 있지만, 커밋 전에 `git status`로 한 번 더 확인한다. 키는 관리자에게 개인 키 발급을 요청하고 공용 키를 복사해 쓰지 않는다.

---

## C. 운영 설정값 (`public.app_config`)

환경 변수가 아니라 DB에 저장된 값이다. Supabase 대시보드 SQL Editor에서 바꾼다. 앱·함수 재배포 없이 바로 반영된다.

| key | 값 | 기본 | 의미 |
| --- | --- | --- | --- |
| `comment_delay_minutes` | 숫자(분) | `180` | 댓글 공개 지연(F6). 릴레이(F10)도 같은 값을 쓸 예정 |
| `verify_fallback` | `"pass"` \| `"retry_later"` | `"pass"` | AI 판정 실패 시 통과 처리 / 재시도 안내(F4) |

```sql
select key, value from public.app_config;

select public.set_demo_mode(true);   -- 시연: 공개 지연 1분, 공개 cron 매분
select public.set_demo_mode(false);  -- 운영: 3시간, 10분 주기

update public.app_config set value = '"retry_later"' where key = 'verify_fallback';
```

`comment_delay_minutes`는 직접 고치지 말고 `set_demo_mode`로 바꾼다. cron 주기도 함께 바뀌어야 하기 때문이다.

---

## E. 예약 작업 비밀값 (Supabase Vault)

cron(`sync-events`, 매일 05:00 KST)이 함수를 부를 때 쓰는 값이다. 마이그레이션 파일에는 값을 넣지 않고 이름만 쓴다.

| Vault 이름 | 값 |
| --- | --- |
| `project_url` | `https://jpipzrmspryzvjykxefm.supabase.co` |
| `publishable_key` | `.env.example`의 publishable 키 |
| `sync_events_secret` | B의 `SYNC_EVENTS_SECRET`과 같은 값 |

등록·확인(SQL Editor, 관리자):

```sql
select vault.create_secret('<값>', '<이름>');                  -- 처음 한 번
select name, created_at from vault.decrypted_secrets;         -- 이름만 확인
select * from cron.job where jobname = 'sync-events';
select status_code, content, created from net._http_response order by created desc limit 5;  -- 최근 호출 결과(6시간 보관)
```

`SYNC_EVENTS_SECRET`을 바꾸면 Vault 값도 같이 바꾼다(`vault.update_secret`). 둘이 다르면 함수가 401을 돌려준다.

---

## D. 계정·권한 — 관리자가 신규 팀원에게 줄 것

### 전달할 것

| 항목 | 방법 | 필요한 작업 |
| --- | --- | --- |
| GitHub `koolunkle/maru` Collaborator(Write) | GitHub 초대 | 모든 작업 |
| Supabase 조직 멤버(Developer) | 대시보드 초대 | DB·함수 작업, 로그 확인 |
| Expo 조직 `koolunkles-team` 멤버(Developer) | expo.dev 조직 설정 → Members → Invite | 미리보기 배포 |
| Supabase DB 비밀번호 | 비밀번호 관리자 공유 또는 1회성 비밀 링크 | `supabase link`·`db push`를 할 사람만 |

### 전달하지 않는 것

- `service_role` / `sb_secret_…` 키 — 함수에 자동으로 들어가므로 사람이 가질 이유가 없다.
- AI API 키(Gemini, Anthropic) — Supabase Secrets에만 둔다. 메신저·이메일·저장소로 보내지 않는다.

### DB 비밀번호는 어디에도 파일로 저장하지 않는다

- `.env.local`에 넣지 않는다. 앱은 DB 비밀번호를 쓰지 않으며, `.env.local`의 값은 번들에 들어갈 수 있다.
- 쓰이는 곳은 Supabase CLI뿐이다(`supabase link`, `db push`, `migration list`). 명령이 물어볼 때 입력한다.
- 앱 실행·화면 작업만 한다면 필요 없다.

### 팀원이 각자 하는 로그인

```bash
npx supabase login                                       # 브라우저에서 개인 계정으로 로그인
npx supabase link --project-ref jpipzrmspryzvjykxefm     # DB 비밀번호 입력 (DB 작업자만)
npx eas-cli@latest login                                 # 미리보기 배포할 사람만
```

---

## 처음 합류한 사람 점검표

- [ ] Node.js 22, Git 설치 (`node -v`). 시드를 다시 만들 사람은 Python 3도 (`npm run seed:build`가 `python` 명령을 쓴다. macOS 등에서 `python3`만 있으면 `python3 scripts/build-seed.py`로 실행)
- [ ] GitHub 초대 수락 → `git clone` → `npm install`
- [ ] `cp .env.example .env.local`
- [ ] `npm run web`으로 시작 화면이 뜨고 '시작하기' → 온보딩까지 진행됨
- [ ] `npm run typecheck`, `npm run lint` 통과
- [ ] (DB·함수 담당) Supabase 초대 수락, `supabase login`·`link`, `npx supabase migration list`에서 로컬·원격 짝이 맞음
- [ ] (배포 담당) Expo 조직 `koolunkles-team` 초대 수락, `npx eas-cli@latest login`
- [ ] 테스트로 만든 익명 계정·사진은 끝나고 지운다(CONTRIBUTING §7)
