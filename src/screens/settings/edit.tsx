import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BackHeader } from '@/components/back-header';
import { Button } from '@/components/button';
import { CategoryPicker, DistrictPicker, MinutePicker, type Category } from '@/components/profile-fields';
import { Screen } from '@/components/screen';
import { MaxCategories } from '@/constants/domain';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

export const EditableFields = ['categories', 'district', 'minutes'] as const;
export type EditableField = (typeof EditableFields)[number];

const Titles: Record<EditableField, { title: string; hint: string }> = {
  categories: { title: '관심 카테고리', hint: `최대 ${MaxCategories}개까지 골라요` },
  district: { title: '생활권', hint: '동네 미션을 추천할 때 써요' },
  minutes: { title: '하루 가능 시간', hint: '미션 길이를 고를 때 써요' },
};

/** S9 설정 > 카테고리·구·시간 재설정 (PRD F1) */
export function SettingsEdit({ field }: { field: EditableField }) {
  const { profile, updateProfile } = useSession();
  const [categories, setCategories] = useState<Category[]>(profile?.categories ?? []);
  const [district, setDistrict] = useState<string | null>(profile?.district ?? null);
  const [minutes, setMinutes] = useState<number | null>(profile?.daily_minutes ?? null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const canSave = { categories: categories.length > 0, district: district !== null, minutes: minutes !== null }[field];

  async function save() {
    setSaving(true);
    setFailed(false);
    try {
      await updateProfile(
        field === 'categories' ? { categories } : field === 'district' ? { district } : { daily_minutes: minutes },
      );
      router.back();
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
          <Button label="저장" onPress={save} disabled={!canSave} loading={saving} />
        </View>
      }>
      <BackHeader title={Titles[field].title} />

      <View style={styles.heading}>
        <AppText variant="bodySm" color="steel">
          {Titles[field].hint}
        </AppText>
        <AppText variant="bodySm" color="steel">
          바꾼 내용은 내일 추천부터 반영돼요
        </AppText>
      </View>

      {field === 'categories' && <CategoryPicker value={categories} onChange={setCategories} />}
      {field === 'district' && <DistrictPicker value={district} onChange={setDistrict} />}
      {field === 'minutes' && <MinutePicker value={minutes} onChange={setMinutes} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.xxs,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  footer: {
    gap: Spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
