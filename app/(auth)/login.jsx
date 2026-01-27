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
import { EnvelopeSimpleIcon, Lock, User } from "phosphor-react-native";
import { useRouter } from "expo-router";
import Animated, { SlideInDown } from "react-native-reanimated";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { registerSchema } from "@/utils/validation";

const login = () => {
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // 2. Tách biệt: Ref này chỉ dùng để lưu Giá trị (Text)
  const nameValue = useRef("");
  const emailValue = useRef("");
  const passwordValue = useRef("");
  const confirmPasswordValue = useRef("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const handleSubmit = async () => {
    // 1. Xóa lỗi cũ
    setErrors({});

    const formData = {
      email: emailValue.current,
      password: passwordValue.current,
    };

    console.log("Dữ liệu gửi đi:", formData);

    try {
      // 2. Dùng .parse() thay vì .safeParse()
      // Cách này nếu lỗi nó sẽ ném thẳng vào catch, không sợ bị undefined lằng nhằng
      registerSchema.parse(formData);

      // --- NẾU THÀNH CÔNG (Chạy đến đây nghĩa là không lỗi) ---
      setIsLoading(true);
      console.log("Dữ liệu sạch:", formData);

      setTimeout(() => {
        setIsLoading(false);
        Alert.alert("Thành công", "Đăng ký thành công!");
      }, 1000);
    } catch (error) {
      // --- NẾU CÓ LỖI ---
      console.log("Bắt được lỗi rồi:", error); // Log ra xem mặt mũi nó thế nào

      // Kiểm tra xem có phải lỗi của Zod không để hiển thị
      const newErrors = {};

      // ZodError luôn có thuộc tính errors hoặc issues
      const issues = error.errors || error.issues;

      if (issues) {
        issues.forEach((err) => {
          // Chỉ gán lỗi nếu chưa có lỗi nào cho trường này
          if (!newErrors[err.path[0]]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };
  console.log(errors);

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
              Forgot your password?
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
                  Welcome Back
                </Typo>
                <Typo color={colors.neutral600}>We are happy to see you!</Typo>
              </View>
              <Input
                placeholder="Enter your email"
                inputRef={emailInputRef}
                onChangeText={(value) => (emailValue.current = value)}
                icon={<EnvelopeSimpleIcon />}
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
                icon={<Lock />}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                blurOnSubmit={false}
                error={errors.password}
              />
              <View style={{ marginTop: spacingY._20, gap: spacingY._15 }}>
                <Button loading={isLoading} onPress={handleSubmit}>
                  <Typo fontWeight={"bold"} size={18}>
                    Sign Up
                  </Typo>
                </Button>

                <View style={styles.footer}>
                  <Typo>Don't have an account? </Typo>
                  <Pressable onPress={() => router.push("/(auth)/register")}>
                    <Typo
                      style={{
                        color: colors.primaryDark,
                      }}
                      fontWeight={"bold"}
                    >
                      Sign Up.
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

export default login;

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
