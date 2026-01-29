import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Typo from "./Typo";
import { colors } from "@/constants/theme";

const Header = ({ title, leftIcon, rightIcon, style, titleStyle }) => {
  return (
    <View style={[styles.container, style]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

      {title && (
        <Typo size={22} fontWeight={"600"} style={[styles.title, titleStyle]}>
          {title}
        </Typo>
      )}

      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    zIndex: 10,
    color: colors.white,
  },
  leftIcon: {
    alignSelf: "flex-start",
    zIndex: 20,
  },
  rightIcon: {
    alignSelf: "flex-end",
    zIndex: 30,
  },
});
