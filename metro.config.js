const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Block watching .git directory to prevent Windows path crashes on turn-diffs/checkpoints
config.resolver.blockList = [
  /\.git[\/\\].*/,
];

module.exports = withNativeWind(config, { input: './global.css' });

