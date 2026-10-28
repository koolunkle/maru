# UI 비교안

> 임시 문서(2026-10-28). 검수가 끝나면 고른 안을 `src/constants/theme.ts`와 [DESIGN.md](../DESIGN.md)에 반영하고, 이 문서와 `src/constants/theme-variants.ts`를 지운다. 진행 배경은 ROADMAP T16.

기준안(A)과 비교안 2개를 같은 화면 구조로 만들었다. 바꾼 것은 **색과 모서리뿐**이고 글꼴·간격·화면 구성·문구는 같다. 다른 서비스의 디자인 값을 가져오지 않고 이 앱의 주제(산책·성장, 따뜻함)에서 방향을 정했다.

## 미리보기

| 안 | 주소 | 방향 | 강조색 | 보조색 | 모서리 |
| --- | --- | --- | --- | --- | --- |
| A 웜 미니멀(현재) | <https://seoul-challenge--theme-base.expo.app> | 따뜻한 흰 바탕, 차분한 인디고 | `#4f5bd5` | 주황 `#f08a3e` | 기본(카드 16) |
| B 숲길 | <https://seoul-challenge--theme-forest.expo.app> | 산책·성장(화분)과 이어지는 초록, 햇살 노랑 | `#2b7656` | 노랑 `#f2b134` | 기본(카드 16) |
| C 노을 | <https://seoul-challenge--theme-dusk.expo.app> | 테라코타로 더 따뜻하게, 청록 보조 | `#a84a2f` | 청록 `#3f8f8a` | 한 단계 둥글게(카드 20) |

- 비교안 주소에서는 설정 화면 맨 아래에 "디자인 비교안: B 숲길"처럼 안 이름이 보인다.
- 세 주소 모두 **운영 DB를 쓴다.** '시작하기'를 누르면 익명 계정이 생기니, 검수가 끝나면 그 계정을 지운다(CONTRIBUTING 7절). 시크릿 창을 쓰면 계정이 섞이지 않는다.
- 다크 모드는 기기(브라우저) 설정을 따른다. 두 모드 모두 본다.

## 볼 화면

| 화면 | 볼 것 |
| --- | --- |
| S3 홈 | 미션 카드, 성장 화분, 우체통·한 줄 기록·타임캡슐 메뉴의 조화 |
| S4 미션 상세 | 상단 카테고리 영역, 버튼, 행사 정보 카드 |
| S5 인증 결과 | 통과·보상 표시, 응원 한 줄 입력 |

## 평가 기준

각 안을 1~3점으로 매기고 합계로 고른다.

| 기준 | 질문 |
| --- | --- |
| 따뜻함 | 처음 본 사람이 편안하다고 느끼는가. 진단·경고처럼 보이지 않는가 |
| 읽기 쉬움 | 글자와 버튼이 바로 읽히는가(아래 대비 수치는 모두 통과) |
| 주제와의 연결 | 산책·작은 성취·서울이라는 주제가 느껴지는가 |
| 다크 모드 | 어두운 화면에서도 같은 인상인가 |
| 카테고리 색과의 조화 | 7가지 카테고리 배경색(공통)과 강조색이 부딪히지 않는가 |

## 글자 대비 (WCAG AA)

본문 글자 4.5 이상, 성공 표시(아이콘·큰 글자) 3 이상을 기준으로 13개 조합을 계산했다.

| 안 | 라이트 | 다크 |
| --- | --- | --- |
| A | 오류 글자/흰 바탕 **4.25** (기준 미달, 나머지 통과) | 통과 |
| B | 통과 | 통과 |
| C | 통과 | 통과 |

A의 오류 글자색(`#d9483b`)은 기존 DESIGN.md 값이다. A를 고르더라도 `#c4463a` 정도로 조금 어둡게 하는 것을 권한다.

## 다시 빌드하는 법

```bash
EXPO_PUBLIC_THEME_VARIANT=forest npx expo export -p web --output-dir dist-forest   # forest | dusk, 비우면 A
npx eas-cli@latest deploy --export-dir dist-forest --alias theme-forest             # --prod 없이
```

PowerShell에서는 `$env:EXPO_PUBLIC_THEME_VARIANT='forest'; npx expo export -p web --output-dir dist-forest`. 색을 바꿔 보고 싶으면 `src/constants/theme-variants.ts`만 고친다.
