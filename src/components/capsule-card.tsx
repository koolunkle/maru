import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressableScale } from '@/components/pressable-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listCapsules, type Capsule } from '@/lib/capsule';

export function CapsuleCard() {
  const theme = useTheme();
  const [arrival, setArrival] = useState<Capsule | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    listCapsules().then((items) => { if (active) setArrival(items.find((item) => item.ready && !item.opened_at) ?? null); }, () => { if (active) setArrival(null); });
    return () => { active = false; };
  }, []));
  return (
    <PressableScale accessibilityRole="button" onPress={() => router.push({ pathname: '/capsule', params: arrival ? { id: arrival.id } : {} })}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
      <Feather name="mail" size={20} color={theme.accent} />
      <View style={styles.text}>
        <AppText variant="titleMd">타임캡슐</AppText>
        <AppText variant="caption" color="steel">
          {arrival ? `${arrival.days_ago}일 전의 내가 보낸 한 줄이 도착했어요` : '미래의 나에게 한 줄을 보내요'}
        </AppText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.steel} />
    </PressableScale>
  );
}
const styles = StyleSheet.create({
  card: { marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: { flex: 1 },
});
