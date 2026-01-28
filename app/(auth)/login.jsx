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
import * as SecureStore from "expo-secure-store";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { loginSchema } from "@/utils/validation";
import api from "@/utils/api";
import { useAuth } from "@/contexts/authContext";

const login = () => {
  const { setAuth } = useAuth();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // 2. Tách biệt: Ref này chỉ dùng để lưu Giá trị (Text)
  const emailValue = useRef("");
  const passwordValue = useRef("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const handleSubmit = async () => {
    setErrors({});

    const formData = {
      email: emailValue.current,
      password: passwordValue.current,
    };

    try {
      loginSchema.parse(formData);

      setIsLoading(true);

      const response = await api.post("/auth/login", formData);

      setIsLoading(false);

      if (response.data.success) {
        const { token, user } = response.data.data;
        await SecureStore.setItemAsync("authToken", token);
        setAuth(user);
        router.replace("/(main)/home");
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Login Error:", error);

      // 2. Lỗi backend
      if (error.response) {
        Alert.alert("Đăng nhập thất bại", error.response.data.message);
      }
      // 3. Lỗi Zod
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
      // 4. Lỗi mạng
      else {
        Alert.alert("Lỗi", "Không thể kết nối đến Server");
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
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.password}
              />
              <View style={{ marginTop: spacingY._20, gap: spacingY._15 }}>
                <Button loading={isLoading} onPress={handleSubmit}>
                  <Typo fontWeight={"bold"} size={18}>
                    Sign In
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
