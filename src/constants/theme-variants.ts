/**
 * UI 비교안(임시). 검수가 끝나면 고른 안을 theme.ts·DESIGN.md에 반영하고 이 파일은 지운다.
 * 빌드할 때 EXPO_PUBLIC_THEME_VARIANT=forest|dusk로 고른다. 값이 없으면 theme.ts 기준안(A)을 쓴다.
 * 바꾸는 범위: 색(Colors)과 모서리(Radius)만. 글꼴·간격·화면 구조는 기준안과 같다.
 */

export type VariantName = 'forest' | 'dusk';

type Palette = {
  canvas: string; surface: string; surfaceSunken: string; hairline: string; hairlineStrong: string;
  ink: string; slate: string; steel: string; muted: string;
  primary: string; primaryPressed: string; primarySoft: string; onPrimary: string;
  accent: string; accentInk: string; accentSoft: string;
  success: string; error: string; helpSoft: string; roomWall: string; roomFloor: string;
};

type Variant = {
  label: string;
  colors: { light: Palette; dark: Palette };
  radius?: { sm: number; md: number; lg: number; xl: number; full: number };
};

export const ThemeVariants: Record<VariantName, Variant> = {
  /** B 숲길: 산책·성장(화분)과 이어지는 초록 강조, 햇살 노랑 보조. 바탕은 살짝 초록빛 흰색 */
  forest: {
    label: 'B 숲길',
    colors: {
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
    },
  },
  /** C 노을: 테라코타 강조와 청록 보조로 더 따뜻하게. 모서리를 한 단계 더 둥글게 */
  dusk: {
    label: 'C 노을',
    colors: {
      light: {
        canvas: '#fbf6f1',
        surface: '#fffdfa',
        surfaceSunken: '#f5ede4',
        hairline: '#eadfd3',
        hairlineStrong: '#d6c6b5',
        ink: '#2e2621',
        slate: '#63574d',
        steel: '#6b5e54',
        muted: '#bba99a',
        primary: '#a84a2f',
        primaryPressed: '#8c3c25',
        primarySoft: '#fbe9e2',
        onPrimary: '#ffffff',
        accent: '#3f8f8a',
        accentInk: '#22625e',
        accentSoft: '#e2f2f0',
        success: '#2f8f5b',
        error: '#a8242c',
        helpSoft: '#e6eff7',
        roomWall: '#f5ebe0',
        roomFloor: '#e3cdb5',
      },
      dark: {
        canvas: '#171412',
        surface: '#221d1a',
        surfaceSunken: '#221d1a',
        hairline: '#352d28',
        hairlineStrong: '#352d28',
        ink: '#efe9e4',
        slate: '#b0a59c',
        steel: '#b0a59c',
        muted: '#665b53',
        primary: '#f0936f',
        primaryPressed: '#e57a52',
        primarySoft: '#3a2620',
        onPrimary: '#171412',
        accent: '#6cc2bb',
        accentInk: '#6cc2bb',
        accentSoft: '#1d2e2c',
        success: '#4cbb78',
        error: '#f07a7f',
        helpSoft: '#1e2a38',
        roomWall: '#2c2520',
        roomFloor: '#3d332a',
      },
    },
    radius: { sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
  },
};
