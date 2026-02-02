import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useAuth } from "@/contexts/authContext";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Avatar from "./Avatar";
import Typo from "./Typo";

const MessageItem = ({ item, isDirect }) => {
  const { user } = useAuth();
  const isMe = item.isMe;
  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      {!isMe && !isDirect && (
        <Avatar size={35} uri={null} style={styles.messageAvatar} />
      )}
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
});
