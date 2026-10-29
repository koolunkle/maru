import type { Enums } from '@/types/database';

/**
 * 벽지·바닥 (시안). DB 없이 지금 미션 기록으로 잠금을 풀고, 고른 값은 이 기기에만 저장한다.
 * 채택하면 furniture처럼 서버 규칙·보유 표로 옮긴다.
 */
export type ThemeRule =
  | { type: 'none' }
  | { type: 'category_count'; category: Enums<'mission_category'>; count: number }
  | { type: 'streak'; days: number }
  | { type: 'weekly_count'; count: number };

export type Wallpaper = { id: string; name: string; base: string; ink: string; rule: ThemeRule };
export type Floor = { id: string; name: string; base: string; ink: string; rule: ThemeRule };

export const Wallpapers: Wallpaper[] = [
  { id: 'plain', name: '기본 벽', base: '#eef0e6', ink: '#e3e6d9', rule: { type: 'none' } },
  { id: 'stripe', name: '세로 줄무늬', base: '#eef0e6', ink: '#dfe6d3', rule: { type: 'category_count', category: 'walk', count: 3 } },
  { id: 'dots', name: '물방울', base: '#f6efe2', ink: '#ead6b4', rule: { type: 'streak', days: 5 } },
  { id: 'check', name: '체크', base: '#eef3f6', ink: '#d6e2ea', rule: { type: 'category_count', category: 'culture', count: 2 } },
  { id: 'mint', name: '민트', base: '#dcefe4', ink: '#cfe6d8', rule: { type: 'weekly_count', count: 2 } },
];

export const Floors: Floor[] = [
  { id: 'wood', name: '원목', base: '#d9cfb8', ink: '#c9bea4', rule: { type: 'none' } },
  { id: 'herringbone', name: '헤링본', base: '#d6c3a0', ink: '#bea67e', rule: { type: 'category_count', category: 'food', count: 2 } },
  { id: 'tile', name: '타일', base: '#e4e1d8', ink: '#cdc8bb', rule: { type: 'category_count', category: 'neighborhood', count: 2 } },
  { id: 'carpet', name: '카펫', base: '#cddbc9', ink: '#bccdb7', rule: { type: 'category_count', category: 'people', count: 2 } },
];

export const DefaultTheme = { wallpaper: 'plain', floor: 'wood' };
export const themeStorageKey = (userId: string) => `room-theme:${userId}`;
