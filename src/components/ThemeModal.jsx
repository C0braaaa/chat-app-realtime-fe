import React, { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";
import { CHAT_THEMES } from "@/constants/theme";

const ThemeModal = ({ visible, onClose, onSelect, currentThemeKey }) => {
  const [selectedKey, setSelectedKey] = useState(currentThemeKey || "0");
  const previewTheme =
    CHAT_THEMES.find((t) => t.id === selectedKey) || CHAT_THEMES[0];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Typo size={18} fontWeight="700" color={colors.white}>
              Chọn chủ đề
            </Typo>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close-circle"
                size={28}
                color={colors.neutral400}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Cột trái: Danh sách */}
            <ScrollView
              style={styles.listSide}
              showsVerticalScrollIndicator={false}
            >
              {CHAT_THEMES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeItem,
                    selectedKey === item.id && styles.activeItem,
                  ]}
                  onPress={() => setSelectedKey(item.id)}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: item.bubbleColor || colors.primary },
                    ]}
                  />
                  <Typo
                    color={colors.white}
                    size={14}
                    fontWeight={selectedKey === item.id ? "700" : "400"}
                  >
                    {item.name}
                  </Typo>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cột phải: Preview */}
            <View style={styles.previewSide}>
              {previewTheme.uri ? (
                <Image
                  source={{ uri: previewTheme.uri }}
                  style={styles.previewBg}
                />
              ) : (
                <View
                  style={[styles.previewBg, { backgroundColor: colors.white }]}
                />
              )}
              <View style={styles.previewContent}>
                <View
                  style={[
                    styles.bubble,
                    {
                      alignSelf: "flex-end",
                      backgroundColor: previewTheme.bubbleColor,
                    },
                  ]}
                >
                  <Typo size={10} color={previewTheme.textColor}>
                    Tin nhắn của bạn
                  </Typo>
                </View>
                <View
                  style={[
                    styles.bubble,
                    {
                      alignSelf: "flex-start",
                      backgroundColor: colors.neutral200,
                    },
                  ]}
                >
                  <Typo size={10} color={colors.black}>
                    Tin nhắn bạn bè
                  </Typo>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnConfirm}
              onPress={() => onSelect(selectedKey)}
            >
              <Typo color={colors.black} fontWeight="700">
                Áp dụng
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ThemeModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    height: "60%",
    backgroundColor: "#1c1c1e",
    borderRadius: radius._20,
    padding: spacingX._20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._15,
  },
  body: { flex: 1, flexDirection: "row", gap: spacingX._10 },
  listSide: { flex: 1 },
  previewSide: {
    flex: 1.2,
    borderRadius: radius._15,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  previewBg: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  previewContent: { flex: 1, padding: 10, justifyContent: "center" },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
    borderRadius: radius._10,
    marginBottom: 8,
  },
  activeItem: { backgroundColor: "#3a3a3c" },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
  },
  bubble: { padding: 8, borderRadius: 12, marginVertical: 4, maxWidth: "90%" },
  footer: { marginTop: 15 },
  btnConfirm: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: radius._10,
    alignItems: "center",
  },
});
