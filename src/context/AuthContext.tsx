import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  profileToRow,
  rowToProfile,
  supabase,
  type ProfileRow,
} from "../lib/supabase";
import type { Profile, ProfileInput } from "../types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureProfile(user: User): Promise<Profile | null> {
  const meta = user.user_metadata ?? {};
  const seed = {
    id: user.id,
    email: user.email ?? null,
    full_name:
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      null,
    avatar_url:
      (meta.avatar_url as string | undefined) ||
      (meta.picture as string | undefined) ||
      null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(seed, { onConflict: "id" })
    .select(
      "id, email, full_name, avatar_url, birth_date, sex, height_cm, weight_kg, notes",
    )
    .single();

  if (error) {
    // Tabla profiles aún no creada: perfil mínimo desde Google
    if (
      error.message.includes("schema cache") ||
      error.code === "PGRST205" ||
      error.code === "42P01"
    ) {
      return {
        id: user.id,
        email: user.email ?? "",
        fullName: seed.full_name ?? "",
        avatarUrl: seed.avatar_url ?? undefined,
      };
    }
    console.error(error);
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: seed.full_name ?? "",
      avatarUrl: seed.avatar_url ?? undefined,
    };
  }

  return rowToProfile(data as ProfileRow);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const next = await ensureProfile(user);
    setProfile(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const next = await ensureProfile(data.session.user);
        if (mounted) setProfile(next);
      }
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          const next = await ensureProfile(nextSession.user);
          setProfile(next);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      if (!session?.user) throw new Error("No hay sesión activa");

      const { data, error } = await supabase
        .from("profiles")
        .update(profileToRow(input))
        .eq("id", session.user.id)
        .select(
          "id, email, full_name, avatar_url, birth_date, sex, height_cm, weight_kg, notes",
        )
        .single();

      if (error) throw error;
      setProfile(rowToProfile(data as ProfileRow));
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      session,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      refreshProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
