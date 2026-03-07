import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="newConversationModal" />
      <Stack.Screen name="profileModal" />
      <Stack.Screen name="incomingCall" />
    </Stack>
  );
}
