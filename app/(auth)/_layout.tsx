import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="login/index" options={{ title: "Sign In" }} />
        <Stack.Screen name="register/index" options={{ title: "Sign Up" }} />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </>
  );
}
