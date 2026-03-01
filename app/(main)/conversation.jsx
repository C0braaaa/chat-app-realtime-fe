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
  ActivityIndicator,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router"; // Thêm useRouter nếu chưa có
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { io } from "socket.io-client";
import moment from "moment";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";

import ScreenWrapper from "@/components/ScreenWrapper";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import Typo from "@/components/Typo";
import MessageItem from "@/components/MessageItem";
import Input from "@/components/Input";
import api from "@/utils/api";
import { useAuth } from "@/contexts/authContext";

const SOCKET_URL = "http://192.168.1.12:3000";

const conversation = () => {
  const { conversationId, name, avatar, type } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter(); // Khai báo router

  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  // delete conversation
  const handleDeleteConversation = () => {
    setShowHeaderMenu(false);
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.delete(`/conversations/${conversationId}`, {
                data: { userId: user._id },
              });
              if (res.data.success) {
                router.replace("/(main)/home");
              }
            } catch (error) {
              Alert.alert("Error", "Could not delete conversation.");
            }
          },
        },
      ],
    );
  };

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
      console.log("Upload failed:", error);
      return null;
    }
  };

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

  useEffect(() => {
    if (!conversationId || !user) return;

    // 1. KẾT NỐI SOCKET
    const initSocket = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current.on("connect_error", (err) => {
        if (
          err.message === "Invalid token" ||
          err.message === "Authentication error"
        ) {
          Alert.alert("Session Expired", "Please login again");
          SecureStore.deleteItemAsync("authToken");
          router.replace("/(auth)/login");
        }
      });

      socketRef.current.on("connect", () => {
        socketRef.current.emit("join_conversation", conversationId);
      });

      socketRef.current.on("new_message", (newMsg) => {
        const formattedMsg = processMessage(newMsg);
        setMessages((prev) => {
          if (prev.some((m) => m.id === formattedMsg.id)) return prev;
          return [formattedMsg, ...prev];
        });
      });

      socketRef.current.on("message_deleted", (deleteMsgId) => {
        setMessages((prev) => {
          return prev.filter((msg) => msg.id !== deleteMsgId);
        });
      });

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

    // 2. GỌI API LẤY TIN NHẮN CŨ
    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/messages/${conversationId}?userId=${user._id}`,
        );
        if (res.data.success) {
          const formattedMsgs = res.data.data.map(processMessage);
          setMessages(formattedMsgs);
        }
      } catch (error) {
        console.log(error);
      }
    };

    initSocket();
    fetchMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_conversation", conversationId);
        socketRef.current.disconnect();
      }
    };
  }, [conversationId, user]);

  const handleSendMessage = async () => {
    if (!message.trim() && !image) return;

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
        const res = await api.put(`/messages/${msgId}`, {
          userId: user._id,
          content: contentToUpdate,
        });

        if (!res.data.success) throw new Error("Edit failed");
      } catch (error) {
        Alert.alert("Error", "Failed to update message");
      }
      return;
    }

    // A. Tạo tin nhắn "giả" (Local) để hiện ngay lập tức
    const tempId = Date.now().toString(); // ID tạm
    const tempMsg = {
      id: tempId,
      content: message,
      // Nếu có ảnh thì dùng ảnh local để hiện luôn, không cần chờ URL
      attachement: image,
      sender: user, // Fake thông tin người gửi là mình
      createdAt: moment().format("h:mm A"), // Giờ hiện tại
      isMe: true,
      isLocal: true, // 👈 Cờ đánh dấu đây là tin nhắn đang gửi
    };

    // B. Cập nhật UI ngay lập tức (Không chờ đợi!)
    setMessages((prev) => [tempMsg, ...prev]);

    // Reset input ngay cho mượt
    const contentToSend = message;
    const imageToSend = image;
    setMessage("");
    setImage(null);

    // C. Xử lý Upload và Gửi API (Chạy ngầm)
    try {
      let attachmentUrl = null;
      if (imageToSend) {
        attachmentUrl = await uploadToCloudinary(imageToSend);
      }

      const payload = {
        conversationId,
        content: contentToSend,
        attachement: attachmentUrl,
        senderId: user?._id,
      };

      const res = await api.post("/messages", payload);
      if (res.data.success) {
        const realMessage = res.data.data;
        const formattedMsg = processMessage(realMessage);

        setMessages((prev) => {
          // Kiểm tra xem Socket đã nhanh tay thêm tin này vào chưa (để tránh trùng)
          const isSocketAdded = prev.some((m) => m.id === formattedMsg.id);

          if (isSocketAdded) {
            // Nếu Socket đã thêm rồi thì mình chỉ cần xóa cái tin tạm (tempId) đi là xong
            return prev.filter((m) => m.id !== tempId);
          } else {
            // Nếu Socket chưa tới, mình tự thay thế Tin Tạm bằng Tin Thật
            return prev.map((m) => (m.id === tempId ? formattedMsg : m));
          }
        });
      }
    } catch (error) {
      Alert.alert("Error", "Message not sent");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const onPickFile = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
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
            <>
              <TouchableOpacity>
                <Ionicons name="call" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="videocam" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                onPress={() => setShowHeaderMenu(true)}
              >
                <FontAwesome5 name="ellipsis-v" size={22} color="white" />
              </TouchableOpacity>
            </>
          }
        />
        <Modal
          visible={showHeaderMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowHeaderMenu(false)}
        >
          {/* Chạm ra ngoài để đóng menu */}
          <TouchableWithoutFeedback onPress={() => setShowHeaderMenu(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.headerMenuContent}>
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
                      Delete Chat
                    </Typo>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.content}>
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
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
              />
            )}
            keyExtractor={(item) => item.id}
          />

          <View style={styles.footer}>
            <Input
              value={message}
              onChangeText={setMessage}
              containerStyle={{
                paddingLeft: spacingX._10,
                paddingRight: scale(65),
                borderWidth: 0,
              }}
              placeholder="Type a message"
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
    </ScreenWrapper>
  );
};

export default conversation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    backgroundColor: "rgba(0,0,0,0.6)", // Nền tối nhẹ
  },
  headerMenuContent: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(80) : verticalScale(60), // Canh cho rớt xuống ngay dưới nút 3 chấm
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
  messageContent: {
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._20,
  },
  plusIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8,
  },
});
