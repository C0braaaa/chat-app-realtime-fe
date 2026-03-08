import React from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { spacingX, radius, spacingY, colors } from "@/constants/theme";
import Typo from "./Typo";

const { width } = Dimensions.get("window");
const columnWidth = (width - spacingX._30) / 2;

const MediaCollection = ({ messages }) => {
  const mediaFiles = messages.filter(
    (msg) => msg.attachement !== null && typeof msg.attachement === "string",
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.imageWrapper}>
      <Image
        source={{ uri: item.attachement }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {mediaFiles.length > 0 ? (
        <FlatList
          data={mediaFiles}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.createdAt}
          numColumns={2}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Typo size={20} color={colors.primary} fontWeight={"500"}>
            Không có dữ liệu!
          </Typo>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, gap: 15, marginTop: spacingY._20 },
  imageWrapper: {
    display: "flex",
    width: columnWidth,
    height: columnWidth,
    padding: 2,
    gap: 20,
  },
  image: {
    flex: 1,
    borderRadius: radius._10,
    backgroundColor: "#333",
  },
});

export default MediaCollection;
