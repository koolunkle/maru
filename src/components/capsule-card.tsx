import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listCapsules, type Capsule } from '@/lib/capsule';
import { HomeSheet } from '@/components/home-sheet';
import { CapsuleScreen } from '@/screens/capsule';

export function CapsuleCard() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [arrival, setArrival] = useState<Capsule | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    listCapsules().then((items) => { if (active) setArrival(items.find((item) => item.ready && !item.opened_at) ?? null); }, () => { if (active) setArrival(null); });
    return () => { active = false; };
  }, []));
  return (
    <>
    <PressableScale accessibilityRole="button" onPress={() => setVisible(true)}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
      <Feather aria-hidden name="mail" size={20} color={theme.accent} />
      <View style={styles.text}>
        <AppText variant="titleMd">타임캡슐</AppText>
        <AppText variant="caption" color="steel">
          {arrival ? `${arrival.days_ago}일 전의 내가 보낸 한 줄이 도착했어요` : '미래의 나에게 한 줄을 보내요'}
        </AppText>
      </View>
      <Feather aria-hidden name="chevron-right" size={20} color={theme.steel} />
    </PressableScale>
    {visible && <HomeSheet title="타임캡슐" onClose={() => { setVisible(false); listCapsules().then((items) => setArrival(items.find((item) => item.ready && !item.opened_at) ?? null), () => {}); }}><CapsuleScreen sheet arrivalId={arrival?.id} /></HomeSheet>}
    </>
  );
}
const styles = StyleSheet.create({
  card: { marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: { flex: 1 },
});
