import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  StatusBar,
} from "react-native";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from "react-native-webrtc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSocket } from "@/contexts/socketContext";
import { useAuth } from "@/contexts/authContext";
import Avatar from "@/components/Avatar";
import Typo from "@/components/Typo";
import { spacingX, spacingY } from "@/constants/theme";

// ─── STUN servers (miễn phí của Google) ─────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function CallScreen() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();

  // Params khi MÌNH gọi:    to, callType, name, avatar
  // Params khi NHẬN cuộc gọi: from, offer, callType, name, avatar (isIncoming=true)
  const { to, from, callType, name, avatar, isIncoming, offer } =
    useLocalSearchParams();

  const isVideo = callType === "video";
  const remoteUserId = isIncoming === "true" ? from : to;
  const isMissedCall = isIncoming === "true" && !offer; // Tap từ notification khi app bị kill

  // ─── State ────────────────────────────────────────────────────────────────
  const [callStatus, setCallStatus] = useState(
    isIncoming === "true" ? "incoming" : "calling",
  ); // calling | incoming | connected | ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const pcRef = useRef(null); // RTCPeerConnection
  const pendingCandidates = useRef([]); // ICE candidates đến trước answer
  const callStatusRef = useRef(isIncoming === "true" ? "incoming" : "calling");

  // ─── Khởi tạo PeerConnection ──────────────────────────────────────────────
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Khi có ICE candidate → gửi cho đối phương qua socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    // Khi nhận được stream của đối phương
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        callStatusRef.current = "connected";
        setCallStatus("connected");
      }
    };

    // Dùng connectionState để update status (quan trọng cho audio call)
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        callStatusRef.current = "connected";
        setCallStatus("connected");
      } else if (state === "disconnected" || state === "failed") {
        endCall(false);
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // ─── Lấy camera/mic ───────────────────────────────────────────────────────
  const getLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
          ? { facingMode: "user", width: 640, height: 480 }
          : false,
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      Alert.alert("Lỗi", "Không thể truy cập camera/mic");
      endCall(false);
      return null;
    }
  };

  // ─── A: Bắt đầu gọi (tạo offer) ──────────────────────────────────────────
  const startCall = async () => {
    const pc = createPeerConnection();
    const stream = await getLocalStream();
    if (!stream) return;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offerSDP = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: isVideo,
    });
    await pc.setLocalDescription(offerSDP);

    socket.emit("call_user", {
      to: remoteUserId,
      offer: offerSDP,
      callType,
    });
  };

  // ─── B: Chấp nhận cuộc gọi ────────────────────────────────────────────────
  const acceptCall = async () => {
    setCallStatus("connected");
    const pc = createPeerConnection();
    const stream = await getLocalStream();
    if (!stream) return;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Set remote description từ offer nhận được
    const parsedOffer = JSON.parse(offer);
    await pc.setRemoteDescription(new RTCSessionDescription(parsedOffer));

    // Thêm các ICE candidate đã pending
    for (const c of pendingCandidates.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    pendingCandidates.current = [];

    // Tạo answer và gửi lại
    const answerSDP = await pc.createAnswer();
    await pc.setLocalDescription(answerSDP);

    socket.emit("accept_call", {
      to: remoteUserId,
      answer: answerSDP,
    });
  };

  // ─── Kết thúc cuộc gọi ────────────────────────────────────────────────────
  const endCall = (notifyRemote = true) => {
    if (notifyRemote && socket) {
      socket.emit("end_call", { to: remoteUserId });
    }

    // Dọn dẹp stream và peer connection
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("ended");

    router.back();
  };

  // ─── Từ chối cuộc gọi ─────────────────────────────────────────────────────
  const rejectCall = () => {
    socket?.emit("reject_call", { to: remoteUserId });
    router.back();
  };

  // ─── Toggle mic ───────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // ─── Toggle camera ────────────────────────────────────────────────────────
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  // ─── Đổi camera trước/sau ─────────────────────────────────────────────────
  const switchCamera = () => {
    localStream?.getVideoTracks().forEach((t) => {
      t._switchCamera();
    });
    setIsFrontCamera((prev) => !prev);
  };

  // ─── Lắng nghe socket events ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // A nhận được answer từ B
    const onCallAccepted = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        // Thêm ICE candidates đã pending
        for (const c of pendingCandidates.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];
      }
    };

    // Đối phương kết thúc cuộc gọi
    const onCallEnded = () => endCall(false);

    // Đối phương từ chối
    const onCallRejected = () => {
      Alert.alert("Thông báo", `${name} đã từ chối cuộc gọi`);
      endCall(false);
    };

    // Nhận ICE candidate từ đối phương
    const onIceCandidate = async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Chưa có remote description → lưu pending
        pendingCandidates.current.push(candidate);
      }
    };

    socket.on("call_accepted", onCallAccepted);
    socket.on("call_ended", onCallEnded);
    socket.on("call_rejected", onCallRejected);
    socket.on("ice_candidate", onIceCandidate);

    return () => {
      socket.off("call_accepted", onCallAccepted);
      socket.off("call_ended", onCallEnded);
      socket.off("call_rejected", onCallRejected);
      socket.off("ice_candidate", onIceCandidate);
    };
  }, [socket]);

  // ─── Khi mount: bắt đầu gọi hoặc chờ accept ─────────────────────────────
  useEffect(() => {
    if (isMissedCall) {
      setCallStatus("missed");
      return;
    }
    if (isIncoming !== "true") {
      startCall();

      // Timeout 20s nếu người kia không bắt máy
      const timeout = setTimeout(() => {
        if (callStatusRef.current !== "connected") {
          Alert.alert("Không có người trả lời", `${name} không bắt máy`);
          endCall(true);
        }
      }, 20000);

      return () => {
        clearTimeout(timeout);
        localStream?.getTracks().forEach((t) => t.stop());
        pcRef.current?.close();
      };
    }

    // Cleanup khi rời màn hình (incoming)
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, []);

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Video stream của đối phương (full screen) */}
      {isVideo && remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFillObject}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        // Audio call hoặc chưa kết nối → hiện avatar
        <View style={styles.avatarBackground}>
          <Avatar size={120} uri={avatar} />
          <Typo color="#fff" size={24} fontWeight="600" style={styles.nameText}>
            {name}
          </Typo>
          <Typo color="#aaa" size={16} style={styles.statusText}>
            {callStatus === "calling"
              ? "Đang gọi..."
              : callStatus === "incoming"
                ? isVideo
                  ? "Cuộc gọi video đến"
                  : "Cuộc gọi thoại đến"
                : callStatus === "connected"
                  ? !isVideo
                    ? "🎙️ Đang trong cuộc gọi"
                    : ""
                  : "Đang kết nối..."}
          </Typo>
        </View>
      )}

      {/* Video nhỏ của mình (góc trên phải) */}
      {isVideo && localStream && callStatus === "connected" && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
          zOrder={1}
        />
      )}

      {/* Nút điều khiển */}
      {callStatus === "missed" ? (
        // Cuộc gọi nhỡ (tap notification khi app bị kill)
        <View style={styles.missedCallContainer}>
          <Ionicons name="call-outline" size={40} color="#e74c3c" />
          <Typo
            color="#e74c3c"
            size={18}
            fontWeight="600"
            style={{ marginTop: 8 }}
          >
            Cuộc gọi nhỡ
          </Typo>
          <Typo
            color="#aaa"
            size={14}
            style={{ marginTop: 4, textAlign: "center" }}
          >
            Bạn đã bỏ lỡ cuộc gọi từ {name}.Hãy gọi lại cho họ.
          </Typo>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <Typo color="#fff" size={16} fontWeight="600">
              Đóng
            </Typo>
          </TouchableOpacity>
        </View>
      ) : callStatus === "incoming" ? (
        // Màn hình cuộc gọi đến → Nghe / Từ chối
        <View style={styles.incomingActions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
            <Ionicons
              name="call"
              size={32}
              color="#fff"
              style={{ transform: [{ rotate: "135deg" }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
            <Ionicons name="call" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        // Đang gọi → các nút điều khiển
        <View style={styles.controls}>
          {/* Mic */}
          <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={26}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Camera (chỉ hiện khi video call) */}
          {isVideo && (
            <>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={toggleCamera}
              >
                <Ionicons
                  name={isCameraOff ? "videocam-off" : "videocam"}
                  size={26}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={switchCamera}
              >
                <Ionicons name="camera-reverse" size={26} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* Kết thúc */}
          <TouchableOpacity style={styles.endBtn} onPress={() => endCall(true)}>
            <Ionicons
              name="call"
              size={28}
              color="#fff"
              style={{ transform: [{ rotate: "135deg" }] }}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  avatarBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  nameText: {
    marginTop: 12,
  },
  statusText: {
    marginTop: 4,
  },
  localVideo: {
    position: "absolute",
    top: 60,
    right: 16,
    width: 100,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    zIndex: 10,
  },
  controls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacingX._40,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
  },
  missedCallContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  closeBtn: {
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  incomingActions: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  rejectBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2ecc71",
    justifyContent: "center",
    alignItems: "center",
  },
});
