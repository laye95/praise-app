import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.pageBg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="roles/index" />
      <Stack.Screen name="church-info" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
