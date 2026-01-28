import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import React from "react";
import { colors, radius, spacingX, spacingY } from "constants/theme";
import { verticalScale } from "utils/styling";
import Typo from "./Typo";
import { Eye, EyeSlash } from "phosphor-react-native";

const Input = ({
  icon,
  containerStyle,
  inputStyle,
  inputRef,
  editable = true,
  secureTextEntry,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={{ marginBottom: spacingY._10 }}>
      <View
        style={[
          styles.container,
          containerStyle && containerStyle,
          isFocused && styles.primaryBorder,
          error && { borderColor: "red" },
        ]}
      >
        {icon && icon}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.neutral400}
          ref={inputRef && inputRef}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <Eye size={24} color={colors.neutral400} weight="fill" />
            ) : (
              <EyeSlash size={24} color={colors.neutral400} weight="fill" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Typo
          size={12}
          color={colors.rose}
          style={{ marginTop: 5, marginLeft: 5 }}
        >
          {error}
        </Typo>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: verticalScale(56),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral200,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
    backgroundColor: colors.neutral100,
    gap: spacingX._15,
  },
  primaryBorder: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: verticalScale(16),
  },
});
