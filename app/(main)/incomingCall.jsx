import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Vibration } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import Typo from "@/components/Typo";
import { useSocket } from "@/contexts/socketContext";

const IncomingCallScreen = () => {
  const router = useRouter();
  const { callerId, callerName, callerAvatar, callType, conversationId } =
    useLocalSearchParams();
  const { socket } = useSocket();

  // Rung điện thoại liên tục khi có cuộc gọi đến
  useEffect(() => {
    const pattern = [0, 500, 300, 500];
    Vibration.vibrate(pattern, true);
    return () => Vibration.cancel();
  }, []);

  const handleAccept = () => {
    Vibration.cancel();
    socket?.emit("call_accepted", { callerId });
    router.replace({
      pathname: "/(main)/callscreen",
      params: {
        callID: conversationId,
        type: callType,
        receiverId: callerId,
      },
    });
  };

  const handleDecline = () => {
    Vibration.cancel();
    socket?.emit("call_declined", { callerId });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.callerInfo}>
        <Avatar uri={callerAvatar} size={100} />
        <Typo
          size={28}
          fontWeight={"700"}
          color={colors.white}
          style={{ marginTop: spacingY._15 }}
        >
          {callerName}
        </Typo>
        <Typo
          size={16}
          color={colors.neutral400}
          style={{ marginTop: spacingY._7 }}
        >
          {callType === "video"
            ? "Cuộc gọi video đến..."
            : "Cuộc gọi thoại đến..."}
        </Typo>
      </View>

      <View style={styles.actions}>
        {/* Từ chối */}
        <View style={styles.actionItem}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={handleDecline}
          >
            <Ionicons
              name="call"
              size={32}
              color={colors.white}
              style={{ transform: [{ rotate: "135deg" }] }}
            />
          </TouchableOpacity>
          <Typo
            color={colors.white}
            size={13}
            style={{ marginTop: spacingY._7 }}
          >
            Từ chối
          </Typo>
        </View>

        {/* Chấp nhận */}
        <View style={styles.actionItem}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={handleAccept}
          >
            <Ionicons
              name={callType === "video" ? "videocam" : "call"}
              size={32}
              color={colors.white}
            />
          </TouchableOpacity>
          <Typo
            color={colors.white}
            size={13}
            style={{ marginTop: spacingY._7 }}
          >
            Chấp nhận
          </Typo>
        </View>
      </View>
    </View>
  );
};

export default IncomingCallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
    justifyContent: "space-between",
    paddingVertical: 80,
    paddingHorizontal: spacingX._20,
    alignItems: "center",
  },
  callerInfo: {
    alignItems: "center",
    marginTop: 40,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: spacingX._30,
  },
  actionItem: {
    alignItems: "center",
  },
  actionBtn: {
    width: 70,
    height: 70,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  declineBtn: {
    backgroundColor: colors.rose,
  },
  acceptBtn: {
    backgroundColor: colors.green,
  },
});
