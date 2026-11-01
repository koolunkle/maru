# culture-events Specification

## Purpose
서울 열린데이터광장의 문화행사를 매일 모아, 동네 행사 미션(mission-recommendation)과 미션 상세의 행사 정보에 쓴다.

## Requirements

### Requirement: 매일 행사 수집
시스템은 매일 05:00(KST)에 서울 열린데이터광장 문화행사 중 앞으로 30일 안에 진행되는 행사를 모아 구별로 저장해야 한다(SHALL). 같은 행사는 한 번만 저장하고 바뀐 내용은 갱신한다.

#### Scenario: 정기 수집
- **WHEN** 05:00(KST)이 된다
- **THEN** 30일 안의 행사가 제목·장소·구·기간·링크와 함께 저장된다

#### Scenario: 외부 API 장애
- **WHEN** 열린데이터광장 API가 응답하지 않는다
- **THEN** 이미 저장된 행사는 그대로 남고 추천은 계속 동작한다

### Requirement: 미션에 쓸 행사 고르기
시스템은 추천에 사용자 구에서 이번 주 일요일 전에 시작하고 오늘 기준 이틀 이상 남은 행사를 최대 10건까지 넘겨야 한다(SHALL).

#### Scenario: 곧 끝나는 행사
- **WHEN** 내일 끝나는 행사가 있다
- **THEN** 그 행사로는 미션을 만들지 않는다
