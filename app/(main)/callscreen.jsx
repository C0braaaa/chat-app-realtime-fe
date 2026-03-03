import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import api from "@/utils/api";

export default function CallScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { callID, type } = useLocalSearchParams();
  const isVideoCall = type === "video";

  let ZegoUIKitPrebuiltCallInCallScreen = null;
  try {
    // eslint-disable-next-line global-require
    ZegoUIKitPrebuiltCallInCallScreen =
      require("@zegocloud/zego-uikit-prebuilt-call-rn")
        ?.ZegoUIKitPrebuiltCallInCallScreen;
  } catch {
    ZegoUIKitPrebuiltCallInCallScreen = null;
  }

  if (!ZegoUIKitPrebuiltCallInCallScreen) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Call chưa chạy được trên Expo Go</Text>
        <Text style={styles.fallbackText}>
          Bạn cần build dev-client / APK (EAS build) để dùng chức năng gọi.
        </Text>
        <Text style={styles.fallbackLink} onPress={() => router.back()}>
          Quay lại
        </Text>
      </View>
    );
  }

  const handleSaveCallHistory = async () => {
    try {
      // 1. CHUẨN BỊ DATA
      const callType = isVideoCall ? "video" : "audio";
      const callStatus = "completed";
      const callDuration = 0;

      await api.post("/calls", {
        senderId: user?._id,
        receiverId: targetUserId, 
        type: callType,
        status: callStatus,
        duration: callDuration
      });

      const messageContent = JSON.stringify({
        isCall: true,
        callData: { type: callType, status: callStatus, duration: callDuration }
      });

      await api.post("/messages", {
        conversationId: callID,
        content: messageContent,
        senderId: user?._id
      });

    } catch (error) {
      console.log("Lỗi lưu lịch sử:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCallInCallScreen
        appID={Number(process.env.EXPO_PUBLIC_APP_ID)}
        appSign={process.env.EXPO_PUBLIC_APP_SIGN}
        userID={user?._id}
        userName={user?.name}
        callID={callID}
        config={{
            turnOnCameraWhenJoining: isVideoCall, 
            useSpeakerWhenJoining: isVideoCall,   
  
            onHangUp: () => {
              router.back();
            },
          }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  fallbackLink: {
    color: "#60a5fa",
    fontSize: 15,
    fontWeight: "600",
  },
});