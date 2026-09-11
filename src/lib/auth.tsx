import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EmailOtpType, Session, User } from "@supabase/supabase-js";
import { store } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type Profile = {
  displayName: string;
  focuses: string[];
  onboardingComplete: boolean;
};

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  resendConfirmation: (email: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  completeOnboarding: (displayName: string, focuses: string[]) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(row: { display_name?: string | null; focuses?: string[] | null; onboarding_complete?: boolean | null }): Profile {
  return {
    displayName: row.display_name ?? "",
    focuses: row.focuses ?? [],
    onboardingComplete: Boolean(row.onboarding_complete),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;

    const hydrate = async (nextSession: Session | null) => {
      if (!active) return;
      setLoading(true);
      setError(null);
      setSession(nextSession);

      if (!nextSession?.user) {
        store.disconnect();
        setProfile(null);
        setLoading(false);
        return;
      }

      const user = nextSession.user;
      const [profileResult] = await Promise.all([
        client.from("profiles").select("display_name, focuses, onboarding_complete").eq("id", user.id).maybeSingle(),
        store.connect(user.id),
      ]);

      if (!active) return;
      if (profileResult.error) {
        setError(profileResult.error.message);
        setProfile({ displayName: "", focuses: [], onboardingComplete: false });
      } else {
        setProfile(profileResult.data ? mapProfile(profileResult.data) : { displayName: "", focuses: [], onboardingComplete: false });
      }
      setLoading(false);
    };

    const finishAuthRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type) {
        const { error: verificationError } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });

        window.history.replaceState({}, document.title, window.location.pathname);

        if (verificationError) {
          if (active) {
            setError(verificationError.message);
            setLoading(false);
          }
          return;
        }
      }

      const { data: sessionData } = await client.auth.getSession();
      await hydrate(sessionData.session);
    };

    void finishAuthRedirect();
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      void hydrate(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    user: session?.user ?? null,
    profile,
    error,
    async signIn(email, password) {
      if (!supabase) return "Account services are not configured yet.";
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      return signInError?.message ?? null;
    },
    async signUp(email, password) {
      if (!supabase) return "Account services are not configured yet.";
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      return signUpError?.message ?? null;
    },
    async resendConfirmation(email) {
      if (!supabase) return "Account services are not configured yet.";
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return resendError?.message ?? null;
    },
    async signInWithGoogle() {
      if (!supabase) return "Account services are not configured yet.";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      return oauthError?.message ?? null;
    },
    async signOut() {
      if (!supabase) return;
      await supabase.auth.signOut();
      store.disconnect();
    },
    async completeOnboarding(displayName, focuses) {
      if (!supabase || !session?.user) return "You need to sign in first.";
      const nextProfile = { displayName: displayName.trim(), focuses, onboardingComplete: true };
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: session.user.id,
        display_name: nextProfile.displayName,
        focuses,
        onboarding_complete: true,
      });
      if (profileError) return profileError.message;
      setProfile(nextProfile);
      return null;
    },
  }), [error, loading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
