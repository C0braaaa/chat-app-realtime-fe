import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/contexts/authContext";

SplashScreen.preventAutoHideAsync();

// Setup notification handler globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Chỉ chạy khi authContext đã initialize
    if (typeof isAuthenticated === "undefined") {
      return;
    }

    const handleNavigation = async () => {
      try {
        const inMainGroup = segments[0] === "(main)";
        const inAuthGroup = segments[0] === "(auth)";

        // Delay một chút để đảm bảo router ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isAuthenticated && !inMainGroup) {
          await router.replace("/(main)/home");
        } else if (isAuthenticated === false && !inAuthGroup) {
          await router.replace("/(auth)/welcome");
        }
      } finally {
        // Ẩn Splash screen (bỏ log)
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    handleNavigation();
  }, [isAuthenticated, segments, router]);

  // Setup global notification listeners
  useEffect(() => {
    // Handle when user taps on notification (app in background/terminated)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const conversationId =
          response.notification.request.content.data?.conversationId;

        if (conversationId && isAuthenticated) {
          router.push({
            pathname: "/(main)/conversation",
            params: { conversationId },
          });
        }
      });

    // Handle when notification arrives while app is in foreground
    const notificationSubscription =
      Notifications.addNotificationReceivedListener(() => {});

    // Handle notification that triggered app launch
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response?.notification) {
          const conversationId =
            response.notification.request.content.data?.conversationId;
          if (conversationId && isAuthenticated) {
            router.push({
              pathname: "/(main)/conversation",
              params: { conversationId },
            });
          }
        }
      })
      .catch(() => {});

    return () => {
      Notifications.removeNotificationSubscription(responseSubscription);
      Notifications.removeNotificationSubscription(notificationSubscription);
    };
  }, [router, isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
