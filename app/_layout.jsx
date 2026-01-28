import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/authContext";

// 2. Tạo component con để xử lý Logic điều hướng
const MainLayout = () => {
  const { isAuthenticated } = useAuth(); // Lấy trạng thái từ Context
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Nếu isAuthenticated là undefined nghĩa là đang check token, chưa làm gì cả
    if (typeof isAuthenticated === "undefined") return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      // 👉 Nếu ĐÃ login mà người dùng đang ở màn Login/Register -> Đá sang Home
      router.replace("/(main)/home");
    } else if (isAuthenticated === false && !inAuthGroup) {
      // 👉 Nếu CHƯA login mà người dùng đòi vào Home -> Đá về Login
      router.replace("/(auth)/welcome");
    }
  }, [isAuthenticated]); // Chạy lại mỗi khi trạng thái đăng nhập thay đổi

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
};

// 3. RootLayout chính: Chỉ làm nhiệm vụ bọc AuthProvider ra ngoài cùng
export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
