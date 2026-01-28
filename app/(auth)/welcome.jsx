import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/ScreenWrapper";
import Typo from "components/Typo";
import { colors, spacingX, spacingY } from "constants/theme";
import { verticalScale } from "utils/styling";
import Button from "components/Button";

const Welcome = () => {
  const router = useRouter();
  return (
    <ScreenWrapper showPattern={true}>
      <View style={styles.container}>
        <View style={{ alignItems: "center" }}>
          <Typo color={colors.white} size={43} fontWeight={"900"}>
            CChat
          </Typo>
        </View>
        <Animated.Image
          entering={FadeIn.duration(700).springify()}
          source={require("../../assets/images/welcome.png")}
          style={styles.welcomeImage}
          resizeMode={"contain"}
        />
        <View>
          <Typo color={colors.white} size={33} fontWeight={"800"}></Typo>
        </View>

        <Button
          style={{ backgroundColor: colors.white }}
          onPress={() => router.push("/(auth)/login")}
        >
          <Typo size={23} fontWeight={"bold"}>
            Get Started
          </Typo>
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-around",
    paddingHorizontal: spacingX._20,
    marginVertical: spacingY._10,
  },
  background: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  welcomeImage: {
    marginLeft: spacingX._20,
    height: verticalScale(300),
    aspectRatio: 1,
    alignItems: "center",
  },
});
