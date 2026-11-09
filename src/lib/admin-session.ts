import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type AdminStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin';

export interface AdminSession {
  status: AdminStatus;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

async function resolveStatus(hasSession: boolean): Promise<AdminStatus> {
  if (!hasSession) return 'signed-out';
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw new Error(error.message);
  return data === true ? 'admin' : 'not-admin';
}

export function useAdminSession(): AdminSession {
  const [status, setStatus] = useState<AdminStatus>('loading');

  useEffect(() => {
    let active = true;

    const update = (hasSession: boolean) => {
      (async () => {
        try {
          const next = await resolveStatus(hasSession);
          if (active) setStatus(next);
        } catch {
          if (active) setStatus('not-admin');
        }
      })();
    };

    supabase.auth.getSession().then(({ data }) => update(Boolean(data.session)));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      update(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { status, signIn, signOut };
}
