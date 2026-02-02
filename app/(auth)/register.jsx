import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { SlideInDown } from "react-native-reanimated";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { registerSchema } from "@/utils/validation";
import api from "@/utils/api";

const register = () => {
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // 2. Tách biệt: Ref này chỉ dùng để lưu Giá trị (Text)
  const nameValue = useRef("");
  const emailValue = useRef("");
  const passwordValue = useRef("");
  const confirmPasswordValue = useRef("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const handleSubmit = async () => {
    setErrors({});
    const formData = {
      name: nameValue.current,
      email: emailValue.current,
      password: passwordValue.current,
      confirmPassword: confirmPasswordValue.current,
    };

    try {
      // 1. Validate Frontend (Zod)
      registerSchema.parse(formData);

      setIsLoading(true);

      // 2. Gọi API bằng Axios (Gọn hơn Fetch nhiều)
      // Không cần điền http://... nữa vì đã cấu hình trong api.js rồi
      const response = await api.post("auth/register", {
        name: nameValue.current,
        email: emailValue.current,
        password: passwordValue.current,
      });

      setIsLoading(false);

      if (response.data.success) {
        router.push("/(auth)/login");
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Lỗi:", error);

      // 3. Xử lý lỗi từ Backend (Axios ném lỗi vào error.response)
      if (error.response) {
        // Lỗi do Backend trả về (ví dụ: Email trùng -> 400 Bad Request)
        Alert.alert(
          "Đăng ký thất bại",
          error.response.data.message || "Có lỗi xảy ra",
        );
      }
      // 4. Xử lý lỗi Validate Zod
      else if (error.errors || error.issues) {
        const newErrors = {};
        const issues = error.errors || error.issues;
        issues.forEach((err) => {
          if (!newErrors[err.path[0]]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      // 5. Lỗi mạng (Không kết nối được server)
      else {
        Alert.alert(
          "Lỗi mạng",
          "Không thể kết nối đến Server. Kiểm tra lại IP/Wifi!",
        );
      }
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
            <Typo size={17} color={colors.white}>
              Need some help?
            </Typo>
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
                  Create Your Account
                </Typo>
                <Typo color={colors.neutral600}>
                  Create an account to continue!
                </Typo>
              </View>
              <Input
                placeholder="Enter your name"
                inputRef={nameInputRef}
                onChangeText={(value) => (nameValue.current = value)}
                icon={
                  <FontAwesome5
                    name="user"
                    size={20}
                    color={colors.neutral500}
                  />
                }
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.name}
              />
              <Input
                placeholder="Enter your email"
                inputRef={emailInputRef}
                onChangeText={(value) => (emailValue.current = value)}
                icon={
                  <FontAwesome5
                    name="envelope"
                    size={20}
                    color={colors.neutral500}
                  />
                }
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.email}
              />
              <Input
                secureTextEntry
                placeholder="Enter your password"
                inputRef={passwordInputRef}
                onChangeText={(value) => (passwordValue.current = value)}
                icon={
                  <FontAwesome5
                    name="lock"
                    size={20}
                    color={colors.neutral500}
                  />
                }
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.password}
              />
              <Input
                secureTextEntry
                inputRef={confirmPasswordInputRef}
                onChangeText={(value) => (confirmPasswordValue.current = value)}
                placeholder="Confirm password"
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
                    Sign Up
                  </Typo>
                </Button>

                <View style={styles.footer}>
                  <Typo>Already have an account? </Typo>
                  <Pressable onPress={() => router.push("/(auth)/login")}>
                    <Typo
                      style={{
                        color: colors.primaryDark,
                      }}
                      fontWeight={"bold"}
                    >
                      Sign In.
                    </Typo>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default register;

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
