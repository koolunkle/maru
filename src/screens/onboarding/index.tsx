import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { Categories, DailyMinuteOptions, Districts, MaxCategories } from '@/constants/domain';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import type { Enums } from '@/types/database';

import { MinuteOption } from './minute-option';
import { ProgressBar } from './progress-bar';

type Category = Enums<'mission_category'>;

const Steps = [
  { question: '요즘 해보고 싶은 건 뭐예요?', hint: `최대 ${MaxCategories}개까지 골라요` },
  { question: '주로 어느 동네에 있어요?', hint: '동네 미션을 추천할 때 써요' },
  { question: '하루에 얼마나 낼 수 있어요?', hint: '나중에 언제든 바꿀 수 있어요' },
] as const;

/** S2 온보딩 — 카테고리 → 구 → 하루 가능 시간 (PRD F1) */
export function Onboarding() {
  const { updateProfile } = useSession();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [district, setDistrict] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const canNext = [categories.length > 0, district !== null, minutes !== null][step];
  const isLast = step === Steps.length - 1;

  function toggleCategory(id: Category) {
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function next() {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      // onboarded_at이 채워지면 라우트 가드가 홈으로 보낸다.
      await updateProfile({
        categories,
        district,
        daily_minutes: minutes,
        onboarded_at: new Date().toISOString(),
      });
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {failed && (
            <AppText variant="caption" color="error" style={styles.center}>
              저장하지 못했어요. 다시 시도해 주세요.
            </AppText>
          )}
          <Button label={isLast ? '시작하기' : '다음'} onPress={next} disabled={!canNext} loading={saving} />
          {step > 0 && <Button label="이전" variant="ghost" onPress={() => setStep(step - 1)} />}
        </View>
      }>
      <ProgressBar total={Steps.length} current={step} />

      <View style={styles.heading}>
        <AppText variant="display">{Steps[step].question}</AppText>
        <AppText variant="bodySm" color="steel">
          {Steps[step].hint}
        </AppText>
      </View>

      {step === 0 && (
        <View style={styles.wrap}>
          {Categories.map((c) => {
            const selected = categories.includes(c.id);
            return (
              <Chip
                key={c.id}
                label={c.label}
                selected={selected}
                disabled={!selected && categories.length >= MaxCategories}
                onPress={() => toggleCategory(c.id)}
              />
            );
          })}
        </View>
      )}

      {step === 1 && (
        <View style={styles.grid}>
          {Districts.map((d) => (
            <Chip
              key={d}
              label={d}
              selected={district === d}
              onPress={() => setDistrict(d)}
              style={styles.gridItem}
            />
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.list}>
          {DailyMinuteOptions.map((o) => (
            <MinuteOption
              key={o.value}
              label={o.label}
              description={o.description}
              selected={minutes === o.value}
              onPress={() => setMinutes(o.value)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
  },
  list: {
    gap: Spacing.sm,
  },
  footer: {
    gap: Spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
