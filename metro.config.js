// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "react-native-sound":
    require.resolve("./src/shims/react-native-sound/index.js"),
};

module.exports = config;
