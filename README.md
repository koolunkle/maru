# MY서울루틴 (Maru)

미션을 할수록 AI가 다음 미션과 보상을 맞춰 주는, 외로운 청년을 위한 초소형 일상 챌린지.

10/20 제출본에 동료 프로토타입의 기능을 합쳤고, 지금은 기능 점검과 시연 준비 단계다(~11/8).

| 문서 | 내용 |
| --- | --- |
| [PRD.md](./PRD.md) | 기능·데이터·문구 명세 |
| [DESIGN.md](./DESIGN.md) | 디자인 토큰과 화면 구조 |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | 남은 작업과 담당, 끝난 작업의 PR |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 권한 요청, 실행, 브랜치·커밋·PR, DB 변경 방법 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 폴더 지도, 주요 흐름, 화면별 구현 상태, 알아 둘 점 |
| [docs/ENV.md](./docs/ENV.md) | 환경 변수·함수 시크릿·운영 설정값, 신규 팀원에게 줄 권한 |
| [docs/USER-FLOWS.md](./docs/USER-FLOWS.md) | 페르소나별 사용자 흐름(발표 기준) |

## 실행

```bash
npm install
cp .env.example .env.local   # publishable 키가 들어 있다
npm run web                  # 웹
npm start                    # Expo Go (폰)
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
- 명령과 절차: [CONTRIBUTING.md](./CONTRIBUTING.md) 3절(미리보기·운영 배포), AI 키·시연 모드 등 운영 설정: [docs/ENV.md](./docs/ENV.md)

## 데이터 출처·라이선스

- 미션 시드: 365 서울챌린지 2026년 2기 36개 과제 (서울특별시, 내 손안에 서울 2026.8.31)
- 글꼴: Pretendard — SIL Open Font License 1.1 (`assets/fonts/LICENSE-Pretendard.txt`)
- 배경음: [Relaxing sleep music with soft ambient rain](https://pixabay.com/music/ambient-relaxing-sleep-music-with-soft-ambient-rain-369762/) — DesiFreeMusic, [Pixabay Content License](https://pixabay.com/service/license-summary/) (`assets/audio/rain.mp3`)
