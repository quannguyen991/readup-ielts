const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Block watching .git directory to prevent Windows path crashes on turn-diffs/checkpoints
config.resolver.blockList = [
  /\.git[\/\\].*/,
];

// Giao diện Chiikawa: đổi mọi màu tím viết cứng sang hồng ngay ở chỗ thư viện chuẩn hoá màu
// (src/theme/chiikawa-recolor.ts). Mỗi móc chỉ thay đúng một module, chỉ trên web.
const HOOKS = [
  // style của react-native-web (backgroundColor, color, borderColor…)
  { name: /(^|[\/\\])normalizeValueWithProperty$/, origin: /react-native-web/, file: 'rnw-color-hook.js' },
  // fill / stroke / stopColor của react-native-svg
  { name: /^\.\/utils\/prepare$/, origin: /react-native-svg/, file: 'rnsvg-color-hook.js' },
  // màu của expo-linear-gradient
  { name: /^\.\/normalizeColor$/, origin: /expo-linear-gradient/, file: 'lineargradient-color-hook.js' },
];
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    for (const hook of HOOKS) {
      if (hook.name.test(moduleName) && hook.origin.test(context.originModulePath)) {
        return { type: 'sourceFile', filePath: path.join(__dirname, 'src', 'theme', hook.file) };
      }
    }
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
