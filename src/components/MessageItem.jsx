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
import { FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";

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

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      const res = await api.delete(`/messages/${item.id}`, {
        data: { userId: user._id },
      });
      if (res.data.success) {
        if (onDelete) onDelete(item.id);
      } else {
        Alert.alert("Error", "Cannot delete message");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) onEdit(item);
  };

  const handleLongPress = () => {
    if (isMe) {
      setShowMenu(true);
    }
  };
  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage,
        isLocal && { opacity: 0.7 },
      ]}
    >
      {!isMe && !isDirect && (
        <Avatar
          size={35}
          uri={item.sender.avatar}
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
            isMe ? styles.myBuddle : styles.theirBudde,
          ]}
        >
          {!isMe && !isDirect && (
            <Typo color={colors.neutral900} fontWeight={"600"} size={13}>
              {item.sender.name}
            </Typo>
          )}

          {item.attachement && (
            <View>
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
            </View>
          )}
          {item.content && <Typo size={15}>{item.content}</Typo>}
          <Typo
            style={{ alignSelf: "flex-end" }}
            size={11}
            fontWeight={"500"}
            color={colors.neutral600}
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
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={colors.white}
                  />
                  <Typo size={16} color={colors.white} fontWeight={"500"}>
                    Copy
                  </Typo>
                </TouchableOpacity>
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
  // messageOptions: {
  //   alignItems: "center",
  // },
  messageContainer: {
    flexDirection: "row",
    gap: spacingX._7,
    maxWidth: "80%",
    marginBottom: spacingY._12,
    alignItems: "center",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    alignSelf: "flex-end",
  },
  attachment: {
    height: verticalScale(180),
    width: verticalScale(180),
    borderRadius: radius._10,
  },
  messageBuddle: {
    padding: spacingX._10,
    borderRadius: radius._15,
    gap: spacingY._5,
  },
  myBuddle: {
    backgroundColor: colors.myBubble,
  },
  theirBudde: {
    backgroundColor: colors.otherBubble,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: radius._10,
  },
  // modal style
  modalOverlay: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuContent: {
    width: "100%",
    flexDirection: "row",
    alignSelf: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "#292929",
    padding: spacingY._15,
    paddingBottom: spacingY._15,
    paddingLeft: spacingX._30,
    paddingRight: spacingX._30,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
});
