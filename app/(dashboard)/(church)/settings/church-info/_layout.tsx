import { Stack } from "expo-router";

export default function ChurchInfoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="general" />
    </Stack>
  );
}
