import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
import { spacingX } from "@/constants/theme";
import InCallManager from "react-native-incall-manager";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function CallScreen() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();

  // Params khi MÌNH gọi:      to, callType, name, avatar, conversationId
  // Params khi NHẬN cuộc gọi: from, offer, callType, name, avatar, isIncoming, conversationId, callId
  const {
    to,
    from,
    callType,
    name,
    avatar,
    isIncoming,
    offer,
    conversationId,
    callId: incomingCallId,
  } = useLocalSearchParams();

  const isVideo = callType === "video";
  const remoteUserId = isIncoming === "true" ? from : to;
  const isMissedCall = isIncoming === "true" && !offer; // Tap notification khi app bị kill

  // ─── State ─────────────────────────────────────────────────────────────────
  const [callStatus, setCallStatus] = useState(
    isIncoming === "true" ? "incoming" : "calling",
  );
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  // ─── Refs ───────────────────────────────────────────────────────────────────
  const pcRef = useRef(null);
  const pendingCandidates = useRef([]);
  const callStatusRef = useRef(isIncoming === "true" ? "incoming" : "calling");

  // ✅ callId ref — tránh stale closure trong event handlers
  // Receiver dùng incomingCallId từ params, Caller nhận qua socket "call_initiated"
  const callIdRef = useRef(incomingCallId || null);

  // ─── PeerConnection ─────────────────────────────────────────────────────────
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        callStatusRef.current = "connected";
        setCallStatus("connected");
      }
    };

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

  // ─── Lấy camera/mic ─────────────────────────────────────────────────────────
  const getLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
          ? { facingMode: "user", width: 640, height: 480 }
          : false,
      });
      setLocalStream(stream);
      InCallManager.start({ media: isVideo ? "video" : "audio" });
      InCallManager.setForceSpeakerphoneOn(isVideo);
      setIsSpeakerOn(isVideo);
      return stream;
    } catch (err) {
      Alert.alert("Lỗi", "Không thể truy cập camera/mic");
      endCall(false);
      return null;
    }
  };

  // ─── A. Caller: tạo offer ───────────────────────────────────────────────────
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
      conversationId, // server dùng để tạo call record
    });
    // callId sẽ được nhận về qua event "call_initiated"
  };

  // ─── B. Receiver: chấp nhận cuộc gọi ───────────────────────────────────────
  const acceptCall = async () => {
    setCallStatus("connected");
    const pc = createPeerConnection();
    const stream = await getLocalStream();
    if (!stream) return;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const parsedOffer = JSON.parse(offer);
    await pc.setRemoteDescription(new RTCSessionDescription(parsedOffer));

    for (const c of pendingCandidates.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    pendingCandidates.current = [];

    const answerSDP = await pc.createAnswer();
    await pc.setLocalDescription(answerSDP);

    // ✅ Truyền callId → server cập nhật startedAt
    socket.emit("accept_call", {
      to: remoteUserId,
      answer: answerSDP,
      callId: callIdRef.current,
    });
  };

  // ─── Kết thúc cuộc gọi ──────────────────────────────────────────────────────
  const endCall = (notifyRemote = true) => {
    if (notifyRemote && socket) {
      // ✅ Truyền callId → server cập nhật status + duration
      socket.emit("end_call", {
        to: remoteUserId,
        callId: callIdRef.current,
      });
    }

    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("ended");
    InCallManager.stop();
    router.back();
  };

  // ─── Từ chối cuộc gọi ───────────────────────────────────────────────────────
  const rejectCall = () => {
    // ✅ Truyền callId → server cập nhật status = rejected
    socket?.emit("reject_call", {
      to: remoteUserId,
      callId: callIdRef.current,
    });
    router.back();
  };

  // ─── Toggle mic / camera ────────────────────────────────────────────────────
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  const switchCamera = () => {
    localStream?.getVideoTracks().forEach((t) => {
      t._switchCamera();
    });
    setIsFrontCamera((prev) => !prev);
  };

  const toggleSpeaker = () => {
    const next = !isSpeakerOn;
    InCallManager.setForceSpeakerphoneOn(next);
    setIsSpeakerOn(next);
  };

  // ─── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // ✅ Caller nhận callId sau khi server tạo xong call record
    const onCallInitiated = ({ callId }) => {
      if (callId) callIdRef.current = callId;
    };

    const onCallAccepted = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        for (const c of pendingCandidates.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];
      }
    };

    const onCallEnded = () => endCall(false);

    const onCallRejected = () => {
      Alert.alert("Thông báo", `${name} đã từ chối cuộc gọi`);
      endCall(false);
    };

    const onIceCandidate = async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    socket.on("call_initiated", onCallInitiated); // 👈 THÊM
    socket.on("call_accepted", onCallAccepted);
    socket.on("call_ended", onCallEnded);
    socket.on("call_rejected", onCallRejected);
    socket.on("ice_candidate", onIceCandidate);

    return () => {
      socket.off("call_initiated", onCallInitiated);
      socket.off("call_accepted", onCallAccepted);
      socket.off("call_ended", onCallEnded);
      socket.off("call_rejected", onCallRejected);
      socket.off("ice_candidate", onIceCandidate);
    };
  }, [socket]);

  // ─── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMissedCall) {
      setCallStatus("missed");
      return;
    }

    if (isIncoming !== "true") {
      startCall();

      // Timeout 20s → nếu chưa kết nối được thì tự kết thúc
      // Server giữ nguyên status "missed" — không cần update thêm
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

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, []);

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {isVideo && remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFillObject}
          objectFit="cover"
          mirror={false}
        />
      ) : (
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

      {isVideo && localStream && callStatus === "connected" && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
          zOrder={1}
        />
      )}

      {!isVideo && callStatus === "connected" && (
        <TouchableOpacity
          style={[styles.speakerBtn, isSpeakerOn && styles.speakerBtnActive]}
          onPress={toggleSpeaker}
        >
          <Ionicons
            name={isSpeakerOn ? "volume-high" : "volume-low"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      {callStatus === "missed" ? (
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
            Bạn đã bỏ lỡ cuộc gọi từ {name}. Hãy gọi lại cho họ.
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
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={26}
              color="#fff"
            />
          </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  avatarBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  nameText: { marginTop: 12 },
  statusText: { marginTop: 4 },
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
  speakerBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  speakerBtnActive: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
});
