import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function DashboardLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <StatusBar style="auto" />
    </>
  );
}
