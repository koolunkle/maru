This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## 이 프로젝트 (맞춤형 서울챌린지)

- 기능·문구 명세: `PRD.md`, 시각 명세·토큰: `DESIGN.md` — 구현은 이 두 문서를 단일 출처로 따른다. 토큰은 `src/constants/theme.ts`에 DESIGN.md와 같은 값으로 둔다.
- 언어: TypeScript (strict). 앱 코드는 `src/`, 라우트는 `src/app/`, 화면 본문은 `src/screens/`.
- SDK 58 import 경로: `Stack` ← `expo-router/stack`, `Tabs` ← `expo-router/js-tabs`, `Link`·`Redirect` ← `expo-router/link`.
- 백엔드: Supabase 프로젝트 `jpipzrmspryzvjykxefm`. 스키마는 `supabase/migrations/`, 시드는 `npm run seed:build`로 `data/seoul-challenge-2026-2.json` → `supabase/seed.sql` 생성.
- DB 타입: `src/types/database.ts` (생성 파일, 직접 수정 금지). 스키마 변경 후 재생성.
- 환경 변수: `.env.example`을 `.env.local`로 복사해 publishable 키를 넣는다. service_role/secret 키는 앱에 넣지 않는다.
