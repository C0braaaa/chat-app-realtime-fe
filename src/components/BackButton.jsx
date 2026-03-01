import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { verticalScale } from "utils/styling";
import { colors } from "constants/theme";
import { FontAwesome5 } from "@expo/vector-icons";

const BackButton = ({ style, iconSize = 26, color = colors.white }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={[styles.button, style]}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <FontAwesome5
        name="chevron-left"
        size={verticalScale(iconSize)}
        color={color}
      />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({});
