import { Feather } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/app-text';
import { MaxContentWidth, Radius, SheetScrim, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function HomeSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const close = () => { Keyboard.dismiss(); onClose(); };
  return <Modal visible transparent animationType="none" onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel={title + ' 닫기'} onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: SheetScrim }]} />
      <Animated.View accessibilityViewIsModal entering={reduceMotion ? FadeIn.duration(150).reduceMotion(ReduceMotion.Never) : SlideInDown.duration(250).easing(Easing.bezier(0, 0, 0.58, 1))} style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: Spacing.xl + insets.bottom }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" accessibilityLabel={title + ' 닫기'} onPress={close} style={[styles.close, { backgroundColor: theme.surfaceSunken }]}><Feather aria-hidden name="x" size={24} color={theme.slate} /></Pressable>
          <AppText variant="display" accessibilityRole="header" style={styles.title}>{title}</AppText>
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
