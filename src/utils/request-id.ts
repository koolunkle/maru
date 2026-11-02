/**
 * 네트워크 재시도에도 한 번만 저장되게 서버에 함께 보내는 요청 식별자.
 * 추천 새로 받기·댓글·우체통·타임캡슐이 쓴다. 우체통 함수가 받는 형식(16~80자, 영문·숫자·하이픈)을 지킨다.
 */
export function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12).padEnd(10, '0')}`;
}
