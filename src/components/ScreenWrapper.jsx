import {
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  Dimensions, // 1. Phải import cái này để lấy chiều cao máy
} from "react-native";
import React from "react";
import { colors } from "../constants/theme";
import { StatusBar } from "expo-status-bar";

// Lấy chiều cao màn hình
const { height } = Dimensions.get("window");

const ScreenWrapper = ({
  style,
  children,
  showPattern = false,
  isModal = false,
  bgOpacity = 1,
}) => {
  let paddingTop = Platform.OS === "ios" ? height * 0.06 : 40;
  let paddingBottom = 0;

  if (isModal) {
    paddingTop = Platform.OS === "ios" ? height * 0.02 : 45;
    paddingBottom = height * 0.02;
  }

  return (
    <ImageBackground
      style={{
        flex: 1,
        backgroundColor: isModal ? colors.white : colors.neutral900,
      }}
      imageStyle={{ opacity: showPattern ? bgOpacity : 0 }}
      source={require("../../assets/images/bgPattern.png")}
    >
      <View
        style={[
          {
            paddingTop,
            paddingBottom,
            flex: 1,
          },
          style,
        ]}
      >
        <StatusBar style="light" backgroundColor="transparent" />

        {children}
      </View>
    </ImageBackground>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({});
