import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect } from 'react-native-svg';

import { Floors, Wallpapers } from '@/constants/room-themes';

type Area = { x: number; y: number; width: number; height: number };
type FillProps = Area & { id: string; uid: string; dark: boolean };

/** 다크 모드에서는 무늬 위에 어둡게 덮는다 (벽지 색을 다크 토큰에 따로 두지 않기 위해) */
const DarkVeil = ({ x, y, width, height, dark }: Area & { dark: boolean }) =>
  dark ? <Rect x={x} y={y} width={width} height={height} fill="#0f1210" opacity={0.62} /> : null;

/** 벽지 (방 단위 좌표). uid는 화면에 여러 개 그릴 때 무늬 id가 겹치지 않게 한다 */
export function WallFill({ id, uid, dark, ...area }: FillProps) {
  const paper = Wallpapers.find((w) => w.id === id) ?? Wallpapers[0];
  const pid = `${uid}-wall-${paper.id}`;
  return (
    <G>
      <Defs>
        {paper.id === 'stripe' && (
          <Pattern id={pid} x={0} y={0} width={6} height={6} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={3} height={6} fill={paper.ink} />
          </Pattern>
        )}
        {paper.id === 'dots' && (
          <Pattern id={pid} x={0} y={0} width={6} height={6} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={0.9} fill={paper.ink} />
            <Circle cx={4.5} cy={4.5} r={0.9} fill={paper.ink} />
          </Pattern>
        )}
        {paper.id === 'check' && (
          <Pattern id={pid} x={0} y={0} width={8} height={8} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={8} height={1.2} fill={paper.ink} />
            <Rect x={0} y={0} width={1.2} height={8} fill={paper.ink} />
          </Pattern>
        )}
      </Defs>
      <Rect {...area} fill={paper.base} />
      {['stripe', 'dots', 'check'].includes(paper.id) && <Rect {...area} fill={`url(#${pid})`} />}
      <DarkVeil {...area} dark={dark} />
    </G>
  );
}

/** 바닥 (방 단위 좌표). 원목·타일은 소실점에서 퍼지는 선으로 원근을 준다 */
export function FloorFill({ id, uid, dark, ...area }: FillProps) {
  const floor = Floors.find((f) => f.id === id) ?? Floors[0];
  const { x, y, width, height } = area;
  const pid = `${uid}-floor-${floor.id}`;
  const cx = x + width / 2;
  // 판자·줄눈 선: 위쪽은 좁게, 아래쪽은 넓게
  const rays = Array.from({ length: 11 }, (_, i) => x - width * 0.6 + (width * 2.2 * i) / 10);
  return (
    <G>
      <Defs>
        {floor.id === 'herringbone' && (
          <Pattern id={pid} x={0} y={0} width={6} height={4} patternUnits="userSpaceOnUse">
            <Path d="M0 4 L3 1 M3 1 L6 4 M0 2 L1 1 M5 1 L6 2" stroke={floor.ink} strokeWidth={0.5} fill="none" />
          </Pattern>
        )}
        {floor.id === 'carpet' && (
          <Pattern id={pid} x={0} y={0} width={3} height={3} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={0.35} fill={floor.ink} />
          </Pattern>
        )}
      </Defs>
      <Rect {...area} fill={floor.base} />
      {(floor.id === 'herringbone' || floor.id === 'carpet') && <Rect {...area} fill={`url(#${pid})`} opacity={0.7} />}
      {(floor.id === 'wood' || floor.id === 'tile') && (
        <G opacity={0.6}>
          {rays.map((bx) => (
            <Line key={bx} x1={cx + (bx - cx) * 0.42} y1={y} x2={bx} y2={y + height} stroke={floor.ink} strokeWidth={0.35} />
          ))}
        </G>
      )}
      {floor.id === 'tile' &&
        [0.18, 0.4, 0.68].map((t) => (
          <Line key={t} x1={x} y1={y + height * t} x2={x + width} y2={y + height * t} stroke={floor.ink} strokeWidth={0.35} opacity={0.7} />
        ))}
      <DarkVeil {...area} dark={dark} />
    </G>
  );
}

/** 꾸미기 시트의 벽지·바닥 견본 */
export function SurfaceSwatch({ kind, id, size, dark }: { kind: 'wall' | 'floor'; id: string; size: number; dark: boolean }) {
  const Fill = kind === 'wall' ? WallFill : FloorFill;
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <Fill uid={`swatch-${kind}-${id}`} id={id} dark={dark} x={0} y={0} width={20} height={20} />
    </Svg>
  );
}
