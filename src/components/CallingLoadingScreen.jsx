import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AnimatedDot = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ]),
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { opacity }]} />;
};

const CallingLoadingScreen = ({ onCancel, type }) => {
  const isVideo = type === "video";
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const iconPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    const a1 = pulse(ring1, 0);
    const a2 = pulse(ring2, 500);
    const a3 = pulse(ring3, 1000);
    a1.start();
    a2.start();
    a3.start();
    iconPulse.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      iconPulse.stop();
    };
  }, []);

  const ringStyle = (anim) => ({
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    opacity: anim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.6, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <View style={styles.topSection}>
        <Text style={styles.callTypeText}>
          {isVideo ? "📹 Cuộc gọi video" : "📞 Cuộc gọi thoại"}
        </Text>
        <Text style={styles.statusText}>Đang kết nối...</Text>
      </View>

      <View style={styles.centerSection}>
        <View style={styles.ringContainer}>
          <Animated.View style={ringStyle(ring1)} />
          <Animated.View style={ringStyle(ring2)} />
          <Animated.View style={ringStyle(ring3)} />
          <Animated.View
            style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}
          >
            <Text style={styles.iconText}>{isVideo ? "🎥" : "📱"}</Text>
          </Animated.View>
        </View>
        <Text style={styles.waitingText}>Vui lòng chờ trong giây lát</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <AnimatedDot key={i} delay={i * 300} />
          ))}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.cancelLabel}>Hủy</Text>
      </View>
    </View>
  );
};

export default CallingLoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 60,
  },
  bgTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#0d1b3e",
    opacity: 0.6,
  },
  bgBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#0a0a1a",
  },
  topSection: { alignItems: "center", gap: 8 },
  callTypeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    letterSpacing: 1,
  },
  statusText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  centerSection: { alignItems: "center", gap: 28 },
  ringContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#1a3a7a",
    borderWidth: 2,
    borderColor: "rgba(100,160,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4080ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  iconText: { fontSize: 36 },
  waitingText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  dotsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4080ff" },
  bottomSection: { alignItems: "center", gap: 10 },
  cancelBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#c0392b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  cancelIcon: { color: "#fff", fontSize: 22, fontWeight: "700" },
  cancelLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
});
