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
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { SlideInDown } from "react-native-reanimated";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import api from "@/utils/api";

const enterotp = () => {
  // Lấy email từ màn hình forgot truyền sang
  const { email } = useLocalSearchParams();

  const otpInputRef = useRef(null);
  const otpValue = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleSubmit = async () => {
    setErrors({});
    const otp = otpValue.current.trim();

    if (!otp) {
      setErrors({ otp: "OTP is required" });
      return;
    }

    try {
      setIsLoading(true);
      // Gọi API xác thực OTP
      const response = await api.post("/auth/verify-otp", { email, otp });
      setIsLoading(false);

      if (response.data.success) {
        // Truyền cả email và otp sang màn hình đổi mật khẩu
        router.push({
          pathname: "/(auth)/recoverpassword",
          params: { email, otp },
        });
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response) Alert.alert("Failed", error.response.data.message);
      else Alert.alert("Error", "Cannot connect to the server.");
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
                  Enter OTP
                </Typo>
                <Typo color={colors.neutral600}>
                  Please enter your 6-digit OTP code!
                </Typo>
              </View>
              <Input
                placeholder="Enter your OTP"
                inputRef={otpInputRef}
                onChangeText={(value) => (otpValue.current = value)}
                keyboardType="numeric" // 👈 Bàn phím số
                maxLength={6}
                icon={
                  <FontAwesome5
                    name="key"
                    size={20}
                    color={colors.neutral500}
                  />
                }
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.otp}
              />
              <View style={{ marginTop: spacingY._20, gap: spacingY._15 }}>
                <Button loading={isLoading} onPress={handleSubmit}>
                  <Typo fontWeight={"bold"} size={18}>
                    Verify
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

export default enterotp;

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
