import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { SlideInDown } from "react-native-reanimated";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";

const recoverpassword = () => {
  const { email, otp } = useLocalSearchParams(); // Lấy data từ màn trước

  // Tách riêng 2 ref cho 2 ô input
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const passwordValue = useRef("");
  const confirmPasswordValue = useRef("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleSubmit = async () => {
    setErrors({});
    const newPassword = passwordValue.current.trim();
    const confirmPassword = confirmPasswordValue.current.trim();

    if (!newPassword || newPassword.length < 6) {
      setErrors({ password: "Mật khẩu phải ít nhất 6 ký tự" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Mật khẩu không khớp" });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setIsLoading(false);

      if (response.data.success) {
        Alert.alert(
          "Thành công",
          "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.",
        );
        // Đá thẳng về màn Login, không cho lùi lại màn OTP nữa
        router.dismissAll();
        router.replace("/(auth)/login");
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response) Alert.alert("Thất bại", error.response.data.message);
      else Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenWrapper showPattern={true}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton iconSize={28} />
          </View>
          <Animated.View
            entering={SlideInDown.duration(800).delay(200).damping(15)}
            style={styles.content}
          >
            <ScrollView
              contentContainerStyle={styles.form}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  gap: spacingY._15,
                  marginBottom: spacingY._15,
                  alignItems: "center",
                }}
              >
                <Typo size={28} fontWeight={"600"}>
                  Mật khẩu mới
                </Typo>
                <Typo color={colors.neutral600}>
                  Nhập mật khẩu mới của bạn bên dưới
                </Typo>
              </View>

              <Input
                placeholder="Nhập mật khẩu mới của bạn"
                inputRef={passwordInputRef}
                onChangeText={(value) => (passwordValue.current = value)}
                secureTextEntry // 👈 Ẩn ký tự mật khẩu
                icon={
                  <FontAwesome5
                    name="lock"
                    size={20}
                    color={colors.neutral500}
                  />
                }
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                error={errors.password}
              />

              <Input
                placeholder="Xác nhận mật khẩu mới của bạn"
                inputRef={confirmPasswordInputRef}
                onChangeText={(value) => (confirmPasswordValue.current = value)}
                secureTextEntry // 👈 Ẩn ký tự mật khẩu
                icon={
                  <FontAwesome5
                    name="lock"
                    size={20}
                    color={colors.neutral500}
                  />
                }
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.confirmPassword}
              />

              <View style={{ marginTop: spacingY._20, gap: spacingY._15 }}>
                <Button loading={isLoading} onPress={handleSubmit}>
                  <Typo fontWeight={"bold"} size={18}>
                    Cập nhật mật khẩu
                  </Typo>
                </Button>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};
export default recoverpassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  form: {
    gap: spacingY._10,
    marginTop: spacingY._20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
});
