import { Tabs, Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { MemberTabBar } from "./_components/MemberTabBar";

export default function MemberLayout() {
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile, isLoading, isFetching } = useUserProfile(userId);

  if (isLoading || isFetching || !profile) {
    return <LoadingScreen message="Loading member dashboard..." />;
  }

  if (profile.church_id) {
    return <Redirect href="/(dashboard)/(church)/home" />;
  }

  if (profile.role === "church_admin" || profile.role === "co_pastor") {
    return <Redirect href="/setup-church" />;
  }

  return (
    <Tabs
      tabBar={(props) => <MemberTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="find-church/index"
        options={{
          title: "Find Church",
        }}
      />
      <Tabs.Screen
        name="applications/index"
        options={{
          title: "Applications",
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
