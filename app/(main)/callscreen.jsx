import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ZegoUIKitPrebuiltCallInCallScreen from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { useAuth } from "@/contexts/authContext";
import api from "@/utils/api";

export default function CallScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { callID, type } = useLocalSearchParams();

    // Lấy Key từ .env
    const appId = Number(process.env.EXPO_PUBLIC_APP_ID);
    const appSign = process.env.EXPO_PUBLIC_APP_SIGN;

    const handleSaveCallHistory = async (status, duration) => {
        try {
            const messageContent = JSON.stringify({
                isCall: true,
                callData: { type, status, duration },
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

    if (!user || !callID) return null;

    return (
        <View style={styles.container}>
            <ZegoUIKitPrebuiltCallInCallScreen
                appID={appId}
                appSign={appSign}
                userID={String(user._id)}
                userName={user.name || "User"}
                callID={callID}
                config={{
                    onHangUp: (duration) => {
                        handleSaveCallHistory("completed", duration).finally(() => router.back());
                    },
                    onError: () => router.back(),
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({ container: { flex: 1 } });