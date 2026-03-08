import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";
import Avatar from "@/components/Avatar";
import api from "@/utils/api";
import { useAuth } from "@/contexts/authContext";
import { useDebounce } from "@/hooks/useDebounce";

const SearchMessagesModal = ({
  visible,
  onClose,
  conversationId,
  onSelectMessage,
}) => {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceValue = useDebounce(searchText, 500);
  useEffect(() => {
    if (debounceValue.trim()) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [debounceValue]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/search/${conversationId}`, {
        params: {
          keyword: debounceValue,
          userId: user?._id,
        },
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
          {item.senderId?.name === user?.name ? "Bạn" : item.senderId?.name}
        </Typo>
        <Typo size={14} color={colors.neutral300} numberOfLines={2}>
          {item.content}
        </Typo>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Tìm kiếm tin nhắn..."
              placeholderTextColor={colors.neutral400}
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
              selectionColor={colors.primary}
            />
            {loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            {searchText.length > 0 && !loading && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.neutral400}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.infoBar}>
          <Typo color={colors.neutral400} size={14} fontWeight="500">
            {results.length} tin nhắn khớp
          </Typo>
        </View>

        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading &&
            searchText.length > 0 && (
              <View style={styles.emptyContainer}>
                <Typo color={colors.neutral400}>
                  Không có kết quả nào phù hợp
                </Typo>
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
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? verticalScale(60) : verticalScale(40),
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._15,
    gap: spacingX._12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    borderRadius: radius._12,
    paddingHorizontal: spacingX._12,
    height: verticalScale(45),
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: scale(16),
    paddingVertical: 0,
  },
  infoBar: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._12,
    borderBottomWidth: 0.3,
    borderBottomColor: "#262626",
  },
  resultItem: {
    flexDirection: "row",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    alignItems: "center",
    gap: spacingX._15,
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
});
