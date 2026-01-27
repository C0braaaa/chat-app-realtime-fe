import { View, StyleSheet, StatusBar, Image } from "react-native";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors } from "../src/constants/theme";

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/welcome");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.neutral900} />
      <Animated.Image
        source={require("../assets/images/splashImage.png")}
        entering={FadeInDown.duration(700)}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    height: "30%",
    aspectRatio: 1,
  },
});
