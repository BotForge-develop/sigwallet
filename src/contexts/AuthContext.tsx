import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isBiometricEnabled } from '@/lib/biometrics';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const biometricGateEnabled = Capacitor.isNativePlatform() && isBiometricEnabled();
  const isLockedRef = useRef(biometricGateEnabled);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (biometricGateEnabled && isLockedRef.current && event === 'INITIAL_SESSION') {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN') {
        isLockedRef.current = false;
      }

      if (event === 'SIGNED_OUT') {
        isLockedRef.current = biometricGateEnabled;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session
    const initializeAuth = async () => {
      if (biometricGateEnabled) {
        isLockedRef.current = true;
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void initializeAuth();

    // Lock app when it goes to background (banking behavior)
    if (Capacitor.isNativePlatform()) {
      const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && isBiometricEnabled()) {
          isLockedRef.current = true;
          void supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
          setUser(null);
          setSession(null);
        }
      });
      return () => {
        mounted = false;
        subscription.unsubscribe();
        listener.then(l => l.remove());
      };
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [biometricGateEnabled]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
