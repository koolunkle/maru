// 서울 열린데이터광장 문화행사 정보(culturalEventInfo) 해석. Deno·Node 테스트 양쪽에서 쓰도록 외부 의존성을 두지 않는다.
import { addDays } from './kst.ts';

// 서울 열린데이터광장은 https를 지원하지 않는다. 인증키가 경로에 들어가므로 주소를 로그에 남기지 않는다.
export const SeoulOpenApi = 'http://openapi.seoul.go.kr:8088';
export const EventPageSize = 1000;
/** 추천은 7일 안의 행사만 쓰지만, 동기화가 며칠 실패해도 비지 않도록 30일치를 저장한다 */
export const EventWindowDays = 30;

/** src/constants/domain.ts Districts와 같은 목록. 프로필 district와 일치하는 행사만 저장한다 */
export const Districts = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구',
  '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구',
  '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구',
] as const;

export type SeoulEventRow = {
  GUNAME?: string;
  TITLE?: string;
  PLACE?: string;
  HMPG_ADDR?: string;
  ORG_LINK?: string;
  STRTDATE?: string;
  END_DATE?: string;
};

export type EventRecord = {
  external_id: string;
  district: string;
  title: string;
  place: string | null;
  url: string | null;
  start_date: string;
  end_date: string;
};

export function eventPageUrl(key: string, start: number, end: number) {
  return `${SeoulOpenApi}/${encodeURIComponent(key)}/json/culturalEventInfo/${start}/${end}/`;
}

/** 응답 본문 → 전체 건수와 행. 데이터 없음(INFO-200)은 빈 목록, 그 밖의 코드는 코드만 담아 예외 */
export function readEventPage(body: unknown): { total: number; rows: SeoulEventRow[] } {
  const root = (body ?? {}) as Record<string, any>;
  const page = root.culturalEventInfo;
  const code: string | undefined = page?.RESULT?.CODE ?? root.RESULT?.CODE;
  if (code === 'INFO-200') return { total: 0, rows: [] };
  if (code !== 'INFO-000' || !page) throw new Error(`seoul_api_${code ?? 'unknown'}`);
  return { total: Number(page.list_total_count) || 0, rows: Array.isArray(page.row) ? page.row : [] };
}

const DatePattern = /^\d{4}-\d{2}-\d{2}$/;

function cultcode(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get('cultcode');
  } catch {
    return null;
  }
}

/** 저장할 행사로 변환. 구가 목록에 없거나, 끝났거나, 저장 기간 밖이면 null */
export function toEvent(row: SeoulEventRow, today: string): EventRecord | null {
  const district = row.GUNAME?.trim() ?? '';
  const title = row.TITLE?.trim() ?? '';
  const start = row.STRTDATE?.slice(0, 10) ?? '';
  const end = row.END_DATE?.slice(0, 10) ?? '';
  if (!(Districts as readonly string[]).includes(district) || !title) return null;
  if (!DatePattern.test(start) || !DatePattern.test(end) || end < start) return null;
  if (end < today || start > addDays(today, EventWindowDays)) return null;

  // 상세 주소는 서울문화포털(HMPG_ADDR)을 우선한다. 그 cultcode가 행사 고유 번호다.
  const url = row.HMPG_ADDR?.trim() || row.ORG_LINK?.trim() || null;
  const code = cultcode(row.HMPG_ADDR?.trim() || null);
  return {
    external_id: code ? `seoul-culture:${code}` : `seoul-culture:${start}:${district}:${title}`,
    district,
    title,
    place: row.PLACE?.trim() || null,
    url,
    start_date: start,
    end_date: end,
  };
}

/** 같은 행사가 여러 번 오면 마지막 것만 남긴다(upsert 한 번에 같은 키가 두 번 있으면 실패한다) */
export function uniqueEvents(events: EventRecord[]) {
  return [...new Map(events.map((e) => [e.external_id, e])).values()];
}
