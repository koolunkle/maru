import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/** 마음 휴게소(S10) 도움받을 수 있는 곳. 서울마음편의점은 서울시 복지 누리집 사업 안내(지점 목록 포함) */
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
    url: 'https://news.seoul.go.kr/welfare/archives/569285',
  },
  {
    name: '청년마음건강 지원사업',
    description: '서울 청년(19~39세) 심리상담 · 청년몽땅정보통에서 신청',
    icon: 'heart',
    url: 'https://youth.seoul.go.kr',
  },
];
