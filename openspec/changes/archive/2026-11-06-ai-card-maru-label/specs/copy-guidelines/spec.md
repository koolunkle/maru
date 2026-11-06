## MODIFIED Requirements

### Requirement: AI 결과와 규칙 결과 구분
앱은 AI가 만든 내용(추천 이유, 판정 한 줄, 편지)만 왼쪽 위에 "MARU" 라벨이 있는 AI 카드로 보여 주고, AI를 쓸 수 없어 규칙으로 만든 결과는 라벨 없는 일반 카드로 보여 줘야 한다(SHALL).

#### Scenario: 규칙 추천
- **WHEN** 추천이 시드 대체로 만들어졌다
- **THEN** 추천 이유가 AI 카드로 보이지 않는다

#### Scenario: AI 카드 라벨
- **WHEN** AI가 만든 판정 한 줄을 본다
- **THEN** 카드 왼쪽 위에 "MARU"가 보이고 "AI"라는 라벨은 보이지 않는다
