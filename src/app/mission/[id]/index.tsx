import { useLocalSearchParams } from 'expo-router';

import { MissionDetail } from '@/screens/mission-detail';

export default function MissionRoute() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  return <MissionDetail missionId={id} type={type === 'weekly' ? 'weekly' : 'daily'} />;
}
