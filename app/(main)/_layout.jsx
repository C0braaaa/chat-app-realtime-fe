import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      {/* <Stack.Screen
        name="profileModal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      /> */}
      {/* <Stack.Screen
        name="newConversationModal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      /> */}
      <Stack.Screen name="conversation" />
      <Stack.Screen
        name="callscreen"
        options={{ headerShown: false, animationEnabled: false }}
      />
    </Stack>
  );
}
