/**
 * Điểm vào cho Vercel Functions.
 *
 * Vercel không chạy được `dist/server` của Expo trực tiếp, nên file này bọc
 * bản export bằng adapter chính chủ (`expo-server/adapter/vercel`). Mọi request
 * không khớp file tĩnh trong `dist/client` đều rơi vào đây (xem `vercel.json`),
 * rồi adapter tự định tuyến sang API route trong `app/api/*+api.ts`.
 *
 * Giữ nguyên CommonJS: @vercel/node nạp file này ở dạng CJS.
 */
const { createRequestHandler } = require('expo-server/adapter/vercel');

module.exports = createRequestHandler({
  build: require('path').join(__dirname, '../dist/server'),
});
