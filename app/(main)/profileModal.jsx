import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { colors, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import ScreenWrapper from "@/components/ScreenWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/contexts/authContext";
import { Pencil, SignOutIcon } from "phosphor-react-native";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";

const ProfileModal = () => {
  const { user, logout, setAuth } = useAuth();
  const [username, setUsername] = useState(user?.name);
  const [image, setImage] = useState(user?.avatar);
  const [loading, setLoading] = useState(false);

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

  // Handle submit
  const onSubmit = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      let avatarUrl = user?.avatar;
      if (image && image !== user?.avatar) {
        const uploadedUrl = await uploadToCloudinary(image);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          Alert.alert("Error", "Failed to upload image");
          setLoading(false);
          return;
        }
      }

      const requestBody = {
        userId: user._id,
        name: username,
        avatar: avatarUrl,
      };

      const response = await api.post("/users/user", requestBody);

      setLoading(false);
      if (response.data.success) {
        await setAuth(response.data.data);
        Alert.alert("Success", "Profile updated successfully");
      }
    } catch (error) {
      setLoading(false);
      console.log("Update error: ", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // handle logout
  const handleLogout = () => {
    Alert.alert("Confirm", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => logout(),
        style: "destructive",
      },
    ]);
  };
  return (
    <ScreenWrapper isModal={true} showPattern={true}>
      <View style={styles.conatiner}>
        <Header
          title={"Update Profile"}
          leftIcon={
            Platform.OS === "android" && <BackButton color={colors.white} />
          }
          style={{ marginVertical: spacingY._15 }}
        />
        {/* Form */}

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <Avatar uri={image} size={170} />
            <TouchableOpacity style={styles.editIcon} onPress={onPickImage}>
              <Pencil size={verticalScale(20)} color={colors.neutral800} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: spacingY._15 }}>
            <View style={styles.inputContainer}>
              <Typo
                style={{ paddingLeft: spacingX._10, color: colors.white }}
                fontWeight={"bold"}
              >
                Email
              </Typo>
              <Input
                value={user?.email}
                editable={false}
                containerStyle={{
                  borderColor: colors.neutral350,
                  paddingLeft: spacingX._20,
                  backgroundColor: colors.neutral300,
                }}
              ></Input>
            </View>
            <View style={styles.inputContainer}>
              <Typo
                style={{ paddingLeft: spacingX._10, color: colors.white }}
                fontWeight={"bold"}
              >
                Name
              </Typo>
              <Input
                value={username}
                containerStyle={{
                  borderColor: colors.neutral350,
                  paddingLeft: spacingX._20,
                  backgroundColor: colors.neutral300,
                }}
                onChangeText={(text) => setUsername(text)}
              ></Input>
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        {!loading && (
          <Button
            style={{
              backgroundColor: colors.rose,
              height: verticalScale(56),
              width: verticalScale(56),
            }}
            onPress={handleLogout}
          >
            <SignOutIcon
              size={verticalScale(30)}
              color={colors.white}
              weight="bold"
            />
          </Button>
        )}
        <Button style={{ flex: 1 }} onPress={onSubmit} loading={loading}>
          <Typo color={colors.black} fontWeight={"700"}>
            Update
          </Typo>
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  conatiner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral200,
    marginBottom: spacingY._10,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._7,
  },
});
