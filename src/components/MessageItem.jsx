import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { FontAwesome5, Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";

import { useAuth } from "@/contexts/authContext";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Avatar from "./Avatar";
import Typo from "./Typo";
import { Image } from "expo-image";
import api from "@/utils/api";

const MessageItem = ({ item, isDirect, onDelete, onEdit }) => {
  const { user } = useAuth();
  const isMe = item.isMe;
  const isLocal = item.isLocal;
  const [showMenu, setShowMenu] = useState(false);

  const formatDuration = (seconds) => {
    if (!seconds) return "0 giây";
    const d = moment.duration(seconds, "seconds");
    const m = d.minutes();
    const s = d.seconds();
    return m > 0 ? `${m} phút ${s > 0 ? s + " giây" : ""}` : `${s} giây`;
  };

  const BOT_ID = process.env.EXPO_PUBLIC_BOT_USER_ID;
  const senderIdStr = typeof item.sender === "object" ? item.sender?._id : item.sender;
  const isBotMessage = senderIdStr === BOT_ID;
  const shouldShowAvatarAndName = !isMe;

  // --- LOGIC PARSE "BÓC VỎ" NHIỀU LỚP AN TOÀN NHẤT ---
  let isCallMessage = false;
  let callData = null;

  try {
    let parsedContent = item.content;

    // Bóc lớp chuỗi thứ nhất
    if (typeof parsedContent === 'string') {
      parsedContent = JSON.parse(parsedContent);
    }
    
    // Bóc lớp chuỗi thứ hai (Bắt bệnh Double Stringify)
    if (typeof parsedContent === 'string') {
      parsedContent = JSON.parse(parsedContent);
    }

    // Đảm bảo dữ liệu bây giờ là Object thật sự
    if (parsedContent && typeof parsedContent === 'object' && parsedContent.isCall) {
      isCallMessage = true;
      callData = parsedContent.callData;
    }
  } catch (e) {
    // Nếu lỗi parse thì chắc chắn là tin nhắn text bình thường, không làm gì cả
  }

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      const res = await api.delete(`/messages/${item.id}`, { data: { userId: user._id } });
      if (res.data.success && onDelete) onDelete(item.id);
      else Alert.alert("Lỗi", "Không thể xóa tin nhắn");
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xóa tin nhắn");
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) onEdit(item);
  };

  const handleLongPress = () => {
    if (isMe) setShowMenu(true);
  };

  const renderCallBubble = () => {
    if (!callData) return null;

    const { type, status, duration } = callData;
    const isMissed = status === "missed" || status === "declined";

    // Jarvis sử dụng mã màu HEX #e11d48 thay cho colors.rose để loại bỏ hoàn toàn rủi ro thiếu biến theme
    const callColor = isMissed ? "#e11d48" : (isMe ? colors.neutral600 : colors.primary);
    const textColor = isMe ? colors.neutral600 : colors.neutral900;
    const subTextColor = isMissed ? "#e11d48" : (isMe ? colors.neutral500 : colors.neutral600);
    const bgColor = isMissed ? "rgba(225, 29, 72, 0.1)" : "rgba(0, 0, 0, 0.05)";

    const title = type === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại";
    const subTitle = isMissed ? "Cuộc gọi nhỡ" : formatDuration(duration);
    const iconName = type === "video" ? (isMissed ? "video-off" : "video") : (isMissed ? "phone-missed" : "phone");

    return (
      <View style={styles.callContainer}>
        <View style={[styles.callIconWrapper, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={iconName} size={24} color={callColor} />
        </View>
        <View style={styles.callTextWrapper}>
          <Typo fontWeight={"600"} color={textColor} size={15}>{title}</Typo>
          <Typo fontWeight={"500"} color={subTextColor} size={13}>{subTitle}</Typo>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage, isLocal && { opacity: 0.7 }]}>
      {shouldShowAvatarAndName && (
        <Avatar size={35} uri={item.sender?.avatar} style={styles.messageAvatar} />
      )}
      <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={400}>
        <View style={[styles.messageBuddle, isMe ? styles.myBuddle : styles.theirBudde]}>
          {shouldShowAvatarAndName && (
            <Typo color={colors.neutral900} fontWeight={"600"} size={13}>{item.sender?.name}</Typo>
          )}
          {isCallMessage ? (
            renderCallBubble()
          ) : (
            <>
              {item.attachement && (
                <View>
                  <Image source={item.attachement} contentFit={"cover"} style={styles.attachment} transition={100} />
                  {isLocal && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color={colors.white} />
                    </View>
                  )}
                </View>
              )}
              {item.content && <Typo size={15}>{item.content}</Typo>}
            </>
          )}
          <Typo style={{ alignSelf: "flex-end", marginTop: 4 }} size={11} fontWeight={"500"} color={colors.neutral600}>
            {item.createdAt}
          </Typo>
        </View>
      </TouchableWithoutFeedback>

      {/* Modal Menu */}
      <Modal visible={showMenu} transparent={true} animationType="slide" onRequestClose={() => setShowMenu(false)}>
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContent}>
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="copy-outline" size={20} color={colors.white} />
                  <Typo size={16} color={colors.white} fontWeight={"500"}>Copy</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color={colors.white} />
                  <Typo size={16} color={colors.white} fontWeight={"500"}>Delete</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                  <Feather name="edit-2" size={20} color={colors.white} />
                  <Typo size={16} color={colors.white} fontWeight={"500"}>Edit</Typo>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default MessageItem;

const styles = StyleSheet.create({
  messageContainer: { flexDirection: "row", gap: spacingX._7, maxWidth: "80%", marginBottom: spacingY._12, alignItems: "center" },
  myMessage: { alignSelf: "flex-end" },
  theirMessage: { alignSelf: "flex-start" },
  messageAvatar: { alignSelf: "flex-end" },
  attachment: { height: verticalScale(180), width: verticalScale(180), borderRadius: radius._10 },
  messageBuddle: { padding: spacingX._10, borderRadius: radius._15, minWidth: 100 },
  myBuddle: { backgroundColor: colors.myBubble },
  theirBudde: { backgroundColor: colors.otherBubble },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", borderRadius: radius._10 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  menuContent: { width: "100%", flexDirection: "row", alignSelf: "flex-end", justifyContent: "space-between", backgroundColor: "#292929", padding: spacingY._15, paddingBottom: spacingY._15, paddingLeft: spacingX._30, paddingRight: spacingX._30, elevation: 5 },
  menuItem: { flexDirection: "column", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 10, gap: 5 },

  // Style cho bong bóng cuộc gọi
  callContainer: { flexDirection: "row", alignItems: "center", gap: spacingX._10, paddingVertical: spacingY._5, minWidth: 160 },
  callIconWrapper: { padding: 10, borderRadius: radius.full, justifyContent: "center", alignItems: "center" },
  callTextWrapper: { flexDirection: "column", gap: 2, justifyContent: "center" },
});