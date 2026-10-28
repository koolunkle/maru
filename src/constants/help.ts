import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/** 마음 휴게소(S10) 도움받을 수 있는 곳. PRD §8.4: 서울마음편의점 공식 안내 URL은 미확정이라 검색 링크를 둔다 */
export const HelpPlaces: {
  name: string;
  description: string;
  icon: ComponentProps<typeof Feather>['name'];
  url: string;
}[] = [
  { name: '외로움안녕120', description: '전화 120 · 누구나 편하게 이야기할 수 있는 서울시 창구', icon: 'phone', url: 'tel:120' },
  {
    name: '서울마음편의점',
    description: '예약 없이 들러 쉬어 가는 동네 공간',
    icon: 'map-pin',
    url: 'https://www.google.com/search?q=서울마음편의점',
  },
  {
    name: '청년마음건강 지원사업',
    description: '서울 청년(19~39세) 심리상담 · 청년몽땅정보통에서 신청',
    icon: 'heart',
    url: 'https://youth.seoul.go.kr',
  },
];
