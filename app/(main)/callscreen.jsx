import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import * as ImagePicker from "expo-image-picker";
import api from "@/utils/api";
import Constants from "expo-constants";

export default function CallScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { callID, type } = useLocalSearchParams();

  const isVideoCall = type === "video";
  const isExpoGo = Constants.appOwnership === "expo";

  const [ZegoUIKitPrebuiltCallInCallScreen, setZegoUIKitPrebuiltCallInCallScreen] =
    useState(null);
  const [zegoLoadFailed, setZegoLoadFailed] = useState(false);

  const [permissionReady, setPermissionReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const appId = Number(process.env.EXPO_PUBLIC_APP_ID);
  const appSign = process.env.EXPO_PUBLIC_APP_SIGN;

  // 1. Xin quyền camera + micro
  useEffect(() => {
    let cancelled = false;

    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          if (cancelled) return;

          const cameraOk =
            granted[PermissionsAndroid.PERMISSIONS.CAMERA] === "granted";
          const micOk =
            granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === "granted";

          if (cameraOk && micOk) {
            setPermissionReady(true);
          } else {
            setPermissionDenied(true);
          }
        } catch {
          if (!cancelled) setPermissionDenied(true);
        }
      } else {
        // iOS: xin quyền camera (micro sẽ hỏi lần đầu khi dùng)
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (cancelled) return;
        if (status === "granted") {
          setPermissionReady(true);
        } else {
          setPermissionDenied(true);
        }
      }
    };

    requestPermissions();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load component Zego khi đã sẵn sàng (user, quyền, env, không chạy trên Expo Go)
  useEffect(() => {
    if (isExpoGo) return;
    if (!user || !user._id) return;
    if (!permissionReady) return;
    if (!appId || !appSign) return;
    if (ZegoUIKitPrebuiltCallInCallScreen || zegoLoadFailed) return;

    try {
      // dynamic require để tránh crash trên Expo Go / khi thiếu native
      // eslint-disable-next-line global-require
      const mod = require("@zegocloud/zego-uikit-prebuilt-call-rn");
      const Comp = mod && mod.ZegoUIKitPrebuiltCallInCallScreen;
      if (Comp) {
        setZegoUIKitPrebuiltCallInCallScreen(() => Comp);
      } else {
        setZegoLoadFailed(true);
      }
    } catch {
      setZegoLoadFailed(true);
    }
  }, [
    isExpoGo,
    user,
    permissionReady,
    appId,
    appSign,
    ZegoUIKitPrebuiltCallInCallScreen,
    zegoLoadFailed,
  ]);

  // 3. Lưu lịch sử cuộc gọi sau khi kết thúc
  const handleSaveCallHistory = async () => {
    try {
      const messageContent = JSON.stringify({
        isCall: true,
        callData: {
          type: isVideoCall ? "video" : "audio",
          status: "completed",
          duration: 0,
        },
      });

      await api.post("/messages", {
        conversationId: callID,
        content: messageContent,
        senderId: user?._id,
      });
    } catch (error) {
      console.log("Lỗi bắn tin nhắn cuộc gọi:", error);
    }
  };

  // ====== Fallback UI các trường hợp ======

  // Chưa có user từ context
  if (!user || !user._id) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang tải dữ liệu kết nối...</Text>
      </View>
    );
  }

  // Bị từ chối quyền
  if (permissionDenied) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Cần quyền Camera và Micro</Text>
        <Text style={styles.fallbackText}>
          Vui lòng bật quyền Camera và Micro trong Cài đặt để gọi điện / video.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Đang xin quyền
  if (!permissionReady) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang xin quyền camera, micro...</Text>
      </View>
    );
  }

  // Thiếu APP_ID / APP_SIGN
  if (!appId || !appSign) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Thiếu cấu hình Zego</Text>
        <Text style={styles.fallbackText}>
          Cần cấu hình EXPO_PUBLIC_APP_ID và EXPO_PUBLIC_APP_SIGN.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Expo Go không hỗ trợ native của Zego
  if (isExpoGo) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Call không chạy trên Expo Go</Text>
        <Text style={styles.fallbackText}>
          Bạn cần mở app bằng bản dev-client hoặc APK build từ EAS để dùng gọi
          điện/video.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Load module Zego thất bại
  if (zegoLoadFailed || !ZegoUIKitPrebuiltCallInCallScreen) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Không thể tải Zego Call</Text>
        <Text style={styles.fallbackText}>
          Bản build hiện tại chưa nhúng đủ native modules của Zego hoặc load
          module thất bại. Hãy build lại (dev-client hoặc APK) và cài bản mới.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ====== Trường hợp OK: render Zego ======
  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCallInCallScreen
        appID={appId}
        appSign={appSign}
        userID={String(user._id)}
        userName={String(user.name || "User")}
        callID={String(callID || "")}
        config={{
          turnOnCameraWhenJoining: isVideoCall,
          useSpeakerWhenJoining: isVideoCall,
          onHangUp: () => {
            handleSaveCallHistory().finally(() => router.back());
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fallback: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  fallbackTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  fallbackText: {
    color: "#d4d4d4",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  fallbackLink: { color: "#60a5fa", fontSize: 15, fontWeight: "600" },
  backBtn: { alignSelf: "flex-start" },
});