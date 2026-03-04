import React, { useEffect, useState } from "react";
import {
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ZegoUIKitPrebuiltCallInCallScreen } from "@zegocloud/zego-uikit-prebuilt-call-rn";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/authContext";
import api from "@/utils/api";

export default function CallScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { callID, type, receiverId } = useLocalSearchParams();

  const isVideoCall = type === "video";
  const isExpoGo = Constants.appOwnership === "expo";

  const [permissionReady, setPermissionReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const appId = Number(process.env.EXPO_PUBLIC_APP_ID);
  const appSign = process.env.EXPO_PUBLIC_APP_SIGN;

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
        // iOS: xin quyền camera (micro thường sẽ hỏi lần đầu khi mở call)
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

  const saveCallRecord = async ({ status, durationSeconds }) => {
    // Lưu vào bảng calls (DB)
    if (!receiverId) return;
    try {
      await api.post("/calls", {
        senderId: user?._id,
        receiverId,
        type: isVideoCall ? "video" : "audio",
        status,
        duration: durationSeconds,
      });
    } catch (error) {
      console.log("Lỗi lưu call DB:", error?.response?.data || error?.message);
    }
  };

  const saveCallMessage = async ({ status, durationSeconds }) => {
    // Lưu vào messages (để hiện trong chat) - optional nhưng hữu ích
    try {
      const messageContent = JSON.stringify({
        isCall: true,
        callData: {
          type: isVideoCall ? "video" : "audio",
          status,
          duration: durationSeconds,
        },
      });
      await api.post("/messages", {
        conversationId: callID,
        content: messageContent,
        senderId: user?._id,
      });
    } catch (error) {
      console.log("Lỗi lưu call message:", error?.response?.data || error?.message);
    }
  };

  if (!user || !user._id) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang tải dữ liệu kết nối...</Text>
      </View>
    );
  }

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

  if (!permissionReady) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang xin quyền camera, micro...</Text>
      </View>
    );
  }

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

  if (!callID) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Thiếu thông tin cuộc gọi</Text>
        <Text style={styles.fallbackText}>Không có callID.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCallInCallScreen
        appID={appId}
        appSign={appSign}
        userID={String(user._id)}
        userName={String(user.name || "User")}
        callID={String(callID)}
        config={{
          turnOnCameraWhenJoining: isVideoCall,
          useSpeakerWhenJoining: isVideoCall,
          onHangUp: (duration) => {
            const durationSeconds =
              typeof duration === "number" && Number.isFinite(duration)
                ? Math.max(0, Math.floor(duration))
                : 0;
            Promise.all([
              saveCallRecord({ status: "completed", durationSeconds }),
              saveCallMessage({ status: "completed", durationSeconds }),
            ]).finally(() => router.back());
          },
          onError: () => {
            Promise.all([
              saveCallRecord({ status: "missed", durationSeconds: 0 }),
              saveCallMessage({ status: "missed", durationSeconds: 0 }),
            ]).finally(() => router.back());
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fallback: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#000" },
  fallbackTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  fallbackText: { color: "#d4d4d4", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  fallbackLink: { color: "#60a5fa", fontSize: 15, fontWeight: "600" },
  backBtn: { alignSelf: "flex-start" },
});