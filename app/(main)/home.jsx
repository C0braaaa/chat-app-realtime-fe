import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { io } from "socket.io-client";

import ScreenWrapper from "@/components/ScreenWrapper";
import { verticalScale } from "@/utils/styling";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import { useAuth } from "@/contexts/authContext";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ConversationItem from "@/components/ConversationItem";
import Loading from "@/components/Loading";
import Button from "@/components/Button";
import api from "@/utils/api";

const SOCKET_URL = "http://192.168.1.12:3000";
const home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const socketRef = useRef(null);

  const [currrentUser, setCurrentUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch conversations from backend
  const fetchConversations = async () => {
    try {
      if (!user?._id) return;

      setLoading(true);
      const res = await api.get("/conversations/conversation", {
        params: { userId: user._id },
      });
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.log("Error: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current.on("update_last_message", (data) => {
        setConversations((prevConversations) => {
          // Kiểm tra xem chat này có đang hiển thị trên Home không
          const exists = prevConversations.some(
            (c) => c._id === data.conversationId,
          );

          if (!exists) {
            // 👉 NẾU ĐÃ BỊ ẨN (DO XÓA): Bắt Home tự động load lại danh sách mới ngay lập tức
            fetchConversations();
            return prevConversations;
          }

          // 👉 NẾU ĐANG HIỆN: Cập nhật tin nhắn cuối cùng như bình thường
          const updatedConversations = prevConversations.map((conv) => {
            if (conv._id === data.conversationId) {
              return {
                ...conv,
                lastMessage: data.lastMessage,
                updatedAt: new Date().toISOString(),
              };
            }
            return conv;
          });

          return updatedConversations.sort((a, b) => {
            const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt);
            const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt);
            return timeB - timeA;
          });
        });
      });
    };

    initSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user?._id]);

  useEffect(() => {
    fetchConversations();
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user?._id]),
  );

  let directConversations = conversations
    .filter((item) => item.type === "direct")
    .sort((a, b) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  let groupConversations = conversations
    .filter((item) => item.type === "group")
    .sort((a, b) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  return (
    <ScreenWrapper showPattern={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Typo
              size={19}
              color={colors.neutral200}
              textProps={{ numberOfList: 1 }}
            >
              Hello,{" "}
              <Typo size={20} color={colors.white} fontWeight={"800"}>
                {user?.name}
              </Typo>
            </Typo>
          </View>

          <TouchableOpacity
            style={styles.settingIcon}
            onPress={() => router.push("/(main)/profileModal")}
          >
            <Ionicons
              name="settings-outline"
              size={verticalScale(22)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: spacingY._20 }}
          >
            <View style={styles.navBar}>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={styles.tabStyle}
                  onPress={() => setSelectedTab(0)}
                  style={[
                    styles.tabStyle,
                    selectedTab === 0 && styles.activeTabStyle,
                  ]}
                >
                  <Typo>Direct Messages</Typo>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabStyle}
                  onPress={() => setSelectedTab(1)}
                  style={[
                    styles.tabStyle,
                    selectedTab === 1 && styles.activeTabStyle,
                  ]}
                >
                  <Typo>Groups</Typo>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.conversationList}>
              {selectedTab === 0 &&
                directConversations.map((item, index) => {
                  return (
                    <ConversationItem
                      item={item}
                      key={item._id}
                      router={router}
                      currentUser={user}
                      showDivider={directConversations.length !== index + 1}
                    />
                  );
                })}
              {selectedTab === 1 &&
                groupConversations.map((item, index) => {
                  return (
                    <ConversationItem
                      item={item}
                      key={item._id}
                      router={router}
                      currentUser={user}
                      showDivider={directConversations.length !== index + 1}
                    />
                  );
                })}
            </View>
            {!loading &&
              selectedTab === 0 &&
              directConversations.length === 0 && (
                <Typo style={{ textAlign: "center" }}>
                  You don't have any messages
                </Typo>
              )}
            {!loading &&
              selectedTab === 1 &&
              groupConversations.length === 0 && (
                <Typo style={{ textAlign: "center" }}>
                  You haven't joined any groups yet
                </Typo>
              )}
            {loading && <Loading />}
          </ScrollView>
        </View>
      </View>
      <Button
        style={styles.floatingButton}
        onPress={() =>
          router.push({
            pathname: "/(main)/newConversationModal",
            params: { isGroup: selectedTab },
          })
        }
      >
        <Ionicons name="add" color={colors.black} size={verticalScale(24)} />
      </Button>
    </ScreenWrapper>
  );
};

export default home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    gap: spacingY._15,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._20,
  },
  navBar: {
    flexDirection: "row",
    gap: spacingX._15,
    alignItems: "center",
    paddingHorizontal: spacingX._10,
  },
  tabs: {
    flexDirection: "row",
    gap: spacingX._10,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabStyle: {
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius.full,
    backgroundColor: colors.neutral100,
  },
  activeTabStyle: {
    backgroundColor: colors.primaryDark,
  },
  conversationList: {
    paddingVertical: spacingY._20,
  },
  settingIcon: {
    padding: spacingY._10,
    backgroundColor: colors.neutral700,
    borderRadius: radius.full,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
});
