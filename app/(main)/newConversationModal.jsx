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
import { Plus } from "phosphor-react-native";

const newConversationModal = () => {
  const { isGroup } = useLocalSearchParams();
  const isGroupMode = isGroup === "1";
  const router = useRouter();
  const { user } = useAuth();

  const [image, setImage] = useState(
    "https://res.cloudinary.com/dbx1xoswm/image/upload/v1769652130/Gemini_Generated_Image_f5l93pf5l93pf5l9_tr7jjd.png",
  );
  const [groupName, setGroupName] = useState("");
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
          },
        });
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (user?._id) fetchUsers();
  }, [user, isGroupMode]);

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

  // create group conversation
  const createGroup = () => {};

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
        {isGroupMode && (
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
                      <Plus size={24} color={colors.primary} />
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
