import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function SetupLayout() {
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile, isLoading, isFetching } = useUserProfile(userId);

  if (isLoading || isFetching || !profile) {
    return <LoadingScreen message="Loading setup..." />;
  }

  if (profile.church_id) {
    return <Redirect href="/(dashboard)/(church)/home" />;
  }

  if (profile.role !== "church_admin" && profile.role !== "co_pastor") {
    return <Redirect href="/find-church" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
