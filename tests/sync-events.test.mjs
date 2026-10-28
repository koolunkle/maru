import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

async function loadModule(path, require = () => { throw new Error('Unexpected dependency'); }) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)(require, exports);
  return exports;
}

const kst = await loadModule('../supabase/functions/_shared/kst.ts');
const events = await loadModule('../supabase/functions/_shared/seoul-events.ts', (name) => {
  assert.equal(name, './kst.ts');
  return kst;
});

// 2026-10-28 서울 열린데이터광장 sample 응답에서 가져온 행
const exhibition = {
  CODENAME: '전시/미술',
  GUNAME: '도봉구',
  TITLE: '[서울시립 사진미술관] 포토 디스커버리 프로젝트 《기계적 시선: 접촉하여 보기》',
  PLACE: '서울시립 사진미술관 1층 로비',
  ORG_LINK: 'https://sema.seoul.go.kr/kr/whatson/exhibition/detail?exNo=1597041',
  HMPG_ADDR: 'https://culture.seoul.go.kr/culture/culture/cultureEvent/view.do?cultcode=159987&menuNo=200009',
  STRTDATE: '2026-10-28 00:00:00.0',
  END_DATE: '2026-12-20 00:00:00.0',
};
const today = '2026-10-28';

test('응답 코드에 따라 행·빈 목록·오류를 구분한다', () => {
  const ok = { culturalEventInfo: { list_total_count: 19672, RESULT: { CODE: 'INFO-000' }, row: [exhibition] } };
  assert.deepEqual(events.readEventPage(ok), { total: 19672, rows: [exhibition] });
  assert.deepEqual(events.readEventPage({ RESULT: { CODE: 'INFO-200' } }), { total: 0, rows: [] });
  assert.throws(() => events.readEventPage({ RESULT: { CODE: 'INFO-100' } }), /seoul_api_INFO-100/);
  assert.throws(() => events.readEventPage(null), /seoul_api_unknown/);
});

test('인증키는 주소에만 들어가고 오류 메시지에는 드러나지 않는다', () => {
  assert.equal(events.eventPageUrl('a/b', 1, 1000), 'http://openapi.seoul.go.kr:8088/a%2Fb/json/culturalEventInfo/1/1000/');
  assert.throws(() => events.readEventPage({ RESULT: { CODE: 'ERROR-335' } }), (e) => !e.message.includes('a/b'));
});

test('서울문화포털 cultcode를 고유 번호로 쓰고 날짜를 자른다', () => {
  assert.deepEqual(events.toEvent(exhibition, today), {
    external_id: 'seoul-culture:159987',
    district: '도봉구',
    title: exhibition.TITLE,
    place: '서울시립 사진미술관 1층 로비',
    url: exhibition.HMPG_ADDR,
    start_date: '2026-10-28',
    end_date: '2026-12-20',
  });
});

test('끝난 행사, 30일 넘게 남은 행사, 서울 밖·잘못된 날짜는 버린다', () => {
  assert.equal(events.toEvent({ ...exhibition, END_DATE: '2026-10-27 00:00:00.0', STRTDATE: '2026-10-01 00:00:00.0' }, today), null);
  assert.equal(events.toEvent({ ...exhibition, STRTDATE: '2026-11-28 00:00:00.0' }, today), null);
  assert.ok(events.toEvent({ ...exhibition, STRTDATE: '2026-11-27 00:00:00.0' }, today));
  assert.equal(events.toEvent({ ...exhibition, GUNAME: '' }, today), null);
  assert.equal(events.toEvent({ ...exhibition, GUNAME: '성남시' }, today), null);
  assert.equal(events.toEvent({ ...exhibition, END_DATE: '' }, today), null);
  assert.equal(events.toEvent({ ...exhibition, TITLE: '  ' }, today), null);
});

test('상세 주소가 없으면 다른 링크와 대체 키를 쓴다', () => {
  const event = events.toEvent({ ...exhibition, HMPG_ADDR: '' }, today);
  assert.equal(event.url, exhibition.ORG_LINK);
  assert.equal(event.external_id, `seoul-culture:2026-10-28:도봉구:${exhibition.TITLE}`);
});

test('같은 행사는 한 번만 upsert한다', () => {
  const a = events.toEvent(exhibition, today);
  const b = events.toEvent({ ...exhibition, PLACE: '로비' }, today);
  assert.deepEqual(events.uniqueEvents([a, b]), [b]);
});

test('구 목록은 앱의 Districts와 같다', async () => {
  const source = await readFile(new URL('../src/constants/domain.ts', import.meta.url), 'utf8');
  const app = source.match(/Districts = \[([\s\S]*?)\]/)[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
  assert.deepEqual([...events.Districts], app);
});
