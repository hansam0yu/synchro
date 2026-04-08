import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../Types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // TODO: After successful sign-in, sync localStorage data to Supabase
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // TODO: After successful sign-up, sync localStorage data to Supabase
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // User data will remain in localStorage for guest mode
  };

  return { user, loading, signIn, signUp, signOut };
}
