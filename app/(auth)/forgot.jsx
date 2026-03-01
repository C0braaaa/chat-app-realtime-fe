import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import api from "@/utils/api";

const forgotPassword = () => {
  const emailInputRef = useRef(null);
  const emailValue = useRef("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleSubmit = async () => {
    setErrors({});
    const email = emailValue.current.trim().toLowerCase();

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/auth/forgot-password", { email });
      setIsLoading(false);

      if (response.data.success) {
        Alert.alert("Success", "OTP has been sent to your email.");
        router.push({ pathname: "/(auth)/enterotp", params: { email } });
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Forgot Password Error:", error);

      if (error.response) {
        Alert.alert("Failed", error.response.data.message);
      } else {
        Alert.alert("Error", "Cannot connect to the server.");
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
                  Forgot Password
                </Typo>
                <Typo color={colors.neutral600}>Please enter your email!</Typo>
              </View>
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
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.email}
              />
              <View style={{ marginTop: spacingY._20, gap: spacingY._15 }}>
                <Button loading={isLoading} onPress={handleSubmit}>
                  <Typo fontWeight={"bold"} size={18}>
                    Send
                  </Typo>
                </Button>

                <View style={styles.footer}>
                  <Typo>Remember your password? </Typo>
                  <Pressable onPress={() => router.push("/(auth)/enterotp")}>
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

export default forgotPassword;

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
