import { BackHeader } from '@/components/back-header';
import { DailyNoteCard } from '@/components/daily-note-card';
import { Screen } from '@/components/screen';
import { useSession } from '@/providers/session-provider';

export function DailyNoteScreen() {
  const { profile } = useSession();

  return (
    <Screen>
      <BackHeader title="한 줄 기록" />
      {profile && <DailyNoteCard key={profile.id} userId={profile.id} />}
    </Screen>
  );
}
