import type { Enums } from '@/types/database';

type Category = Enums<'mission_category'>;

/** PRD F1 카테고리. 순서 = 온보딩 표시 순서 */
export const Categories: { id: Category; label: string }[] = [
  { id: 'walk', label: '산책·운동' },
  { id: 'food', label: '요리·식사' },
  { id: 'culture', label: '문화·전시' },
  { id: 'growth', label: '자기계발' },
  { id: 'neighborhood', label: '동네 탐방' },
  { id: 'rhythm', label: '생활 리듬' },
  { id: 'people', label: '사람 만나기' },
];

export const CategoryLabel = Object.fromEntries(Categories.map((c) => [c.id, c.label])) as Record<
  Category,
  string
>;

export const MaxCategories = 3;

export const Districts = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구',
  '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구',
  '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구',
] as const;

export const DailyMinuteOptions = [
  { value: 5, label: '5분', description: '집 근처에서 잠깐' },
  { value: 15, label: '15분', description: '동네 한 바퀴' },
  { value: 30, label: '30분 이상', description: '가까운 곳 다녀오기' },
] as const;

export const DailyMissionCount = 3;
