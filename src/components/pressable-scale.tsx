import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Motion } from '@/constants/theme';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean; hovered: boolean }) => StyleProp<ViewStyle>);
};

/** 모든 터치 요소 공통 눌림 피드백: opacity 0.85, scale 0.98 (DESIGN.md §6) */
export function PressableScale({ style, disabled, ...rest }: PressableScaleProps) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => {
        const { pressed } = state;
        const hovered = 'hovered' in state ? Boolean(state.hovered) : false;
        return [
          typeof style === 'function' ? style({ pressed, hovered }) : style,
          pressed && !disabled && { opacity: Motion.pressOpacity, transform: [{ scale: Motion.pressScale }] },
        ];
      }}
      {...rest}
    />
  );
}
