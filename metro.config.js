const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "react-native-sound": require.resolve("./src/mocks/react-native-sound.js"),
};

module.exports = config;
