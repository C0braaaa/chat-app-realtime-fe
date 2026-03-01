import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/contexts/authContext";

SplashScreen.preventAutoHideAsync();

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Đang chờ lấy Token thì chưa làm gì cả
    if (typeof isAuthenticated === "undefined") return;

    // Kiểm tra xem đang ở khu vực nào
    const inMainGroup = segments[0] === "(main)";
    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && !inMainGroup) {
      // 1. Nếu ĐÃ LOGIN mà chưa ở trong (main) -> Đá thẳng vào Home
      router.replace("/(main)/home");
    } else if (isAuthenticated === false && !inAuthGroup) {
      // 2. Nếu CHƯA LOGIN mà đang lảng vảng ở ngoài -> Đá về Welcome
      router.replace("/(auth)/welcome");
    }

    // 3. Ẩn Splash ngay sau khi logic điều hướng chạy xong
    SplashScreen.hideAsync();
  }, [isAuthenticated, segments]);

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
