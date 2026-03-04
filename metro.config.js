const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Zego Call Kit may require `react-native-sound` for ringtone/callkit features.
// In this app we don't rely on ringtone playback, so we provide a safe no-op shim
// to avoid runtime crashes in release builds when the native module isn't linked.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "react-native-sound": path.resolve(__dirname, "src/shims/react-native-sound"),
};

module.exports = config;

