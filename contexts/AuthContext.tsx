import { supabase } from "@/services/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        setSession(null);
        setUser(null);
        setIsLoading(false);
      } else if (event === "SIGNED_IN") {
        queryClient.clear();
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (event === "USER_UPDATED" && session?.user?.id) {
          await queryClient.resetQueries();
          await queryClient.refetchQueries({
            queryKey: ["users", session.user.id],
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
