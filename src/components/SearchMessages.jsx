import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";
import Avatar from "@/components/Avatar";
import api from "@/utils/api";

const SearchMessagesModal = ({
  visible,
  onClose,
  conversationId,
  onSelectMessage,
}) => {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce search để tránh call API liên tục
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/search/${conversationId}`, {
        params: { query: searchText },
      });
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onSelectMessage(item)}
    >
      <Avatar
        size={scale(45)}
        uri={item.senderId?.avatar}
        rounded={radius.full}
      />
      <View style={styles.textContent}>
        <Typo fontWeight="600" size={16} color={colors.white}>
          {item.senderId?.name || "Người dùng"}
        </Typo>
        <Typo size={14} color={colors.neutral300} numberOfLines={1}>
          {item.content}
        </Typo>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header Search */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Tìm kiếm tin nhắn..."
              placeholderTextColor={colors.neutral400}
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </View>

        <View style={styles.infoBar}>
          <Typo color={colors.neutral400} size={14}>
            {results.length} tin nhắn khớp
          </Typo>
        </View>

        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading &&
            searchText.length > 0 && (
              <View style={styles.emptyContainer}>
                <Typo color={colors.neutral400}>Không tìm thấy kết quả</Typo>
              </View>
            )
          }
        />
      </View>
    </Modal>
  );
};

export default SearchMessagesModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: verticalScale(50),
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._10,
    gap: spacingX._10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: radius._10,
    paddingHorizontal: spacingX._12,
    height: verticalScale(45),
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: scale(16),
  },
  infoBar: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  resultItem: {
    flexDirection: "row",
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._12,
    alignItems: "center",
    gap: spacingX._12,
  },
  textContent: { flex: 1, gap: 2 },
  listContent: { paddingBottom: 20 },
  emptyContainer: { alignItems: "center", marginTop: 50 },
});
