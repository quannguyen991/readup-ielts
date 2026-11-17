const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Mặc định Metro mở (số nhân CPU − 1) tiến trình biên dịch, mỗi cái vài trăm MB; máy 16 nhân thì thành ~15 cái.
// Bốn worker là đủ cho app này và tiết kiệm nhiều GB RAM. Đổi bằng METRO_MAX_WORKERS nếu cần.
config.maxWorkers = Number(process.env.METRO_MAX_WORKERS ?? 4);

// Block watching .git directory to prevent Windows path crashes on turn-diffs/checkpoints
// Thư mục KHÔNG chứa mã nguồn nhưng rất nhiều tệp (public ~86 000 clip âm thanh/ảnh, dist, tmp…): bỏ khỏi bản đồ tệp của
// Metro thì khởi động nhanh hơn nhiều và không còn hết bộ nhớ lúc quét. Web vẫn phục vụ `public/` bằng middleware riêng của
// Expo (đọc thẳng từ ổ đĩa), nên các đường dẫn /audio/... không đổi.
const escapeRe = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SKIP_DIRS = ['public', 'dist', 'tmp', 'tmp-art', 'outputs', 'work', '.claude', 'docs', 'scratchpad', 'supabase'];
config.resolver.blockList = [
  /\.git[\/\\].*/,
  ...SKIP_DIRS.map((d) => new RegExp(`^${escapeRe(path.join(__dirname, d))}[\\\\/].*`)),
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
