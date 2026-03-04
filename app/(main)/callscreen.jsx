import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CallContent, useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import api from "@/utils/api";
import { useAuth } from "@/contexts/authContext";

export default function CallScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { callID, type } = useLocalSearchParams();
  const client = useStreamVideoClient();
  const [call, setCall] = React.useState(null);

  useEffect(() => {
    if (!client || !callID) return;

    // Tạo hoặc tham gia cuộc gọi
    const _call = client.call('default', callID);
    _call.join({ create: true }).then(() => setCall(_call));

    return () => {
      if (_call) _call.leave();
    };
  }, [client, callID]);

  // Hàm lưu lịch sử giống hệt logic cũ của bạn
  const handleSaveCallHistory = async () => {
    try {
      const messageContent = JSON.stringify({
        isCall: true,
        callData: { type, status: "completed", duration: 0 },
      });
      await api.post("/messages", {
        conversationId: callID,
        content: messageContent,
        senderId: user?._id,
      });
    } catch (error) {
        console.log("Lỗi lưu lịch sử:", error);
    }
  };

  if (!call) return <View style={styles.loading}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <CallContent 
        onHangupCallHandler={() => {
          handleSaveCallHistory().finally(() => router.back());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }
});