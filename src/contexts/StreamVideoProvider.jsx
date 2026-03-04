import React, { useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-native-sdk';
import { useAuth } from './authContext'; // Đảm bảo đúng đường dẫn tới authContext của bạn
import api from '@/utils/api';

const apiKey = 'dut25tbhrhtn'; 

export const StreamVideoProvider = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (!user || !user._id) {
      if (client) {
        client.disconnectUser();
        setClient(null);
      }
      return;
    }

    const initStream = async () => {
      try {
        // 1. Gọi API Backend (Render) để lấy Token
        const res = await api.post('/stream/token', { userId: user._id });
        const token = res.data.token;

        // 2. Khởi tạo Client
        const streamClient = new StreamVideoClient({
          apiKey,
          user: {
            id: user._id,
            name: user.name || 'User',
            image: user.avatar,
          },
          token,
        });

        setClient(streamClient);
      } catch (error) {
        console.error('Lỗi khởi tạo Stream:', error);
      }
    };

    initStream();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [user]);

  if (!client) return children;

  return (
    <StreamVideo client={client}>
      {children}
    </StreamVideo>
  );
};