/**
 * 내 방 일러스트 색 (시안). 앱 토큰(roomWall·roomFloor·primary·accent)을 바탕으로 같은 차분한 톤에서 고른다.
 * 팀이 채택하면 DESIGN.md 토큰으로 옮긴다.
 */
export const RoomArt = {
  light: {
    baseboard: '#d8dccd',
    wallShade: '#e3e6d9',
    floorLine: '#c9bea4',
    floorShade: '#cfc4aa',
    rug: '#e3f2ea',
    rugEdge: '#bfdccb',
    frame: '#ffffff',
    frameEdge: '#c8cfbf',
    wood: '#b98a5e',
    woodDark: '#8f6640',
    pot: '#d98e62',
    potDark: '#b8714a',
    leaf: '#4f9a6b',
    leafLight: '#7cbf90',
    flower: '#f2b134',
    fabric: '#5f9c80',
    fabricDark: '#3f7a5f',
    metal: '#7d8578',
    paper: '#fffaf0',
    shadow: 'rgba(60, 50, 30, 0.14)',
    silhouette: '#c8cfbf',
    night: 'rgba(20, 26, 40, 0.38)',
    glow: '#ffe3a3',
  },
  dark: {
    baseboard: '#1b1f1a',
    wallShade: '#1f241e',
    floorLine: '#2a3024',
    floorShade: '#2e3428',
    rug: '#1f3329',
    rugEdge: '#2b4537',
    frame: '#2c322c',
    frameEdge: '#3a423a',
    wood: '#8a6a4c',
    woodDark: '#6b4f37',
    pot: '#a96d4d',
    potDark: '#87543a',
    leaf: '#5fae7f',
    leafLight: '#86c79e',
    flower: '#f5c463',
    fabric: '#4c8a6e',
    fabricDark: '#356a52',
    metal: '#8a9186',
    paper: '#e9e4d6',
    shadow: 'rgba(0, 0, 0, 0.3)',
    silhouette: '#3a423a',
    night: 'rgba(5, 8, 15, 0.42)',
    glow: '#f5c463',
  },
} as const;

export type RoomArtColors = Record<keyof (typeof RoomArt)['light'], string>;

export type DayPart = 'morning' | 'day' | 'evening' | 'night';

/** 창밖 하늘 (위 → 아래 그라데이션) */
export const Sky: Record<DayPart, { top: string; bottom: string; label: string }> = {
  morning: { top: '#f9dcc0', bottom: '#cfe6f2', label: '아침' },
  day: { top: '#9fd0ec', bottom: '#dcefd9', label: '낮' },
  evening: { top: '#f3b98c', bottom: '#c9a6d4', label: '저녁' },
  night: { top: '#1f2a44', bottom: '#3a4a6b', label: '밤' },
};
