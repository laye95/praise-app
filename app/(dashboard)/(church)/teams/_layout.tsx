import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function TeamsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.pageBg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[teamId]" options={{ headerShown: false }} />
    </Stack>
  );
}
