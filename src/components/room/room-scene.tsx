import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { FloorFill, WallFill } from '@/components/room/room-surfaces';
import { Sky, type DayPart, type RoomArtColors } from '@/constants/room-art';
import type { Enums } from '@/types/database';

type Slot = Enums<'room_slot'>;

/** 방 좌표계: 가로 100, 세로 85 (화면 비율 1:0.85와 같아 1단위 = 방 너비의 1%) */
export const SceneHeight = 85;

/**
 * 슬롯마다 가구를 놓는 기준점과 크기(방 단위).
 * 바닥·책상·창가는 아래 가운데(bottom), 벽은 가운데(center)에 맞춘다.
 */
export const SlotAnchor: Record<Slot, { x: number; y: number; height: number; align: 'bottom' | 'center' }> = {
  window: { x: 50, y: 29.5, height: 17, align: 'bottom' },
  desk: { x: 85, y: 52, height: 15, align: 'bottom' },
  'wall-1': { x: 17, y: 23, height: 19, align: 'center' },
  'wall-2': { x: 83, y: 21, height: 17, align: 'center' },
  'floor-1': { x: 25, y: 78, height: 20, align: 'bottom' },
  'floor-2': { x: 61, y: 81, height: 19, align: 'bottom' },
};

type SceneProps = { width: number; colors: RoomArtColors; wallpaper: string; floor: string; dark: boolean; dayPart: DayPart };

/** 방 배경: 벽지·걸레받이·바닥·러그·창문(시간대별 하늘)·책상 */
export function RoomScene({ width, colors, wallpaper, floor, dark, dayPart }: SceneProps) {
  const sky = Sky[dayPart];
  const night = dayPart === 'night';
  return (
    <Svg width={width} height={(width * SceneHeight) / 100} viewBox={`0 0 100 ${SceneHeight}`} style={StyleSheet.absoluteFill} aria-hidden>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky.top} />
          <Stop offset="1" stopColor={sky.bottom} />
        </LinearGradient>
        <LinearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.shadow} stopOpacity={1} />
          <Stop offset="0.4" stopColor={colors.shadow} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* 벽 */}
      <WallFill uid="scene" id={wallpaper} dark={dark} x={0} y={0} width={100} height={50} />
      <Rect x={0} y={0} width={100} height={3} fill={colors.wallShade} opacity={0.7} />
      <Rect x={0} y={46.5} width={100} height={3.5} fill={colors.baseboard} />

      {/* 바닥 */}
      <FloorFill uid="scene" id={floor} dark={dark} x={0} y={50} width={100} height={35} />
      <Rect x={0} y={50} width={100} height={35} fill="url(#floorShade)" />

      {/* 러그 */}
      <Ellipse cx={42} cy={75} rx={31} ry={6.5} fill={colors.rugEdge} />
      <Ellipse cx={42} cy={75} rx={28} ry={5.2} fill={colors.rug} />

      {/* 창문 */}
      <Rect x={35} y={5} width={30} height={25} rx={1.5} fill={colors.frame} />
      <Rect x={37} y={7} width={26} height={21} fill="url(#sky)" />
      {night ? (
        <G>
          <Circle cx={56} cy={12} r={2.6} fill="#f4ecd2" />
          <Circle cx={57.2} cy={11.2} r={2.2} fill={sky.top} />
          {[
            [41, 11],
            [46, 16],
            [50, 10],
            [43, 21],
            [60, 20],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.45} fill="#f4ecd2" />
          ))}
        </G>
      ) : (
        <G>
          <Circle cx={dayPart === 'evening' ? 44 : 56} cy={dayPart === 'day' ? 12 : 20} r={3} fill={dayPart === 'evening' ? '#f7a96b' : '#fff3c4'} />
          <Path d="M39 19 C41 17 44 17 45 19 C47 18.5 49 19.5 49 21 H39 Z" fill="#ffffff" opacity={0.85} />
        </G>
      )}
      {/* 창틀 십자 */}
      <Rect x={49.4} y={7} width={1.2} height={21} fill={colors.frame} />
      <Rect x={37} y={17} width={26} height={1.2} fill={colors.frame} />
      {/* 창턱 */}
      <Rect x={33} y={29} width={34} height={2.5} rx={0.8} fill={colors.frameEdge} />

      {/* 책상 (스탠드를 놓는 자리) */}
      <Rect x={72} y={52} width={26} height={2.6} rx={0.8} fill={colors.wood} />
      <Rect x={74} y={54.5} width={2} height={13} fill={colors.woodDark} />
      <Rect x={94} y={54.5} width={2} height={13} fill={colors.woodDark} />
      <Rect x={84} y={54.5} width={10} height={6} rx={0.6} fill={colors.wood} />
    </Svg>
  );
}

/** 밤에는 방을 어둡게 하고, 스탠드가 있으면 그 둘레를 밝힌다 (가구 위에 덮는다) */
export function RoomLight({ width, colors, dayPart, lampAt }: { width: number; colors: RoomArtColors; dayPart: DayPart; lampAt: { x: number; y: number } | null }) {
  if (dayPart !== 'night' && dayPart !== 'evening') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={(width * SceneHeight) / 100} viewBox={`0 0 100 ${SceneHeight}`} aria-hidden>
        <Defs>
          <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={colors.glow} stopOpacity={0.55} />
            <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={SceneHeight} fill={colors.night} opacity={dayPart === 'night' ? 1 : 0.45} />
        {lampAt && <Circle cx={lampAt.x} cy={lampAt.y} r={26} fill="url(#glow)" />}
      </Svg>
    </View>
  );
}
