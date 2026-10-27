import { useLocalSearchParams } from 'expo-router';

import { Letter } from '@/screens/letter';

export default function LetterRoute() {
  const { week } = useLocalSearchParams<{ week: string }>();
  return <Letter key={week} week={week} />;
}
