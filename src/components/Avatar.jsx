import { ActivityIndicator, StyleSheet, View } from "react-native";
import React, { useState, useEffect } from "react";
import { verticalScale } from "@/utils/styling";
import { colors, radius, spacingY } from "@/constants/theme";
import { Image } from "expo-image";

const Avatar = ({ uri, size = 40, style, isGroup = false }) => {
  const [loading, setLoading] = useState(!!uri);

  useEffect(() => {
    if (uri) setLoading(true);
  }, [uri]);

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
        transition={200}
        cachePolicy="memory-disk"
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading && uri && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.neutral400} />
        </View>
      )}
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral200,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: "hidden",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutral200,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
