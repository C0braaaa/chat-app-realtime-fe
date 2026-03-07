import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useAuth } from "./authContext";

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

      // Lắng nghe cuộc gọi đến → điều hướng sang màn IncomingCall
      s.on("incoming_call", ({ callerId, callerInfo, callType, offer }) => {
        router.push({
          pathname: "/(main)/incomingCall",
          params: {
            callerId,
            callerName: callerInfo?.name || "Ai đó",
            callerAvatar: callerInfo?.avatar || "",
            callType,
            // offer sẽ dùng nếu bạn implement WebRTC thuần,
            // với Zego thì bạn chỉ cần callerId để join room
            conversationId: callerId, // Zego dùng callID, tạm dùng callerId
          },
        });
      });

      s.on("call_ended", () => {
        // Nếu đang ở màn incomingCall mà bên kia cancel
        router.canGoBack() && router.back();
      });

      socketRef.current = s;
      setSocket(s);
    };

    initSocket();

    return () => {
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
