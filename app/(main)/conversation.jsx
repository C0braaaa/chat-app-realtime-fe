import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import ScreenWrapper from "@/components/ScreenWrapper";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import Typo from "@/components/Typo";
import MessageItem from "@/components/MessageItem";
import Input from "@/components/Input";
import { Image } from "expo-image";

const conversation = () => {
  const { conversationId, name, avatar, type } = useLocalSearchParams();
  const [image, setImage] = useState([]);
  const [message, setMessage] = useState("");
  const dummyMessages = [
    {
      id: "msg_9",
      sender: {
        id: "me",
        name: "Me",
        avatar: null,
      },
      content:
        "Yes, I'm thinking about adding message reactions and file sharing.",
      createdAt: "10:41 AM",
      isMe: true,
    },
    {
      id: "msg_10",
      sender: {
        id: "user_2",
        name: "Jane Smith",
        avatar: null,
      },
      content: "That would be really useful!",
      createdAt: "10:42 AM",
      isMe: false,
    },
    {
      id: "msg_11",
      sender: {
        id: "me",
        name: "Me",
        avatar: null,
      },
      content: "Yeah, I’ll probably add reactions first since it’s simpler.",
      createdAt: "10:43 AM",
      isMe: true,
    },
  ];

  const onPickFile = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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
            <TouchableOpacity>
              <FontAwesome5 name="ellipsis-v" size={22} color="white" />
            </TouchableOpacity>
          }
        />

        {/* content */}
        <View style={styles.content}>
          <FlatList
            data={dummyMessages}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
            renderItem={({ item }) => (
              <MessageItem item={item} isDirect={type === "direct"} />
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
              icon={
                <TouchableOpacity style={styles.inputIcon} onPress={onPickFile}>
                  <Ionicons
                    name="add"
                    size={verticalScale(26)}
                    color={colors.black}
                  />
                  {image && (
                    <Image source={image} style={styles.selectedFile} />
                  )}
                </TouchableOpacity>
              }
            />
            <View style={styles.inputRightIcon}>
              <TouchableOpacity style={styles.inputIcon} onPress={() => {}}>
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
    flex: 1,
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
