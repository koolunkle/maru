import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/** 도움받을 수 있는 곳(S10 화면, 마음 보관함 바텀 시트)의 기관 목록. 서울마음편의점은 서울시 복지 누리집 사업 안내(지점 목록 포함), 청년마음편의점은 1호점이 있는 서울잇다플레이스 안내 */
export const HelpPlaces: {
  name: string;
  description: string;
  icon: ComponentProps<typeof Feather>['name'];
  url: string;
}[] = [
  {
    name: '외로움안녕120',
    description: '전화 120 · 누구나 편하게 이야기할 수 있는 서울시 창구',
    icon: 'phone',
    url: 'tel:120',
  },
  {
    name: '청년마음편의점',
    description: '청년 전용 공간 · 성동구 뚝섬역 근처, 평일 10~18시',
    icon: 'coffee',
    url: 'https://news.seoul.go.kr/welfare/archives/583054',
  },
  {
    name: '서울마음편의점',
    description: '동네 복지관 19곳 · 누구나 예약 없이 들러 쉬어 가는 곳',
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
