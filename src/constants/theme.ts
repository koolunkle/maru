/**
 * 디자인 토큰. 값의 출처는 DESIGN.md frontmatter — 여기서 임의로 바꾸지 말고 DESIGN.md와 함께 수정한다.
 */

import '@/global.css';

import type { TextStyle } from 'react-native';

import type { Enums } from '@/types/database';

export const Colors = {
  light: {
    canvas: '#f7f8f4',
    surface: '#ffffff',
    surfaceSunken: '#eef1ea',
    hairline: '#e2e6dc',
    hairlineStrong: '#c8cfbf',
    ink: '#232822',
    slate: '#555c52',
    steel: '#5f665b',
    muted: '#aab2a3',
    primary: '#2b7656',
    primaryPressed: '#215f45',
    primarySoft: '#e3f2ea',
    onPrimary: '#ffffff',
    accent: '#f2b134',
    accentInk: '#7d5200',
    accentSoft: '#fff6dc',
    success: '#2f8f5b',
    error: '#c4463a',
    helpSoft: '#e6f0f7',
    roomWall: '#eef0e6',
    roomFloor: '#d9cfb8',
  },
  dark: {
    canvas: '#131614',
    surface: '#1c201d',
    surfaceSunken: '#1c201d',
    hairline: '#2a302b',
    hairlineStrong: '#2a302b',
    ink: '#e9ece6',
    slate: '#a3aa9f',
    steel: '#a3aa9f',
    muted: '#5c6358',
    primary: '#6cc59a',
    primaryPressed: '#52b083',
    primarySoft: '#1f3329',
    onPrimary: '#131614',
    accent: '#f5c463',
    accentInk: '#f5c463',
    accentSoft: '#2e2a1c',
    success: '#6cc59a',
    error: '#e8695e',
    helpSoft: '#1c2933',
    roomWall: '#232822',
    roomFloor: '#333a2c',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

type Category = Enums<'mission_category'>;

/** 미션 카드 배경 (라이트). 다크에서는 surface + 왼쪽 4px 막대로 대체한다. */
export const CategoryTint: Record<Category, string> = {
  walk: '#ddf2e3',
  food: '#ffe8d4',
  culture: '#e8e2f6',
  growth: '#fdf3cf',
  neighborhood: '#dcecfa',
  rhythm: '#f5efe3',
  people: '#fce3ec',
};

export const FontFamily = {
  regular: 'Pretendard-Regular',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const Typography = {
  display: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  titleLg: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 30, letterSpacing: -0.3 },
  titleMd: { fontFamily: FontFamily.semiBold, fontSize: 18, lineHeight: 26, letterSpacing: -0.2 },
  bodyMd: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: FontFamily.semiBold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: FontFamily.semiBold, fontSize: 16, lineHeight: 22 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 48,
} as const;

/** 웹에서 앱처럼 보이도록 하는 최대 컬럼 폭 (DESIGN.md §5.1) */
export const MaxContentWidth = 480;

/** DESIGN.md bottom-sheet.scrim */
export const SheetScrim = 'rgba(0,0,0,0.3)';

export const Motion = {
  pressOpacity: 0.85,
  pressScale: 0.98,
  pressMs: 100,
  hoverMs: 150,
} as const;
