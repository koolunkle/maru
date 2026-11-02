## 1. 화면과 라우트

- [x] 1.1 `src/screens/vault.tsx`를 만들고 `MailboxCard`, 한 줄 기록 메뉴·시트(`DailyNoteCard`), `CapsuleCard`를 `rest.tsx`에서 옮긴다(제목 "마음 보관함", 오늘 기분 불러오기 포함)
- [x] 1.2 `src/app/(tabs)/vault.tsx` 라우트를 만든다
- [x] 1.3 `src/app/(tabs)/_layout.tsx`에 `vault`를 index 바로 뒤에 선언하고 제목 "마음 보관함", 아이콘 Feather `archive`를 추가한다. 주석의 "탭 5개"를 6개로 고친다
- [x] 1.4 `src/screens/rest.tsx`에서 마음 보관함 블록·관련 상태·사용하지 않는 import를 지우고 간격을 맞춘다. 파일 주석(S10)도 고친다
- [x] 1.5 마음 우체통 자동 수신함 열기가 마음 보관함 탭에 들어올 때 계정마다 하루 한 번 일어나는지 확인하고, 마운트 기준이라 어긋나면 포커스 기준으로 맞춘다

## 2. 문서

- [x] 2.1 DESIGN.md의 S10 두 줄을 휴게소(도움 안내·배경음)와 마음 보관함(카드 3개) 화면으로 나누고 탭 바 설명을 6개로 고친다
- [x] 2.2 docs/ARCHITECTURE.md 화면 표에 마음 보관함(`/vault`, `screens/vault.tsx`)을 추가하고 S10 행을 고친다
- [x] 2.3 docs/PRODUCT.md의 탭 구성 언급을 고친다
- [x] 2.4 `rest-area` spec의 Purpose는 change를 sync·archive할 때 마음 보관함 입구 문구를 빼도록 고친다

## 3. 검증

- [x] 3.1 `npm run typecheck`, `npm run lint`, `npm test`, `npm run format`
- [x] 3.2 `npm run spec:validate`
- [x] 3.3 미리보기 배포 URL에서 각 Scenario 확인: 탭 순서, 마음 보관함 열기, 휴게소에 보관함 카드 없음, 안 읽은 글 표시와 하루 한 번 자동 열기, 타임캡슐 도착, 한 줄 기록 저장
- [x] 3.4 360px 폭에서 탭 라벨 6개가 잘리지 않는지 확인(잘리면 라벨을 "보관함"으로 줄인다)
