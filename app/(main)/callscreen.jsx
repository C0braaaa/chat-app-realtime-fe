import React, { useEffect, useState, useRef } from "react";
import {
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@/contexts/authContext";
import api from "@/utils/api";
import CallingLoadingScreen from "@/components/CallingLoadingScreen";
import { fa } from "zod/v4/locales";

// ─── Singleton: chỉ init 1 lần duy nhất trong toàn bộ app lifecycle ───
let zegoInitialized = false;
let zegoInitPromise = null;

const initZegoOnce = (appId, appSign, userId, userName) => {
  if (zegoInitPromise) return zegoInitPromise;

  zegoInitPromise = new Promise((resolve, reject) => {
    try {
      // Nếu đã init rồi, resolve ngay
      if (zegoInitialized) {
        resolve();
        return;
      }

      const zegoModule = require("@zegocloud/zego-uikit-prebuilt-call-rn");
      const ZIM = require("zego-zim-react-native");
      const service = zegoModule.default;

      service
        .init(appId, appSign, String(userId), String(userName), [ZIM])
        .then(() => {
          zegoInitialized = true;
          resolve();
        })
        .catch((e) => {
          zegoInitPromise = null; // reset để thử lại
          reject(e);
        });
    } catch (e) {
      zegoInitPromise = null;
      reject(e);
    }
  });

  return zegoInitPromise;
};

const CallScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { callID, type, receiverId } = useLocalSearchParams();

  const appId = Number(process.env.EXPO_PUBLIC_APP_ID);
  const appSign = process.env.EXPO_PUBLIC_APP_SIGN;

  console.log("=== ZEGO RENDER ===", {
    appId,
    appSign: appSign ? "có" : "không",
    userID: String(user._id),
    callID: String(callID),
    type,
  });

  const isVideoCall = type === "video";
  const isExpoGo = Constants.appOwnership === "expo";

  const [permissionReady, setPermissionReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [zegoReady, setZegoReady] = useState(false);
  const [ZegoComponent, setZegoComponent] = useState(null);
  const [NavContainer, setNavContainer] = useState(null);
  const [StackNav, setStackNav] = useState(null);
  const [initError, setInitError] = useState(null);

  // Set Platform globally
  if (typeof global !== "undefined" && !global.Platform) {
    global.Platform = Platform;
  }

  // Xin quyền
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
          const ok =
            granted[PermissionsAndroid.PERMISSIONS.CAMERA] === "granted" &&
            granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === "granted";
          ok ? setPermissionReady(true) : setPermissionDenied(true);
        } catch {
          if (!cancelled) setPermissionDenied(true);
        }
      } else {
        const { ImagePicker } = require("expo-image-picker");
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (cancelled) return;
        status === "granted"
          ? setPermissionReady(true)
          : setPermissionDenied(true);
      }
    };
    requestPermissions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Init Zego (singleton - chỉ init 1 lần)
  useEffect(() => {
    if (isExpoGo || !appId || !appSign || !user?._id) {
      console.log("Zego init skipped:", {
        isExpoGo,
        hasAppId: !!appId,
        hasAppSign: !!appSign,
        hasUserId: !!user?._id,
      });
      return;
    }

    console.log("Starting Zego init with:", {
      appId,
      appSign,
      userId: user._id,
    });

    initZegoOnce(appId, appSign, user._id, user.name || "User")
      .then(() => {
        const zegoModule = require("@zegocloud/zego-uikit-prebuilt-call-rn");
        const { NavigationContainer } = require("@react-navigation/native");
        const {
          createNativeStackNavigator,
        } = require("@react-navigation/native-stack");

        setZegoComponent(() => zegoModule.ZegoUIKitPrebuiltCall);
        setNavContainer(() => NavigationContainer);
        setStackNav(() => createNativeStackNavigator());
        setZegoReady(true);
      })
      .catch((e) => {
        console.log("Zego init error:", e);
        setInitError(e?.message || "Lỗi khởi tạo Zego");
      });
  }, [isExpoGo, appId, appSign, user?._id]);

  const saveCallRecord = async ({ status, durationSeconds }) => {
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
      console.log(
        "Lỗi lưu call message:",
        error?.response?.data || error?.message,
      );
    }
  };

  // --- Fallbacks ---
  if (isExpoGo) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Call không chạy trên Expo Go</Text>
        <Text style={styles.fallbackText}>
          Cần build dev-client hoặc APK từ EAS.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user?._id) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Cần quyền Camera và Micro</Text>
        <Text style={styles.fallbackText}>
          Vui lòng bật quyền trong Cài đặt.
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Lỗi kết nối</Text>
        <Text style={styles.fallbackText}>{initError}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!zegoReady || !ZegoComponent || !NavContainer || !StackNav)
    return <CallingLoadingScreen onCancel={() => router.back()} type={type} />;

  const ZegoScreen = () => (
    <ZegoComponent
      appID={appId}
      appSign={appSign}
      userID={String(user._id)}
      userName={String(user.name || "User")}
      callID={String(callID)}
      config={{
        turnOnCameraWhenJoining: isVideoCall,
        useSpeakerWhenJoining: isVideoCall,
        autoAccept: false,
        ringtoneConfig: {
          incomingCallFileName: "",
          outgoingCallFileName: "",
        },
        onCallEnd: (cid, reason, duration) => {
          const durationSeconds = Math.max(0, Math.floor(duration || 0));
          Promise.all([
            saveCallRecord({ status: "completed", durationSeconds }),
            saveCallMessage({ status: "completed", durationSeconds }),
          ]).finally(() => router.back());
        },
      }}
    />
  );

  return (
    <NavContainer independent={true}>
      <StackNav.Navigator screenOptions={{ headerShown: false }}>
        <StackNav.Screen name="ZegoCall" component={ZegoScreen} />
      </StackNav.Navigator>
    </NavContainer>
  );
};

export default CallScreen;

const styles = StyleSheet.create({
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
