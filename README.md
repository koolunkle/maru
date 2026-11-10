# MY서울루틴 (Maru)

잃어버린 일상을 되찾아주는 일상 루틴 추천 서비스. 일을 기다리는 시간이 길어지며 외출·연락이 줄기 시작한 서울 청년(19~39세)이 오늘의 루틴 하나에서 다시 시작해, 지지를 받고, 서울의 청년 정책 프로그램까지 나가도록 돕는다. **365 서울챌린지의 청년 트랙**(2027 서울챌린지)으로 제안한다.

- 운영: https://seoul-challenge.expo.app (웹 주력, 휴대폰은 Expo Go)
- 미션 관리: 운영 주소 뒤에 `/admin` ([docs/ADMIN.md](./docs/ADMIN.md))
- 팀 그고깃집 · 본선 발표 2026-11-09

## MARU의 세 단계

| 단계 | Maru가 하는 일 | 상태 |
| --- | --- | --- |
| 1 · 초개인화 미션으로 일상 되찾기 | 관심사·동네·하루 시간·최근 기록에 맞춰 AI가 오늘의 미션 3개와 동네 행사 주간 미션을 만들고 고른 이유를 쓴다. 해내면 난이도를 올리고 놓치면 내린다 | 구현 |
| 2 · 지지로 자기비난 벗어나기 | AI가 인증 사진을 보고 '해냈다'를 알아봐 준다. 응원 글을 먼저 검수하고, 주말에는 한 주를 읽고 편지를 쓴다. 익명 응원·릴레이·마음 우체통 | 구현 |
| 3 · 정책 프로그램으로 밖에 나가기 | 쌓인 기록에 맞는 서울 청년 프로그램을 난이도 5 미션으로 건넨다 | 2027 제안 |

AI는 정해진 틀 안에서만 만들고 코드가 한 번 더 검사한다. AI를 쓸 수 없으면 규칙으로 대체한다. 순위·비교·끊기면 사라지는 보상은 넣지 않는다.

주요 기능(F1~F16): 익명 시작 · AI 미션 추천 · 사진 인증 · 연속 출석 · 성장 화분 · 가구 보상과 내 방 · 피드와 익명 응원 · 같이 할래요 · 응원 릴레이 · 주간 편지 · 마음 우체통 · 한 줄 기록 · 타임캡슐 · 빗소리와 도움 안내. 전체 표는 [PRODUCT 3.1절](./docs/PRODUCT.md#31-기능과-spec).

## 기술 스택

Expo SDK 58 (React Native, Expo Router, TypeScript strict) · Supabase (익명 Auth, Postgres + RLS, Storage, Edge Functions, pg_cron) · Gemini API(기본, Claude 전환 가능) · 서울 열린데이터광장 문화행사 · EAS Hosting. 구성도는 [ARCHITECTURE 1절](./docs/ARCHITECTURE.md#1-시스템-구성).

## 문서

명세 중심 개발(SDD)을 [OpenSpec](https://github.com/Fission-AI/OpenSpec)으로 한다. **지금 앱이 어떻게 동작하는지는 `openspec/specs/`가 기준**이고, 동작을 바꾸는 작업은 `openspec/changes/`에 제안서부터 쓴다.

| 문서 | 무엇을 답하나 |
| --- | --- |
| [docs/PRODUCT.md](./docs/PRODUCT.md) | 왜, 누구를 위해 만드나. 페르소나·범위·하지 않는 것 |
| [openspec/specs/](./openspec/specs/) | 각 기능이 어떻게 동작해야 하나(요구사항 + 시나리오). 기능 ID F1~F16 표는 PRODUCT 3.1절 |
| [openspec/changes/](./openspec/changes/) | 지금 진행 중인 작업. 작업마다 제안서·설계·할 일·명세 차이 |
| [DESIGN.md](./DESIGN.md) | 어떻게 보이나. 디자인 토큰과 화면 구조 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 어디에 구현되어 있나. 폴더 지도·데이터 모델·함수·주요 흐름·설정값과 시크릿 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 권한 요청, 실행·점검표, 작업 흐름(OpenSpec), 커밋·PR, DB 변경 |
| [docs/ADMIN.md](./docs/ADMIN.md) | 관리자 웹으로 미션·기준 사진을 관리하는 법 |
| [AGENTS.md](./AGENTS.md) | AI 코딩 도구에 주는 규칙 |

## 실행

```bash
npm install
cp .env.example .env.local   # publishable 키가 들어 있다
npm run web                  # 웹
npm start                    # Expo Go (폰)
```

PR 전 점검:

```bash
npm run lint && npm run typecheck && npm test
npm run spec:validate        # 명세 검사
npm run spec -- list         # 진행 중인 change
```

권한 요청과 작업 흐름은 [CONTRIBUTING.md](./CONTRIBUTING.md).

## 이름과 식별자

서비스 이름은 **MY서울루틴 (Maru)** 이다(이전 이름: 맞춤형 서울챌린지). 사람에게 보이는 이름은 모두 바꿨고, 서비스를 연결하는 아래 식별자는 바꾸지 않는다. 바꾸면 배포·DB 연결·공유된 링크가 끊긴다.

| 식별자 | 값 | 그대로 두는 이유 |
| --- | --- | --- |
| Expo `slug`·EAS 프로젝트 | `seoul-challenge`, `@koolunkles-team/seoul-challenge` | slug가 EAS 프로젝트와 맞아야 배포된다 |
| 운영 URL | `seoul-challenge.expo.app` | 이미 공유·제출된 주소 |
| Supabase 프로젝트 | `seoul-challenge` (ref `jpipzrmspryzvjykxefm`) | 코드는 ref로 연결한다. 대시보드 표시 이름만 바꿀 수 있다 |
| 적용된 마이그레이션 주석 | `20261018084819_init_schema.sql` | 적용된 마이그레이션은 고치지 않는다 |
| 기기 저장 키 | `@seoul-challenge/mailbox-arrival/…` | 바꾸면 우체통 자동 열림 기록이 초기화된다 |

## 배포

- 명령과 절차: [CONTRIBUTING.md](./CONTRIBUTING.md) 3절(미리보기·운영 배포), AI 키·시연 모드 등 운영 설정: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 9절

## 데이터 출처·라이선스

- 미션 시드: 365 서울챌린지 2026년 2기 36개 과제 (서울특별시, 내 손안에 서울 2026.8.31)
- 글꼴: Pretendard — SIL Open Font License 1.1 (`assets/fonts/LICENSE-Pretendard.txt`)
- 배경음: [Relaxing sleep music with soft ambient rain](https://pixabay.com/music/ambient-relaxing-sleep-music-with-soft-ambient-rain-369762/) — DesiFreeMusic, [Pixabay Content License](https://pixabay.com/service/license-summary/) (`assets/audio/rain.mp3`)
