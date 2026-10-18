import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

type Profile = Tables<'profiles'>;
type EditableProfile = Pick<
  TablesUpdate<'profiles'>,
  'nickname' | 'categories' | 'district' | 'daily_minutes' | 'onboarded_at'
>;

type SessionContextValue = {
  /** 세션·프로필 첫 로드가 끝났는지 */
  isReady: boolean;
  session: Session | null;
  profile: Profile | null;
  /** S1 '시작하기' — 익명 계정 생성 (PRD F1) */
  signInAnonymously: () => Promise<void>;
  updateProfile: (values: EditableProfile) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    async function apply(next: Session | null) {
      const nextProfile = next ? await fetchProfile(next.user.id).catch(() => null) : null;
      if (!active) return;
      setSession(next);
      setProfile(nextProfile);
      setIsReady(true);
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // 토큰 갱신은 사용자가 바뀌지 않으므로 프로필을 다시 읽지 않는다.
      if (event === 'TOKEN_REFRESHED') {
        setSession(next);
        return;
      }
      // onAuthStateChange 콜백 안에서 supabase 호출을 await하면 교착되므로 다음 틱으로 미룬다.
      setTimeout(() => apply(next), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    setProfile(await fetchProfile(session.user.id));
  }, [session]);

  const updateProfile = useCallback(
    async (values: EditableProfile) => {
      if (!session) throw new Error('로그인이 필요합니다');
      const { data, error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (error) throw error;
      setProfile(data);
    },
    [session],
  );

  return (
    <SessionContext
      value={{ isReady, session, profile, signInAnonymously, updateProfile, refreshProfile }}>
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있습니다');
  return value;
}
