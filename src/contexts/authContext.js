import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);

  // 1. Tự động chạy khi mở App
  useEffect(() => {
    const loadTokenAndUser = async () => {
      try {
        // Lấy cả Token và User từ két sắt
        const token = await SecureStore.getItemAsync("authToken");
        const userString = await SecureStore.getItemAsync("userData"); // <--- MỚI

        if (token && userString) {
          // Nếu có đủ cả 2 thì khôi phục lại
          setUser(JSON.parse(userString)); // Biến chuỗi thành Object
          setIsAuthenticated(true);
        } else if (token) {
          // Trường hợp chỉ có token mà mất user (ít gặp) -> Vẫn cho là login nhưng user rỗng
          setIsAuthenticated(true);
          // (Tốt nhất chỗ này nên gọi API /me để lấy lại user, nhưng tạm thời thế này đã)
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    loadTokenAndUser();
  }, []);
  const setAuth = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    await SecureStore.setItemAsync("userData", JSON.stringify(userData));
  };

  // 3. Hàm logout: Xóa sạch sẽ
  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("userData");
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, setAuth, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return value;
};
