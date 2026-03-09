import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { io } from "socket.io-client";
import moment from "moment";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";

import ScreenWrapper from "@/components/ScreenWrapper";
import {
  colors,
  radius,
  spacingX,
  spacingY,
  CHAT_THEMES,
} from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import Typo from "@/components/Typo";
import MessageItem from "@/components/MessageItem";
import Input from "@/components/Input";
import api from "@/utils/api";
import { useAuth } from "@/contexts/authContext";
import MediaCollection from "@/components/MediaCollection";
import SearchMessagesModal from "@/components/SearchMessages";
import ThemeModal from "@/components/ThemeModal";
import { useSocket } from "@/contexts/socketContext";

const SOCKET_URL = "https://cchat-be.onrender.com";
const conversation = () => {
  // Lấy dữ liệu từ URL truyền sang (id, tên, avatar đối phương)
  const { conversationId, name, avatar, type, peerId } = useLocalSearchParams();
  const { user } = useAuth(); // Lấy thông tin user hiện tại từ Context
  const router = useRouter();
  const isGroup = type === "group";
  const { socket } = useSocket();

  // Hàm gọi video/audio
  const handleCall = (callType) => {
    if (!peerId) return Alert.alert("Lỗi", "Không tìm thấy người nhận");
    router.push({
      pathname: "/(main)/callscreen",
      params: {
        to: peerId,
        callType,
        name,
        avatar,
        isIncoming: "false",
      },
    });
  };

  // Các state quản lý UI và dữ liệu tin nhắn
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeKey, setThemeKey] = useState("0");

  const socketRef = useRef(null); // Lưu trữ instance của socket
  const flatListRef = useRef(null); // Dùng để điều khiển cuộn danh sách

  // Hàm xử lý xóa cuộc trò chuyện hoặc xóa nhóm
  const handleDeleteConversation = () => {
    setShowHeaderMenu(false);
    const alertTitle = isGroup ? "Xóa nhóm" : "Xóa cuộc trò chuyện";
    const alertMessage = isGroup
      ? "Bạn có chắc không? Hành động này sẽ xóa vĩnh viễn nhóm... Chỉ chủ nhóm mới làm được."
      : "Bạn có chắc muốn ẩn cuộc trò chuyện này?";

    Alert.alert(alertTitle, alertMessage, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            let res;
            if (isGroup) {
              // Gọi API xóa nhóm (quyền admin)
              res = await api.delete(`/conversations/group/${conversationId}`, {
                data: { userId: user._id },
              });
            } else {
              // Gọi API ẩn cuộc trò chuyện cá nhân
              res = await api.delete(`/conversations/${conversationId}`, {
                data: { userId: user._id },
              });
            }
            if (res.data.success) {
              Alert.alert("Thành công", res.data.message);
              router.replace("/(main)/home");
            }
          } catch (error) {
            Alert.alert(
              "Từ chối quyền",
              error.response?.data?.message || "Could not delete.",
            );
          }
        },
      },
    ]);
  };

  // Hàm đẩy ảnh lên Cloudinary và lấy URL về
  const uploadToCloudinary = async (fileUri) => {
    try {
      const data = new FormData();
      data.append("file", {
        uri: fileUri,
        type: "image/jpeg",
        name: "avatar.jpg",
      });
      data.append("upload_preset", "cchat-upload");
      data.append("cloud_name", "dbx1xoswm");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dbx1xoswm/image/upload",
        {
          method: "post",
          body: data,
        },
      );
      const fileData = await res.json();
      return fileData.secure_url;
    } catch (error) {
      console.log("Tải lên thất bại:", error);
      return null;
    }
  };

  // Hàm chuẩn hóa dữ liệu tin nhắn từ BE sang định dạng FE cần
  const processMessage = (msg) => {
    return {
      id: msg._id,
      content: msg.content,
      sender: msg.senderId,
      createdAt: moment(msg.created_at || msg.createdAt).format("h:mm A"),
      isMe: msg.senderId?._id === user?._id,
      attachement: msg.attachement,
    };
  };

  // Hàm gọi API cập nhật chủ đề (theme) cho cuộc hội thoại
  const handleSelectTheme = async (selectedKey) => {
    try {
      const res = await api.put(`/conversations/theme/${conversationId}`, {
        themeKey: selectedKey,
      });
      if (res.data.success) {
        setThemeKey(selectedKey);
        setShowThemeModal(false);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật chủ đề");
    }
  };

  // Tìm thông tin theme hiện tại dựa trên themeKey
  const currentTheme =
    CHAT_THEMES.find((t) => t.id === themeKey) || CHAT_THEMES[0];

  // Effect quản lý kết nối Socket và tải dữ liệu ban đầu
  useEffect(() => {
    if (!conversationId || !user) return;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      // Lắng nghe lỗi kết nối (hết hạn token)
      socketRef.current.on("connect_error", (err) => {
        if (
          err.message === "Invalid token" ||
          err.message === "Authentication error"
        ) {
          Alert.alert("Phiên hết hạn", "Vui lòng đăng nhập lại");
          SecureStore.deleteItemAsync("authToken");
          router.replace("/(auth)/login");
        }
      });

      // Tham gia vào phòng chat khi kết nối thành công
      socketRef.current.on("connect", () => {
        socketRef.current.emit("join_conversation", conversationId);
      });

      // Lắng nghe sự kiện đổi theme từ người khác
      socketRef.current.on("theme_updated", (data) => {
        if (data.conversationId === conversationId) setThemeKey(data.themeKey);
      });

      // Nhận tin nhắn mới theo thời gian thực
      socketRef.current.on("new_message", (newMsg) => {
        const formattedMsg = processMessage(newMsg);
        setMessages((prev) => {
          if (prev.some((m) => m.id === formattedMsg.id)) return prev;
          return [formattedMsg, ...prev];
        });
      });

      // Xử lý khi nhóm bị giải tán
      socketRef.current.on("group_deleted", (data) => {
        if (data.conversationId === conversationId) {
          Alert.alert("Thông báo", "Nhóm này đã bị giải tán bởi chủ nhóm.");
          router.replace("/(main)/home");
        }
      });

      // Xử lý khi có tin nhắn bị xóa
      socketRef.current.on("message_deleted", (deleteMsgId) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== deleteMsgId));
      });

      // Xử lý khi có tin nhắn được sửa
      socketRef.current.on("message_edited", (updatedMsg) => {
        const formattedMsg = processMessage(updatedMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === formattedMsg.id
              ? { ...m, content: formattedMsg.content }
              : m,
          ),
        );
      });
    };

    // Tải tin nhắn cũ và chi tiết theme từ Database
    const fetchInitialData = async () => {
      try {
        const msgRes = await api.get(
          `/messages/${conversationId}?userId=${user._id}`,
        );
        if (msgRes.data.success)
          setMessages(msgRes.data.data.map(processMessage));

        const convRes = await api.get(
          `/conversations/detail/${conversationId}`,
        );
        if (convRes.data.success && convRes.data.data.themeKey)
          setThemeKey(convRes.data.data.themeKey);
      } catch (error) {
        console.log("Fetch Error:", error);
      }
    };

    initSocket();
    fetchInitialData();

    // Dọn dẹp socket khi thoát màn hình
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_conversation", conversationId);
        socketRef.current.off("theme_updated");
        socketRef.current.disconnect();
      }
    };
  }, [conversationId, user]);

  // Hàm xử lý gửi tin nhắn (bao gồm cả gửi mới và sửa tin)
  const handleSendMessage = async () => {
    if (!message.trim() && !image) return;

    // Nếu đang ở chế độ sửa tin nhắn
    if (editingMessage) {
      const contentToUpdate = message;
      const msgId = editingMessage.id;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: contentToUpdate } : m,
        ),
      );
      setMessage("");
      setEditingMessage(null);

      try {
        await api.put(`/messages/${msgId}`, {
          userId: user._id,
          content: contentToUpdate,
        });
      } catch (error) {
        Alert.alert("Lỗi", "Cập nhật thất bại");
      }
      return;
    }

    // Cơ chế tin nhắn giả (Optimistic UI) để app mượt hơn
    const tempId = Date.now().toString();
    const tempMsg = {
      id: tempId,
      content: message,
      attachement: image,
      sender: user,
      createdAt: moment().format("h:mm A"),
      isMe: true,
      isLocal: true,
    };
    setMessages((prev) => [tempMsg, ...prev]);

    const contentToSend = message;
    const imageToSend = image;
    setMessage("");
    setImage(null);

    try {
      let attachmentUrl = null;
      if (imageToSend) attachmentUrl = await uploadToCloudinary(imageToSend);

      const res = await api.post("/messages", {
        conversationId,
        content: contentToSend,
        attachement: attachmentUrl,
        senderId: user?._id,
      });
      if (res.data.success) {
        const formattedMsg = processMessage(res.data.data);
        setMessages((prev) => {
          const isSocketAdded = prev.some((m) => m.id === formattedMsg.id);
          return isSocketAdded
            ? prev.filter((m) => m.id !== tempId)
            : prev.map((m) => (m.id === tempId ? formattedMsg : m));
        });
      }
    } catch (error) {
      Alert.alert("Lỗi", "Gửi tin thất bại");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Chọn ảnh từ thư viện
  const onPickFile = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Nhấn vào tin nhắn từ kết quả tìm kiếm để cuộn tới
  const handleSelectSearchMessage = (item) => {
    setShowSearch(false);
    setTimeout(() => {
      if (!item || !item._id) return;
      const index = messages.findIndex((m) => m.id === item._id);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      } else {
        Alert.alert("Thông báo", "Tin nhắn quá xa...");
      }
    }, 300);
  };

  return (
    <ScreenWrapper showPattern={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Header
          style={styles.header}
          leftIcon={
            <View style={styles.headerLeft}>
              <BackButton />
              <Avatar size={40} uri={avatar} isGroup={type === "group"} />
              <Typo color={colors.white} fontWeight={"500"} size={20}>
                {name}
              </Typo>
            </View>
          }
          rightIcon={
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacingX._40,
              }}
            >
              {!isGroup && (
                <>
                  <TouchableOpacity
                    hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                    onPress={() => handleCall("audio")}
                  >
                    <Ionicons name="call" size={22} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                    onPress={() => handleCall("video")}
                  >
                    <Ionicons name="videocam" size={24} color="white" />
                  </TouchableOpacity>
                </>
              )}

              {/* ICON MENU 3 CHẤM LUÔN HIỂN THỊ */}
              <TouchableOpacity
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                onPress={() => setShowHeaderMenu(true)}
              >
                <FontAwesome5 name="ellipsis-v" size={22} color="white" />
              </TouchableOpacity>
            </View>
          }
        />

        <Modal
          visible={showHeaderMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHeaderMenu(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowHeaderMenu(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.headerMenuContent}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowHeaderMenu(false);
                      setShowSearch(true);
                    }}
                  >
                    <Ionicons name="search" size={20} color={colors.primary} />
                    <Typo size={16} color={colors.white} fontWeight={"500"}>
                      Tìm kiếm
                    </Typo>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowHeaderMenu(false);
                      setShowMedia(true);
                    }}
                  >
                    <Ionicons name="images" size={20} color={colors.primary} />
                    <Typo size={16} color={colors.white} fontWeight={"500"}>
                      File phương tiện
                    </Typo>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowHeaderMenu(false);
                      setShowThemeModal(true);
                    }}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Typo size={16} color={colors.white} fontWeight={"500"}>
                      Đổi chủ đề
                    </Typo>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleDeleteConversation}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Typo size={16} color={colors.white} fontWeight={"500"}>
                      Xóa trò chuyện
                    </Typo>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View
          style={[
            styles.content,
            {
              backgroundColor:
                currentTheme.id === "0" ? colors.white : "transparent",
            },
          ]}
        >
          {currentTheme.uri && (
            <Image
              source={{ uri: currentTheme.uri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }}
            renderItem={({ item }) => (
              <MessageItem
                item={item}
                isDirect={type === "direct"}
                onDelete={(deleteId) =>
                  setMessages((prev) => prev.filter((m) => m.id !== deleteId))
                }
                onEdit={(msg) => {
                  setEditingMessage(msg);
                  setMessage(msg.content);
                }}
                themeBubbleColor={currentTheme.bubbleColor}
                themeTextColor={currentTheme.textColor}
              />
            )}
            keyExtractor={(item) => item.id}
          />

          <View style={[styles.footer, { backgroundColor: "transparent" }]}>
            <Input
              value={message}
              onChangeText={setMessage}
              containerStyle={{
                paddingLeft: spacingX._10,
                paddingRight: scale(65),
                borderWidth: 0,
              }}
              placeholder="Nhập tin nhắn"
              onSubmitEditing={handleSendMessage}
              icon={
                <TouchableOpacity style={styles.inputIcon} onPress={onPickFile}>
                  <Ionicons
                    name="add"
                    size={verticalScale(26)}
                    color={colors.black}
                  />
                  {image && (
                    <Image
                      source={{ uri: image }}
                      style={styles.selectedFile}
                    />
                  )}
                </TouchableOpacity>
              }
            />
            <View style={styles.inputRightIcon}>
              <TouchableOpacity
                style={styles.inputIcon}
                onPress={handleSendMessage}
              >
                <FontAwesome5
                  name="paper-plane"
                  size={verticalScale(20)}
                  color={colors.black}
                  solid
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={showMedia} animationType="slide" transparent={false}>
        <ScreenWrapper style={{ backgroundColor: colors.neutral900 }}>
          <Header
            title="Ảnh"
            leftIcon={
              <TouchableOpacity
                onPress={() => setShowMedia(false)}
                style={{ marginLeft: spacingX._10 }}
              >
                <Ionicons name="chevron-back" size={30} color={colors.white} />
              </TouchableOpacity>
            }
          />
          <MediaCollection
            messages={messages}
            onSelectImage={(item) => scrollToMessage(item)}
          />
        </ScreenWrapper>
      </Modal>
      <SearchMessagesModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        conversationId={conversationId}
        onSelectMessage={handleSelectSearchMessage}
      />
      <ThemeModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onSelect={handleSelectTheme}
        currentThemeKey={themeKey}
      />
    </ScreenWrapper>
  );
};

export default conversation;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15,
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  inputRightIcon: {
    position: "absolute",
    right: scale(10),
    top: verticalScale(15),
    paddingLeft: spacingX._12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.neutral300,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  headerMenuContent: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(80) : verticalScale(60),
    right: spacingX._15,
    backgroundColor: "#292929",
    borderRadius: radius._10,
    paddingVertical: spacingY._5,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._15,
    gap: spacingX._10,
  },
  selectedFile: {
    position: "absolute",
    height: verticalScale(45),
    width: verticalScale(45),
    borderRadius: radius.full,
    alignSelf: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._15,
  },
  inputIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8,
  },
  footer: {
    paddingTop: spacingY._7,
    paddingBottom: verticalScale(22),
  },
  messagesContainer: {
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
  },
});
