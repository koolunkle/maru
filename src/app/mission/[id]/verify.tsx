import { useLocalSearchParams } from 'expo-router';

import { Verify } from '@/screens/verify';

export default function VerifyRoute() {
  const { id, um } = useLocalSearchParams<{ id: string; um: string }>();
  return <Verify missionId={id} userMissionId={um} />;
}
