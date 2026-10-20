import { Redirect, useLocalSearchParams } from 'expo-router';

import { EditableFields, SettingsEdit, type EditableField } from '@/screens/settings/edit';

function isEditableField(value: unknown): value is EditableField {
  return EditableFields.includes(value as EditableField);
}

export default function SettingsEditRoute() {
  const { field } = useLocalSearchParams<{ field: string }>();
  if (!isEditableField(field)) return <Redirect href="/settings" />;
  return <SettingsEdit field={field} />;
}
