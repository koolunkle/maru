/**
 * 디자인 토큰. 값의 출처는 DESIGN.md frontmatter — 여기서 임의로 바꾸지 말고 DESIGN.md와 함께 수정한다.
 */

import '@/global.css';

import type { TextStyle } from 'react-native';

import type { Enums } from '@/types/database';

import { ThemeVariants, type VariantName } from './theme-variants';

/** UI 비교안 미리보기용. 빌드할 때 EXPO_PUBLIC_THEME_VARIANT로 고르고, 없으면 기준안(A). theme-variants.ts 참고 */
const variant = ThemeVariants[process.env.EXPO_PUBLIC_THEME_VARIANT as VariantName] as
  | (typeof ThemeVariants)[VariantName]
  | undefined;

/** 비교안 이름. 기준안이면 null */
export const ThemeVariantLabel = variant?.label ?? null;

const BaseColors = {
  light: {
    canvas: '#faf9f7',
    surface: '#ffffff',
    surfaceSunken: '#f3f1ee',
    hairline: '#e8e5e0',
    hairlineStrong: '#cfcbc4',
    ink: '#2b2a27',
    slate: '#5f5d57',
    steel: '#6b6862',
    muted: '#b5b1a9',
    primary: '#4f5bd5',
    primaryPressed: '#3f4ab8',
    primarySoft: '#eceefb',
    onPrimary: '#ffffff',
    accent: '#f08a3e',
    accentInk: '#a8520f',
    accentSoft: '#fff1e5',
    success: '#2f9e5b',
    error: '#d9483b',
    helpSoft: '#e8f1fb',
    roomWall: '#f3ede4',
    roomFloor: '#e3d5c3',
  },
  dark: {
    canvas: '#151517',
    surface: '#1f1f22',
    surfaceSunken: '#1f1f22',
    hairline: '#2e2e33',
    hairlineStrong: '#2e2e33',
    ink: '#ecebe8',
    slate: '#a9a7a1',
    steel: '#a9a7a1',
    muted: '#5f5d57',
    primary: '#8a93f0',
    primaryPressed: '#6f79e6',
    primarySoft: '#262a4a',
    onPrimary: '#151517',
    accent: '#f5a065',
    accentInk: '#f5a065',
    accentSoft: '#2e2620',
    success: '#4cbb78',
    error: '#e8695e',
    helpSoft: '#1e2a38',
    roomWall: '#2a2723',
    roomFloor: '#3a332b',
  },
} as const;

export type ThemeColors = { [K in keyof typeof BaseColors.light]: string };

export const Colors: { light: ThemeColors; dark: ThemeColors } = variant?.colors ?? BaseColors;

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

const BaseRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Radius = variant?.radius ?? BaseRadius;

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
