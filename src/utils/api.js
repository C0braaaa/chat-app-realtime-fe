import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.1.12:3000/v1/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Interceptor NHẬN VỀ (Response): Tự động bắt lỗi Token hết hạn (401)
api.interceptors.response.use(
  (response) => response, // Nếu thành công thì cho qua
  async (error) => {
    // Nếu Server trả về lỗi 401 (Token hết hạn hoặc không hợp lệ)
    if (error.response && error.response.status === 401) {
      console.log("Token hết hạn! Đang đăng xuất...");

      // B1: Xóa Token cũ đi
      await SecureStore.deleteItemAsync("authToken");

      // B2: Đá về màn hình Login
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  },
);

export default api;
