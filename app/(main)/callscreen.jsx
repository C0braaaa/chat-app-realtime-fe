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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ─── Singleton init ───
let zegoInitialized = false;
let zegoInitPromise = null;

const initZegoOnce = (appId, appSign, userId, userName) => {
  if (zegoInitPromise) return zegoInitPromise;
  zegoInitPromise = new Promise((resolve, reject) => {
    try {
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
          zegoInitPromise = null;
          reject(e);
        });
    } catch (e) {
      zegoInitPromise = null;
      reject(e);
    }
  });
  return zegoInitPromise;
};

// ─── ZegoScreen tách ra NGOÀI để tránh re-create mỗi render ───
// Dùng module-level ref để truyền props
let _zegoProps = null;

const ZegoScreen = () => {
  const props = _zegoProps;
  if (!props) return null;
  const {
    ZegoComponent,
    appId,
    appSign,
    userId,
    userName,
    callID,
    isVideoCall,
    onCallEnd,
  } = props;
  return (
    <ZegoComponent
      appID={appId}
      appSign={appSign}
      userID={String(userId)}
      userName={String(userName)}
      callID={String(callID)}
      config={{
        turnOnCameraWhenJoining: isVideoCall,
        useSpeakerWhenJoining: isVideoCall,
        onCallEnd,
      }}
    />
  );
};

const Stack = createNativeStackNavigator();

const CallScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { callID, type, receiverId, isIncoming } = useLocalSearchParams();

  const appId = Number(process.env.EXPO_PUBLIC_APP_ID);
  const appSign = process.env.EXPO_PUBLIC_APP_SIGN;

  const isVideoCall = type === "video";
  const isExpoGo = Constants.appOwnership === "expo";

  const [permissionReady, setPermissionReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [zegoReady, setZegoReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const callStartedRef = useRef(false);

  if (typeof global !== "undefined" && !global.Platform) {
    global.Platform = Platform;
  }

  // Permissions
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
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
        setPermissionReady(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Init Zego + sendInvitation nếu là caller
  useEffect(() => {
    if (isExpoGo || !appId || !appSign || !user?._id) return;

    initZegoOnce(appId, appSign, user._id, user.name || "User")
      .then(() => {
        const zegoModule = require("@zegocloud/zego-uikit-prebuilt-call-rn");
        const ZegoComponent = zegoModule.ZegoUIKitPrebuiltCall;

        const saveCallRecord = async ({ status, durationSeconds }) => {
          if (!receiverId) return;
          try {
            await api.post("/calls", {
              senderId: user._id,
              receiverId,
              type: isVideoCall ? "video" : "audio",
              status,
              duration: durationSeconds,
            });
          } catch (e) {}
        };

        const saveCallMessage = async ({ status, durationSeconds }) => {
          try {
            await api.post("/messages", {
              conversationId: callID,
              content: JSON.stringify({
                isCall: true,
                callData: {
                  type: isVideoCall ? "video" : "audio",
                  status,
                  duration: durationSeconds,
                },
              }),
              senderId: user._id,
            });
          } catch (e) {}
        };

        // Set module-level props TRƯỚC KHI render NavigationContainer
        _zegoProps = {
          ZegoComponent,
          appId,
          appSign,
          userId: user._id,
          userName: user.name || "User",
          callID,
          isVideoCall,
          onCallEnd: (cid, reason, duration) => {
            const durationSeconds = Math.max(0, Math.floor(duration || 0));
            Promise.all([
              saveCallRecord({ status: "completed", durationSeconds }),
              saveCallMessage({ status: "completed", durationSeconds }),
            ]).finally(() => router.back());
          },
        };

        // Nếu là caller → sendInvitation
        if (isIncoming !== "true" && receiverId && !callStartedRef.current) {
          callStartedRef.current = true;
          try {
            const service = zegoModule.default;
            service
              .sendInvitation({
                invitees: [
                  { userID: String(receiverId), userName: String(receiverId) },
                ],
                type: isVideoCall ? 1 : 0,
                data: JSON.stringify({ callID: String(callID) }),
                timeout: 60,
              })
              .catch((e) => console.log("sendInvitation error:", e));
          } catch (e) {
            console.log("sendInvitation catch:", e);
          }
        }

        setZegoReady(true);
      })
      .catch((e) => setInitError(e?.message || "Lỗi khởi tạo Zego"));
  }, [isExpoGo, appId, appSign, user?._id]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      _zegoProps = null;
    };
  }, []);

  // Fallbacks
  if (isExpoGo)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Call không chạy trên Expo Go</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  if (!user?._id)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang tải...</Text>
      </View>
    );
  if (permissionDenied)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Cần quyền Camera và Micro</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  if (!permissionReady)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Đang xin quyền...</Text>
      </View>
    );
  if (!appId || !appSign)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Thiếu cấu hình Zego</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  if (!callID)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Thiếu thông tin cuộc gọi</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  if (initError)
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Lỗi kết nối: {initError}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.fallbackLink}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  if (!zegoReady)
    return <CallingLoadingScreen onCancel={() => router.back()} type={type} />;

  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ZegoCall" component={ZegoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
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
  fallbackText: { color: "#d4d4d4", fontSize: 14, marginBottom: 16 },
  fallbackLink: { color: "#60a5fa", fontSize: 15, fontWeight: "600" },
  backBtn: { alignSelf: "flex-start" },
});
