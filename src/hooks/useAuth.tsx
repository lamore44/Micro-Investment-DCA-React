// ─────────────────────────────────────────────────────────
// Auth Context — provides session + user to entire app
// Splash auto-detects existing session → routes accordingly
// ─────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../services/api/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Check existing session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (mounted.current) {
          setSession(s);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted.current) setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted.current) setSession(s);
    });

    // Handle deep link on app resume (OAuth callback)
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url && url.includes('#')) {
        // Extract access_token and refresh_token from the fragment
        const params = url.split('#')[1];
        const hashParams = new URLSearchParams(params);
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        if (access_token && refresh_token) {
          try {
            await supabase.auth.setSession({ access_token, refresh_token });
          } catch {
            // Session already set via onAuthStateChange — ignore
          }
        }
      }
    };

    // Listen for deep link while app is already running
    const linkingListener = Linking.addEventListener('url', handleDeepLink);

    // Handle deep link that launched the app while it was closed
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
      linkingListener.remove();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      return {};
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'com.oksobatsister.microdca://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) return { error: error.message };
    if (data?.url) {
      await Linking.openURL(data.url);
    }
    return {};
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
};
