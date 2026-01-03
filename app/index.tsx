import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Redirect, useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const { session, isLoading: authLoading, user, signOut } = useAuth();
  const router = useRouter();
  const userId = user?.id || session?.user?.id;
  const {
    data: profile,
    isLoading: profileLoading,
    isFetching,
    error: profileError,
  } = useUserProfile(userId);

  useEffect(() => {
    const handleUserRecordNotFound = async () => {
      if (!profileError || !session) return;

      const errorMessage = (profileError?.message || "").toLowerCase();
      const errorCode = profileError?.code || "";
      const isUserRecordNotFound = 
        errorMessage.includes("user record not found") ||
        errorMessage.includes("referenced record not found") ||
        errorMessage.includes("record not found") ||
        errorCode === "DATABASE_NOT_FOUND" ||
        errorCode === "USER_RECORD_NOT_FOUND" ||
        errorCode === "PGRST116";

      if (isUserRecordNotFound) {
        console.error("User record not found. Logging out...", {
          error: profileError,
          message: profileError?.message,
          code: profileError?.code,
        });
        try {
          await signOut();
          router.replace("/(auth)/login");
        } catch (signOutError) {
          console.error("Error during sign out:", signOutError);
          router.replace("/(auth)/login");
        }
      }
    };

    handleUserRecordNotFound();
  }, [profileError, session, signOut, router]);

  if (authLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (session && (profileLoading || isFetching)) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const errorMessage = (profileError?.message || "").toLowerCase();
  const isUserRecordNotFound = 
    errorMessage.includes("user record not found") ||
    errorMessage.includes("referenced record not found") ||
    profileError?.code === "DATABASE_NOT_FOUND" ||
    profileError?.code === "USER_RECORD_NOT_FOUND";

  if (isUserRecordNotFound) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (!profile) {
    return <LoadingScreen message="Setting up..." />;
  }

  if (profile.church_id) {
    return <Redirect href="/(dashboard)/(church)/home" />;
  }

  if (profile.role === "church_admin" || profile.role === "co_pastor") {
    if (profileLoading || isFetching) {
      return <LoadingScreen message="Setting up your church..." />;
    }
    return <Redirect href="/(dashboard)/(setup)/setup-church" />;
  }

  return <Redirect href="/(dashboard)/(member)/find-church" />;
}
