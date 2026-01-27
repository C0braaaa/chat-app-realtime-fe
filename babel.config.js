module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // 1. Thêm cấu hình Module Resolver
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src", // Quy định dấu @ chính là thư mục src
          },
        },
      ],
      // 2. Reanimated plugin phải luôn để cuối cùng
      "react-native-reanimated/plugin",
    ],
  };
};
