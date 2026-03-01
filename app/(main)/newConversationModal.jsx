import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState, useEffect, use } from "react";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import ScreenWrapper from "@/components/ScreenWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import Input from "@/components/Input";
import Typo from "@/components/Typo";
import { useAuth } from "@/contexts/authContext";
import Button from "@/components/Button";
import { verticalScale } from "@/utils/styling";
import api from "@/utils/api";
import { AntDesign } from "@expo/vector-icons";
import { useDebounce } from "@/hooks/useDebounce";

const newConversationModal = () => {
  const { isGroup } = useLocalSearchParams();
  const isGroupMode = isGroup === "1";
  const router = useRouter();
  const { user } = useAuth();

  const [image, setImage] = useState(
    require("../../assets/images/defaultGroupAvatar.png"),
  );
  const [groupName, setGroupName] = useState("");
  const [findedUsers, setFoundUsers] = useState("");
  const debouncedSearch = useDebounce(findedUsers, 500);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/user", {
          params: {
            userId: user._id,
            fetchType: isGroupMode ? "group" : "direct",
            search: debouncedSearch,
          },
        });
        if (res.data.success) {
          setUsers(res.data.data);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (user?._id) fetchUsers();
  }, [user, isGroupMode, debouncedSearch]);

  const toggleParticipant = (user) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(user._id)) {
        return prev.filter((id) => id !== user._id);
      }
      return [...prev, user._id];
    });
  };

  const onSelectUser = async (targetUser) => {
    if (!targetUser || isLoading) return;

    if (isGroupMode) {
      toggleParticipant(targetUser);
    } else {
      try {
        setIsLoading(true);

        if (!targetUser._id || !user._id) {
          Alert.alert("Error", "User information is missing");
          return;
        }

        const res = await api.post("/conversations/conversation", {
          senderId: user._id,
          receiverId: targetUser._id,
        });

        if (res.data.success) {
          router.back();
        } else {
          Alert.alert(
            "Error",
            res.data.message || "Cannot create conversation.",
          );
        }
      } catch (error) {
        console.log("Error:", error.response?.data || error.message);
        Alert.alert(
          "Error",
          error.response?.data?.message ||
            "Cannot create conversation. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // upload image to cloudinary
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

  // create group conversation
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Group name cannot be empty");
      return;
    }
    if (selectedParticipants.length < 2) {
      Alert.alert("Error", "Group must have at least 2 participants");
      return;
    }
    try {
      setIsLoading(true);
      let groupAvatarUrl = null;
      if (image && typeof image === "string") {
        groupAvatarUrl = await uploadToCloudinary(image);
      }

      const payload = {
        name: groupName,
        participants: [...selectedParticipants, user._id],
        type: "group",
        avatar: groupAvatarUrl,
        createdBy: user._id,
      };
      const res = await api.post("/conversations/conversation", payload);

      if (res && res.data.success) {
        const conversationData = res.data.data;

        router.replace({
          pathname: "/(main)/conversation",
          params: {
            conversationId: conversationData._id,
            name: groupName,
            image: groupAvatarUrl || "",
            type: "group",
          },
        });
      } else {
        Alert.alert("Error", res.data.message || "Cannot create group");
      }
    } catch (error) {
      console.log("Group creation error:", error);
      Alert.alert("Error", "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  // Pick image from gallery
  const onPickImage = async () => {
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
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
        <Header
          title={isGroupMode ? "New Group" : "Select User"}
          leftIcon={<BackButton color={colors.black} />}
          titleStyle={{ color: colors.black }}
        />
        {isGroupMode ? (
          <View style={styles.groupInfoContainer}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={onPickImage}>
                <Avatar uri={image} size={100} isGroup={true} />
              </TouchableOpacity>
            </View>
            <View style={styles.groupNameContainer}>
              <Input
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
          </View>
        ) : (
          <View style={styles.directInfoContainer}>
            <View style={styles.groupNameContainer}>
              <Input
                placeholder="Find User"
                value={findedUsers}
                onChangeText={setFoundUsers}
              />
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
        >
          {users?.map((item, index) => {
            const isSelected = selectedParticipants.includes(item._id);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.contactRow,
                  isSelected && styles.selectedContact,
                ]}
                onPress={() => onSelectUser(item)}
              >
                <Avatar uri={item.avatar} size={45} />
                <Typo fontWeight={"500"}>{item.name}</Typo>
                {isGroupMode ? (
                  <View style={styles.selectionIndicator}>
                    <View
                      style={[styles.checkbox, isSelected && styles.checked]}
                    ></View>
                  </View>
                ) : (
                  <View style={styles.selectionIndicator}>
                    <TouchableOpacity onPress={() => onSelectUser(item)}>
                      <AntDesign
                        name="pluscircleo"
                        size={24}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {isGroupMode && selectedParticipants.length >= 2 && (
          <View style={styles.createGroupButton}>
            <Button
              onPress={createGroup}
              disabled={!groupName.trim()}
              loading={isLoading}
            >
              <Typo fontWeight={"bold"} size={17}>
                Create Group
              </Typo>
            </Button>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default newConversationModal;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacingX._15,
    flex: 1,
  },
  groupInfoContainer: {
    alignItems: "center",
    marginTop: spacingY._10,
  },
  directInfoContainer: {
    alignItems: "center",
    marginTop: spacingY._30,
  },
  avatarContainer: {
    marginBottom: spacingY._10,
  },
  groupNameContainer: {
    width: "100%",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    paddingVertical: spacingY._5,
  },
  selectedContact: {
    backgroundColor: colors.neutral100,
    borderRadius: radius._15,
  },
  contactList: {
    gap: spacingX._12,
    marginTop: spacingY._10,
    paddingTop: spacingY._10,
    paddingBottom: verticalScale(100),
  },
  selectionIndicator: {
    marginLeft: "auto",
    marginRight: spacingX._10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checked: {
    backgroundColor: colors.primary,
  },
  createGroupButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacingX._15,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBlockColor: colors.neutral200,
  },
});
