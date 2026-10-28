/**
 * 시트를 닫았다 열어도 작성 중인 입력을 유지하는 임시 보관함(#12).
 * 앱이 실행되는 동안 메모리에만 둔다. 기분·한 줄은 민감한 기록이라 기기 저장소에 남기지 않는다.
 */
const drafts = new Map<string, unknown>();

export function readDraft<T>(key: string): T | undefined {
  return drafts.get(key) as T | undefined;
}

export function writeDraft<T>(key: string, value: T) {
  drafts.set(key, value);
}

export function clearDraft(key: string) {
  drafts.delete(key);
}
