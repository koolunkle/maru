# 맞춤형 서울챌린지

미션을 할수록 AI가 다음 미션과 보상을 맞춰 주는, 외로운 청년을 위한 초소형 일상 챌린지. 명세는 [PRD.md](./PRD.md), 디자인은 [DESIGN.md](./DESIGN.md).

## 실행

```bash
npm install
cp .env.example .env.local   # EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY 입력
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
