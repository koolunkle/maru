# 맞춤형 서울챌린지

미션을 할수록 AI가 다음 미션과 보상을 맞춰 주는, 외로운 청년을 위한 초소형 일상 챌린지.

지금은 10/20 제출본에 동료 프로토타입의 기능을 합치는 통합 단계다(10/23~11/8).

| 문서 | 내용 |
| --- | --- |
| [PRD.md](./PRD.md) | 기능·데이터·문구 명세 |
| [DESIGN.md](./DESIGN.md) | 디자인 토큰과 화면 구조 |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | 통합 작업 목록과 담당 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 권한 요청, 실행, 브랜치·커밋·PR, DB 변경 방법 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 폴더 지도, 주요 흐름, 화면별 구현 상태, 알아 둘 점 |
| [docs/ENV.md](./docs/ENV.md) | 환경 변수·함수 시크릿·운영 설정값, 신규 팀원에게 줄 권한 |

## 실행

```bash
npm install
cp .env.example .env.local   # publishable 키가 들어 있다
npm run web                  # 웹
npm start                    # Expo Go (폰)
```

## 배포 (EAS Hosting)

- 운영 URL: https://seoul-challenge.expo.app
- EAS 프로젝트: `@koolunkle/seoul-challenge`

```bash
npx expo export -p web
npx eas-cli@latest deploy --prod
```

`EXPO_PUBLIC_*` 값은 export 시점에 번들에 들어간다. publishable 키만 넣는다.

## AI 설정 (Supabase Edge Function Secrets)

| 이름 | 용도 |
| --- | --- |
| `GEMINI_API_KEY` | Gemini 사용 (있으면 기본 제공자) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID` | Claude 사용 |
| `AI_PROVIDER` | `gemini` 또는 `anthropic`으로 강제 선택 (선택 사항) |

선택 규칙과 확인·변경 명령은 [docs/ENV.md](./docs/ENV.md) B절. 시크릿을 바꾼 뒤에는 함수를 다시 배포해야 반영된다. Gemini 무료 등급은 입력이 Google의 제품 개선과 사람 검토에 쓰일 수 있으므로 시연 기간에만 쓰고, 운영 시에는 유료 등급 또는 Claude로 전환한다.

## 시연 모드

댓글 공개 지연 1분·공개 작업 매분 실행. Supabase SQL에서 전환한다.

```sql
select public.set_demo_mode(true);   -- 시연
select public.set_demo_mode(false);  -- 운영 (3시간, 10분 주기)
```

AI를 쓸 수 없을 때 사진 판정 처리: `app_config.verify_fallback` = `"pass"`(통과) | `"retry_later"`(재시도 안내).

## 검사

```bash
npm run typecheck
npm run lint
```

## 데이터 출처·라이선스

- 미션 시드: 365 서울챌린지 2026년 2기 36개 과제 (서울특별시, 내 손안에 서울 2026.8.31)
- 글꼴: Pretendard — SIL Open Font License 1.1 (`assets/fonts/LICENSE-Pretendard.txt`)
- 배경음: [Relaxing sleep music with soft ambient rain](https://pixabay.com/music/ambient-relaxing-sleep-music-with-soft-ambient-rain-369762/) — DesiFreeMusic, [Pixabay Content License](https://pixabay.com/service/license-summary/) (`assets/audio/rain.mp3`)
