# 맞춤형 서울챌린지

미션을 할수록 AI가 다음 미션과 보상을 맞춰 주는, 외로운 청년을 위한 초소형 일상 챌린지. 명세는 [PRD.md](./PRD.md), 디자인은 [DESIGN.md](./DESIGN.md).

## 실행

```bash
npm install
cp .env.example .env.local   # EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY 입력
npm run web                  # 웹
npm start                    # Expo Go (폰)
```

## 검사

```bash
npm run typecheck
npm run lint
```

## 데이터 출처·라이선스

- 미션 시드: 365 서울챌린지 2026년 2기 36개 과제 (서울특별시, 내 손안에 서울 2026.8.31)
- 글꼴: Pretendard — SIL Open Font License 1.1 (`assets/fonts/LICENSE-Pretendard.txt`)
