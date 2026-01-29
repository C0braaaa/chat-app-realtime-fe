import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import moment from "moment";

import { colors, spacingX, spacingY } from "@/constants/theme";
import Avatar from "./Avatar";
import Typo from "./Typo";

const ConversationItem = ({ item, router, showDivider, currentUser }) => {
  const lastMessage = item.lastMessage;
  const isDirect = item.type === "direct";

  const getDisplayInfo = () => {
    if (item.type === "group") {
      return {
        name: item.name,
        avatar: item.avatar,
      };
    }
    const otherUser = item.participants.find((p) => p._id !== currentUser?._id);

    return {
      name: otherUser?.name || "Unknown User",
      avatar: otherUser?.avatar || null,
    };
  };
  const { name, avatar } = getDisplayInfo();

  const getLastMessageContent = () => {
    if (!lastMessage) return "Say hi 👋";
    return lastMessage?.attachement ? "Image" : lastMessage?.content;
  };

  const getLastMessageDate = () => {
    if (!lastMessage?.createdAt) return null;

    const messageDate = moment(lastMessage.createdAt);

    const today = moment();
    if (messageDate.isSame(today, "day")) {
      return messageDate.format("h:mm A");
    }
    if (messageDate.isSame(today, "year")) {
      return messageDate.format("MMM D");
    }

    return messageDate.format("MMM D, YYYY");
  };
  return (
    <View>
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push({
            pathname: "/(main)/conversation",
            params: { conversationId: item._id },
          })
        }
      >
        <View>
          <Avatar uri={avatar} size={47} isGroup={item.type === "group"} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Typo size={17} fontWeight={"600"}>
              {name}
            </Typo>
            {item.lastMessage && <Typo size={15}>{getLastMessageDate()}</Typo>}
          </View>
          <Typo
            size={15}
            color={colors.neutral600}
            textProps={{ numberOfLines: 1 }}
          >
            {getLastMessageContent()}
          </Typo>
        </View>
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

export default ConversationItem;

const styles = StyleSheet.create({
  conversationItem: {
    gap: spacingX._10,
    marginVertical: spacingY._12,
    flexDirection: "row",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
    width: "95%",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.07)",
  },
});
