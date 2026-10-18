import { useLocalSearchParams } from 'expo-router';

import { Verify } from '@/screens/verify';

export default function VerifyRoute() {
  const { um } = useLocalSearchParams<{ id: string; um: string }>();
  return <Verify userMissionId={um} />;
}
