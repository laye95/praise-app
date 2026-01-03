import { Tabs, Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { CustomTabBar } from "./_components/CustomTabBar";

export default function ChurchLayout() {
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile, isLoading, isFetching } = useUserProfile(userId);

  if (isLoading || (!profile && isFetching)) {
    return <LoadingScreen message="Loading church dashboard..." />;
  }

  if (!profile) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (!profile.church_id) {
    if (profile.role === "church_admin" || profile.role === "co_pastor") {
      return <Redirect href="/(dashboard)/(setup)/setup-church" />;
    }
    return <Redirect href="/(dashboard)/(member)/find-church" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="members/index"
        options={{
          title: "Members",
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: "Teams",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
