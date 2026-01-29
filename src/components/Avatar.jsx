import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { verticalScale } from "@/utils/styling";
import { colors, radius, spacingY } from "@/constants/theme";
import { Image } from "expo-image";

const Avatar = ({ uri, size = 40, style, isGroup = false }) => {
  return (
    <View
      style={[
        styles.avatar,
        { height: verticalScale(size), width: verticalScale(size) },
        style,
      ]}
    >
      <Image
        style={{ flex: 1 }}
        source={uri}
        contentFit="cover"
        transition={100}
      />
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral200,
    height: verticalScale(47),
    width: verticalScale(47),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: "hidden",
    marginTop: spacingY._5,
  },
});
