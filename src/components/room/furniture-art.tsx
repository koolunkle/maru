import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { RoomArtColors } from '@/constants/room-art';
import type { PlantStage } from '@/utils/room-state';

export type FurnitureState = {
  plantStage: PlantStage;
  lampOn: boolean;
  clock: { hour: number; minute: number };
  posterTitle: string | null;
};

/** 가구별 가로:세로 (세로 64 기준). 바닥 가구는 넓게 그린다 */
export const ArtAspect: Record<string, number> = {
  plant: 1,
  lamp: 1,
  sofa: 1.6,
  shoe_rack: 1.3,
  clock: 1,
  poster: 0.8,
};

type Props = {
  id: string;
  /** 세로 크기(px) */
  height: number;
  colors: RoomArtColors;
  state: FurnitureState;
  /** 잠긴 가구: 한 가지 색 실루엣으로 그린다 */
  locked?: boolean;
};

/** 내 방 가구 일러스트 (시안, 플랫). 모든 도형은 세로 64 좌표계에서 바닥(y=62)에 붙여 그린다 */
export function FurnitureArt({ id, height, colors, state, locked }: Props) {
  const aspect = ArtAspect[id] ?? 1;
  const width = 64 * aspect;
  const c = (color: string) => (locked ? colors.silhouette : color);
  const shadow = locked ? 'transparent' : colors.shadow;

  return (
    <Svg width={height * aspect} height={height} viewBox={`0 0 ${width} 64`} aria-hidden>
      {id === 'plant' && <Plant c={c} colors={colors} stage={locked ? 'leafy' : state.plantStage} shadow={shadow} />}
      {id === 'lamp' && <Lamp c={c} colors={colors} on={!locked && state.lampOn} shadow={shadow} />}
      {id === 'sofa' && <Sofa c={c} colors={colors} shadow={shadow} />}
      {id === 'shoe_rack' && <ShoeRack c={c} colors={colors} shadow={shadow} />}
      {id === 'clock' && <Clock c={c} colors={colors} time={state.clock} locked={locked} />}
      {id === 'poster' && <Poster c={c} colors={colors} title={locked ? null : state.posterTitle} />}
    </Svg>
  );
}

type PartProps = { c: (color: string) => string; colors: RoomArtColors };

function Plant({ c, colors, stage, shadow }: PartProps & { stage: PlantStage; shadow: string }) {
  return (
    <G>
      <Ellipse cx={32} cy={61} rx={15} ry={2.5} fill={shadow} />
      {/* 잎: 단계마다 늘어난다 */}
      <Path d="M32 44 C31 36 32 30 32 26" stroke={c(colors.leaf)} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M32 34 C24 33 20 28 21 24 C27 24 31 28 32 34Z" fill={c(colors.leafLight)} />
      <Path d="M32 31 C40 30 44 25 43 21 C37 21 33 25 32 31Z" fill={c(colors.leaf)} />
      {stage !== 'sprout' && (
        <>
          <Path d="M32 40 C22 41 15 36 15 30 C23 29 30 33 32 40Z" fill={c(colors.leaf)} />
          <Path d="M32 38 C42 39 49 34 49 28 C41 27 34 31 32 38Z" fill={c(colors.leafLight)} />
          <Path d="M32 27 C29 20 30 14 33 11 C36 15 35 22 32 27Z" fill={c(colors.leaf)} />
        </>
      )}
      {stage === 'flower' && (
        <G>
          {[0, 72, 144, 216, 288].map((deg) => (
            <Ellipse
              key={deg}
              cx={33}
              cy={7}
              rx={2.6}
              ry={4.4}
              fill={c(colors.flower)}
              transform={`rotate(${deg} 33 11)`}
            />
          ))}
          <Circle cx={33} cy={11} r={2.4} fill={c(colors.paper)} />
        </G>
      )}
      <Path d="M21 44 H43 L40 61 H24 Z" fill={c(colors.pot)} />
      <Rect x={19} y={42} width={26} height={5} rx={1.5} fill={c(colors.potDark)} />
    </G>
  );
}

function Lamp({ c, colors, on, shadow }: PartProps & { on: boolean; shadow: string }) {
  return (
    <G>
      {on && <Circle cx={32} cy={22} r={20} fill={colors.glow} opacity={0.35} />}
      <Ellipse cx={32} cy={61} rx={12} ry={2.2} fill={shadow} />
      <Rect x={23} y={56} width={18} height={5} rx={2.5} fill={c(colors.woodDark)} />
      <Rect x={30.5} y={30} width={3} height={27} rx={1.5} fill={c(colors.metal)} />
      <Path d="M20 30 L25 12 H39 L44 30 Z" fill={c(on ? colors.glow : colors.flower)} />
      <Path d="M20 30 H44" stroke={c(colors.woodDark)} strokeWidth={1.5} />
    </G>
  );
}

function Sofa({ c, colors, shadow }: PartProps & { shadow: string }) {
  return (
    <G>
      <Ellipse cx={51} cy={61} rx={44} ry={3} fill={shadow} />
      <Rect x={14} y={14} width={74} height={28} rx={8} fill={c(colors.fabricDark)} />
      <Rect x={6} y={30} width={90} height={22} rx={7} fill={c(colors.fabric)} />
      <Rect x={2} y={24} width={14} height={30} rx={6} fill={c(colors.fabricDark)} />
      <Rect x={86} y={24} width={14} height={30} rx={6} fill={c(colors.fabricDark)} />
      <Line x1={51} y1={32} x2={51} y2={50} stroke={c(colors.fabricDark)} strokeWidth={1.2} opacity={0.6} />
      <Rect x={10} y={52} width={4} height={8} rx={1} fill={c(colors.woodDark)} />
      <Rect x={88} y={52} width={4} height={8} rx={1} fill={c(colors.woodDark)} />
    </G>
  );
}

function ShoeRack({ c, colors, shadow }: PartProps & { shadow: string }) {
  return (
    <G>
      <Ellipse cx={42} cy={61} rx={36} ry={2.5} fill={shadow} />
      <Rect x={6} y={26} width={72} height={4} rx={1.5} fill={c(colors.wood)} />
      <Rect x={6} y={44} width={72} height={4} rx={1.5} fill={c(colors.wood)} />
      <Rect x={6} y={26} width={4} height={36} rx={1} fill={c(colors.woodDark)} />
      <Rect x={74} y={26} width={4} height={36} rx={1} fill={c(colors.woodDark)} />
      {/* 운동화 두 켤레 */}
      <Path d="M14 26 C14 19 20 17 24 18 L28 22 H36 C38 22 39 24 39 26 Z" fill={c(colors.paper)} />
      <Path d="M14 26 H39" stroke={c(colors.fabric)} strokeWidth={2} />
      <Path d="M46 26 C46 19 52 17 56 18 L60 22 H68 C70 22 71 24 71 26 Z" fill={c(colors.flower)} />
      <Path d="M46 26 H71" stroke={c(colors.woodDark)} strokeWidth={2} />
      <Path d="M18 44 C18 38 23 36 27 37 L30 40 H38 C40 40 41 42 41 44 Z" fill={c(colors.fabric)} />
    </G>
  );
}

function Clock({ c, colors, time, locked }: PartProps & { time: { hour: number; minute: number }; locked?: boolean }) {
  const minuteDeg = time.minute * 6;
  const hourDeg = (time.hour % 12) * 30 + time.minute * 0.5;
  return (
    <G>
      <Circle cx={32} cy={33} r={24} fill={c(colors.woodDark)} />
      <Circle cx={32} cy={33} r={20} fill={c(colors.paper)} />
      {!locked &&
        [0, 90, 180, 270].map((deg) => (
          <Rect key={deg} x={31} y={15} width={2} height={4} rx={1} fill={colors.metal} transform={`rotate(${deg} 32 33)`} />
        ))}
      {!locked && (
        <>
          <Line x1={32} y1={33} x2={32} y2={22} stroke={colors.woodDark} strokeWidth={3} strokeLinecap="round" transform={`rotate(${hourDeg} 32 33)`} />
          <Line x1={32} y1={33} x2={32} y2={17} stroke={colors.metal} strokeWidth={2} strokeLinecap="round" transform={`rotate(${minuteDeg} 32 33)`} />
          <Circle cx={32} cy={33} r={2} fill={colors.woodDark} />
        </>
      )}
    </G>
  );
}

/** 다녀온 행사 이름을 두 줄(한 줄 8자)까지. 단어 사이에서 줄을 바꾸고 넘치면 말줄임 */
function posterLines(title: string) {
  const lines: string[] = [];
  let line = '';
  for (const word of title.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= 8) { line = next; continue; }
    if (line) lines.push(line);
    line = word.length > 8 ? `${word.slice(0, 7)}…` : word;
    if (lines.length === 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  if (lines.length === 2 && lines.join(' ').length < title.length && !lines[1].endsWith('…')) lines[1] = `${lines[1].slice(0, 7)}…`;
  return lines.slice(0, 2);
}

function Poster({ c, colors, title }: PartProps & { title: string | null }) {
  const lines = title ? posterLines(title) : [];
  return (
    <G>
      <Rect x={3} y={2} width={45.2} height={58} rx={2} fill={c(colors.frameEdge)} />
      <Rect x={6} y={5} width={39.2} height={52} rx={1} fill={c(colors.paper)} />
      <Circle cx={33} cy={17} r={6} fill={c(colors.flower)} />
      <Path d="M6 38 L18 24 L28 34 L34 28 L45.2 38 V40 H6 Z" fill={c(colors.fabric)} />
      {lines.map((line, i) => (
        <SvgText key={i} x={25.6} y={47 + i * 7} fontSize={5.6} fontWeight="700" textAnchor="middle" fill={colors.woodDark}>
          {line}
        </SvgText>
      ))}
    </G>
  );
}
