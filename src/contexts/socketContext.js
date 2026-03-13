// src/contexts/socketContext.js  ← THAY THẾ FILE CŨ
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./authContext";
import { useRouter } from "expo-router";

const SOCKET_URL = "https://cchat-be.onrender.com";
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const s = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      // ─── Lắng nghe cuộc gọi đến (toàn app) ───────────────────────────────
      s.on(
        "incoming_call",
        ({
          from,
          callerName,
          callerAvatar,
          offer,
          callType,
          conversationId,
          callId,
        }) => {
          // ✅ Truyền thêm callId xuống callscreen để receiver dùng khi accept/reject
          router.push({
            pathname: "/(main)/callscreen",
            params: {
              from,
              callType,
              name: callerName,
              avatar: callerAvatar,
              offer: JSON.stringify(offer),
              isIncoming: "true",
              conversationId,
              callId: callId || "", // 👈 THÊM
            },
          });
        },
      );

      socketRef.current = s;
      setSocket(s);
    };

    initSocket();

    return () => {
      socketRef.current?.off("incoming_call");
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
