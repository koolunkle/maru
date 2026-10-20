import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Categories, DailyMinuteOptions, Districts, MaxCategories } from '@/constants/domain';
import { Spacing } from '@/constants/theme';
import type { Enums } from '@/types/database';

import { MinuteOption } from './minute-option';

export type Category = Enums<'mission_category'>;

/** 관심 카테고리 최대 3개 (S2 1단계, S9 재설정) */
export function CategoryPicker({ value, onChange }: { value: Category[]; onChange: (next: Category[]) => void }) {
  function toggle(id: Category) {
    onChange(value.includes(id) ? value.filter((c) => c !== id) : [...value, id]);
  }
  return (
    <View style={styles.wrap}>
      {Categories.map((c) => {
        const selected = value.includes(c.id);
        return (
          <Chip
            key={c.id}
            label={c.label}
            selected={selected}
            disabled={!selected && value.length >= MaxCategories}
            onPress={() => toggle(c.id)}
          />
        );
      })}
    </View>
  );
}

/** 생활권 자치구 (S2 2단계, S9 재설정) */
export function DistrictPicker({ value, onChange }: { value: string | null; onChange: (next: string) => void }) {
  return (
    <View style={styles.grid}>
      {Districts.map((d) => (
        <Chip key={d} label={d} selected={value === d} onPress={() => onChange(d)} style={styles.gridItem} />
      ))}
    </View>
  );
}

/** 하루 가능 시간 (S2 3단계, S9 재설정) */
export function MinutePicker({ value, onChange }: { value: number | null; onChange: (next: number) => void }) {
  return (
    <View style={styles.list}>
      {DailyMinuteOptions.map((o) => (
        <MinuteOption
          key={o.value}
          label={o.label}
          description={o.description}
          selected={value === o.value}
          onPress={() => onChange(o.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
