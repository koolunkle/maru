/** PRD §7.2 금칙어 — AI가 만든 사용자 노출 문구에 들어가면 안 된다. */
export const BannedWords = ['외로움', '외로운', '고립', '은둔', '우울', '상담', '치료', '극복', '실패'];

export function hasBannedWord(text: string) {
  return BannedWords.some((w) => text.includes(w));
}

/** 공통 문구 규칙 (프롬프트에 그대로 넣는다) */
export const CopyRules = `문구 규칙:
- 존댓말 해요체, 제안형("~해볼래요?", "~해요"). 명령형 금지.
- 다음 단어는 절대 쓰지 않는다: ${BannedWords.join(', ')}.
- 실패나 미완료를 지적하지 않는다.
- 이모지를 쓰지 않는다.`;
