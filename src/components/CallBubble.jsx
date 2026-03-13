// src/components/CallBubble.jsx
import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Typo from "./Typo";
import moment from "moment";

const CallBubble = ({ item, currentUserId, onCallBack }) => {
  const isMe = item.callerId?._id?.toString() === currentUserId?.toString();
  const isMissed = item.status === "missed";
  const isRejected = item.status === "rejected";
  const isCompleted = item.status === "completed";
  const isVideo = item.callType === "video";

  const callIcon = isVideo ? "videocam" : "call";

  const iconColor = isCompleted ? colors.green : colors.rose;

  const title = isVideo ? "Cuộc gọi video" : "Cuộc gọi thoại";

  const getSubLabel = () => {
    if (isCompleted) {
      const s = item.duration || 0;
      if (s === 0) return "Cuộc gọi";
      const m = Math.floor(s / 60);
      const sec = s % 60;
      if (m === 0) return `${sec} giây`;
      return sec > 0 ? `${m} phút ${sec} giây` : `${m} phút`;
    }
    if (isMissed) return isMe ? "Không có người trả lời" : "Cuộc gọi nhỡ";
    if (isRejected)
      return isMe ? `${item.receiverId?.name} đã từ chối` : "Bạn đã từ chối";
    return "";
  };

  const timeLabel = item.created_at
    ? moment(item.created_at).format("h:mm A")
    : "";

  return (
    <View style={[styles.wrapper, isMe ? styles.myAlign : styles.theirAlign]}>
      <View
        style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
      >
        {/* Icon + text */}
        <View style={styles.row}>
          <View
            style={[styles.iconCircle, { backgroundColor: iconColor + "20" }]}
          >
            <Ionicons
              name={callIcon}
              size={verticalScale(20)}
              color={iconColor}
            />
          </View>

          <View style={styles.textBlock}>
            <Typo size={14} fontWeight="600" color={colors.text}>
              {title}
            </Typo>
            <Typo
              size={12}
              color={isMissed || isRejected ? colors.rose : colors.neutral500}
            >
              {getSubLabel()}
            </Typo>
          </View>
        </View>

        {/* Nút Gọi lại — chỉ hiện khi missed hoặc rejected */}
        {(isMissed || isRejected) && onCallBack && (
          <TouchableOpacity
            style={styles.callBackBtn}
            onPress={() => onCallBack(item)}
          >
            <Ionicons
              name={callIcon}
              size={verticalScale(13)}
              color={colors.black}
            />
            <Typo size={12} color={colors.black} fontWeight="600">
              Gọi lại
            </Typo>
          </TouchableOpacity>
        )}

        <Typo size={11} color={colors.neutral400} style={styles.time}>
          {timeLabel}
        </Typo>
      </View>
    </View>
  );
};

export default CallBubble;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacingY._12,
    maxWidth: "72%",
  },
  myAlign: { alignSelf: "flex-end" },
  theirAlign: { alignSelf: "flex-start" },
  bubble: {
    borderRadius: radius._15,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    gap: spacingY._7,
    minWidth: verticalScale(180),
  },
  myBubble: {
    backgroundColor: "#FFF5DC",
    borderWidth: 1,
    borderColor: "#FFE0A0",
  },
  theirBubble: {
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  iconCircle: {
    width: verticalScale(42),
    height: verticalScale(42),
    borderRadius: verticalScale(21),
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  callBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._5,
    alignSelf: "flex-start",
  },
  time: {
    alignSelf: "flex-end",
  },
});
