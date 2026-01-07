import { Stack } from "expo-router";

export default function TeamDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="members/index" />
      <Stack.Screen name="groups/index" />
      <Stack.Screen name="groups/[groupId]/index" />
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="documents/index" />
    </Stack>
  );
}
