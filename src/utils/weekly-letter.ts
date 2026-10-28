import { kstDate, kstWeekStart } from './date';

export const DemoLetter = {
  notice: '시연용 리포트예요. 기분 흐름과 문장은 예시이며, 내 기록을 분석하거나 AI로 보내지 않아요.',
  paragraphs: [
    '하루마다 마음의 무게가 조금씩 달라도 괜찮아요.',
    '잠깐 걸었던 길이나 따뜻한 한 끼처럼, 작은 순간을 한 줄로 남겨 볼까요?',
    '미션을 마친 날도 쉬어 간 날도 나만의 속도로 보낸 하루예요. 다음 주에도 가볍게 하나씩 해 봐요.',
  ],
  note: '집 앞을 잠깐 걸으니 바람이 시원했어요.',
  mission: '동네에서 5분 걷기',
  flow: [
    { day: '월', mood: '보통이에요', level: 3 },
    { day: '화', mood: '조금 무거워요', level: 4 },
    { day: '수', mood: '마음이 무거워요', level: 5 },
    { day: '목', mood: '조금 무거워요', level: 4 },
    { day: '금', mood: '보통이에요', level: 3 },
    { day: '토', mood: '조금 가벼워요', level: 2 },
    { day: '일', mood: '마음이 가벼워요', level: 1 },
  ],
} as const;

/** 실제 편지 보관 이력이 아닌, 이번 주와 지난 3주의 시연용 주차. */
export function demoLetterWeeks(today: string = kstDate()) {
  const start = Date.parse(`${kstWeekStart(today)}T00:00:00Z`);
  return Array.from({ length: 4 }, (_, index) =>
    new Date(start - index * 7 * 86_400_000).toISOString().slice(0, 10),
  );
}

export function formatLetterWeek(week: string) {
  const end = new Date(Date.parse(`${week}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10);
  return `${week.replaceAll('-', '.')} – ${end.replaceAll('-', '.')}`;
}
