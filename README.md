# MY서울루틴 (Maru)

작은 성공이 쌓이는 AI 일상 루틴. 고립 직전의 청년이 오늘 할 수 있는 한 가지에서 다시 시작하도록 돕는다.

10/20 해커톤 제출본에 동료 프로토타입의 기능을 합쳤다. 진행 중인 작업은 `npm run spec -- list`(열린 change)로 본다.

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
| [AGENTS.md](./AGENTS.md) | AI 코딩 도구에 주는 규칙 |

## 실행

```bash
npm install
cp .env.example .env.local   # publishable 키가 들어 있다
npm run web                  # 웹
npm start                    # Expo Go (폰)
npm run spec -- list         # 진행 중인 change 목록
```

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

- 운영 URL: https://seoul-challenge.expo.app
- 명령과 절차: [CONTRIBUTING.md](./CONTRIBUTING.md) 3절(미리보기·운영 배포), AI 키·시연 모드 등 운영 설정: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) 9절

## 데이터 출처·라이선스

- 미션 시드: 365 서울챌린지 2026년 2기 36개 과제 (서울특별시, 내 손안에 서울 2026.8.31)
- 글꼴: Pretendard — SIL Open Font License 1.1 (`assets/fonts/LICENSE-Pretendard.txt`)
- 배경음: [Relaxing sleep music with soft ambient rain](https://pixabay.com/music/ambient-relaxing-sleep-music-with-soft-ambient-rain-369762/) — DesiFreeMusic, [Pixabay Content License](https://pixabay.com/service/license-summary/) (`assets/audio/rain.mp3`)
