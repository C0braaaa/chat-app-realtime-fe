import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import React, { useState } from "react";
import { FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

import { useAuth } from "@/contexts/authContext";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Avatar from "./Avatar";
import Typo from "./Typo";
import { Image } from "expo-image";
import api from "@/utils/api";

const MessageItem = ({
  item,
  isDirect,
  onDelete,
  onEdit,
  themeBubbleColor,
  themeTextColor,
}) => {
  const { user } = useAuth();
  const isMe = item.isMe;
  const isLocal = item.isLocal;
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const handleSaveImage = async (imageUrl) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh");
        return;
      }

      const filename =
        FileSystem.documentDirectory + "cchat_" + Date.now() + ".jpg";
      const { uri } = await FileSystem.downloadAsync(imageUrl, filename);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Thành công", "Đã lưu ảnh vào thư viện");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu ảnh");
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      const res = await api.delete(`/messages/${item.id}`, {
        data: { userId: user._id },
      });
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

  const shouldShowAvatarAndName = !isMe;

  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage,
        isLocal && { opacity: 0.7 },
      ]}
    >
      {shouldShowAvatarAndName && (
        <Avatar
          size={35}
          uri={item.sender?.avatar}
          style={styles.messageAvatar}
        />
      )}
      <TouchableWithoutFeedback
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        <View
          style={[
            styles.messageBuddle,
            isMe
              ? { backgroundColor: themeBubbleColor || colors.myBubble }
              : styles.theirBudde,
          ]}
        >
          {shouldShowAvatarAndName && (
            <Typo color={colors.neutral900} fontWeight={"600"} size={13}>
              {item.sender?.name}
            </Typo>
          )}
          {item.attachement && (
            <View>
              <TouchableOpacity onPress={() => setShowImageViewer(true)}>
                <Image
                  source={item.attachement}
                  contentFit={"cover"}
                  style={styles.attachment}
                  transition={100}
                />
                {isLocal && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Fullscreen Image Viewer */}
              <Modal
                visible={showImageViewer}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageViewer(false)}
              >
                <View style={styles.imageViewerOverlay}>
                  {/* Nút đóng */}
                  <TouchableOpacity
                    style={styles.closeImageBtn}
                    onPress={() => setShowImageViewer(false)}
                  >
                    <Ionicons name="close" size={30} color="#fff" />
                  </TouchableOpacity>

                  {/* Nút lưu */}
                  <TouchableOpacity
                    style={styles.saveImageBtn}
                    onPress={() => handleSaveImage(item.attachement)}
                  >
                    <Ionicons name="download-outline" size={26} color="#fff" />
                    <Typo color="#fff" size={14}>
                      Lưu ảnh
                    </Typo>
                  </TouchableOpacity>

                  {/* Ảnh fullscreen */}
                  <Image
                    source={{ uri: item.attachement }}
                    style={styles.fullscreenImage}
                    contentFit="contain"
                  />
                </View>
              </Modal>
            </View>
          )}
          {item.content ? (
            <Typo
              size={15}
              color={isMe ? themeTextColor || colors.text : colors.text}
            >
              {item.content}
            </Typo>
          ) : null}
          <Typo
            style={{ alignSelf: "flex-end", marginTop: 4 }}
            size={11}
            fontWeight={"500"}
            color={isMe ? themeTextColor : colors.neutral900}
          >
            {item.createdAt}
          </Typo>
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContent}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDelete}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.white}
                  />
                  <Typo size={16} color={colors.white} fontWeight={"500"}>
                    Delete
                  </Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                  <Feather name="edit-2" size={20} color={colors.white} />
                  <Typo size={16} color={colors.white} fontWeight={"500"}>
                    Edit
                  </Typo>
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
  messageContainer: {
    flexDirection: "row",
    gap: spacingX._7,
    maxWidth: "80%",
    marginBottom: spacingY._12,
    alignItems: "center",
  },
  myMessage: { alignSelf: "flex-end" },
  theirMessage: { alignSelf: "flex-start" },
  messageAvatar: { alignSelf: "flex-end" },
  attachment: {
    height: verticalScale(180),
    width: verticalScale(180),
    borderRadius: radius._10,
  },
  messageBuddle: {
    padding: spacingX._10,
    borderRadius: radius._15,
    minWidth: 100,
  },
  myBuddle: { backgroundColor: colors.myBubble },
  theirBudde: { backgroundColor: colors.otherBubble },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._10,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  menuContent: {
    width: "100%",
    flexDirection: "row",
    alignSelf: "flex-end",
    justifyContent: "space-around",
    backgroundColor: "#292929",
    padding: spacingY._15,
    paddingLeft: spacingX._30,
    paddingRight: spacingX._30,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 5,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  closeImageBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  saveImageBtn: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 10,
  },
});
