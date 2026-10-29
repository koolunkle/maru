import { Feather } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/app-text';
import { MaxContentWidth, Radius, SheetScrim, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 닫기 버튼·배경의 낭독 이름 (기본: "{title} 닫기") */
  closeLabel?: string;
  /** 저장 중처럼 닫으면 안 될 때 */
  closeDisabled?: boolean;
  /** 제목 위에 둘 아이콘·라벨 */
  header?: ReactNode;
  /** 제목이 바뀌면 낭독한다 (화면 전환이 있는 시트) */
  announceTitle?: boolean;
};

/** 공용 바텀 시트 (DESIGN.md §6: 250ms 슬라이드, 모션 줄이기면 페이드, 배경 SheetScrim, 키보드 회피, 안전 영역) */
export function BottomSheet({ title, onClose, children, closeLabel, closeDisabled, header, announceTitle }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const label = closeLabel ?? `${title.replace(/\n/g, ' ')} 닫기`;
  const close = () => { Keyboard.dismiss(); onClose(); };
  return <Modal visible transparent animationType="none" onRequestClose={() => { if (!closeDisabled) close(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={closeDisabled} onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: SheetScrim }]} />
      <Animated.View accessibilityViewIsModal entering={reduceMotion ? FadeIn.duration(150).reduceMotion(ReduceMotion.Never) : SlideInDown.duration(250).easing(Easing.bezier(0, 0, 0.58, 1))} style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Spacing.xl + insets.bottom }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={closeDisabled} onPress={close} style={[styles.close, { backgroundColor: theme.surfaceSunken }]}><Feather aria-hidden name="x" size={24} color={theme.slate} /></Pressable>
          {header}
          <AppText variant="display" accessibilityRole="header" accessibilityLiveRegion={announceTitle ? 'polite' : undefined} style={styles.title}>{title}</AppText>
          {children}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: MaxContentWidth, maxHeight: '90%', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  content: { gap: Spacing.md },
  close: { alignSelf: 'flex-end', width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
});
