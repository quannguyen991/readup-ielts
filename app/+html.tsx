// Khung HTML gốc cho mọi trang web (chỉ chạy ở Node lúc dựng tĩnh / SSR).
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

/**
 * Khác bản mặc định của Expo ở bốn chỗ, đều để dùng tốt trên điện thoại:
 *  - `viewport-fit=cover` — không có nó thì `env(safe-area-inset-*)` luôn bằng 0
 *    trên iPhone có tai thỏ / thanh Home, nên thanh tab dưới bị đè lên vạch Home.
 *    Không đặt `maximum-scale`/`user-scalable=no`: người dùng vẫn phóng to được.
 *  - `theme-color` khớp màu nền trang, để thanh trạng thái của trình duyệt /
 *    PWA không là một dải lạ phía trên app bar.
 *  - `lang="vi"` để trình duyệt chọn đúng phông và gợi ý bàn phím.
 *  - `interactive-widget=resizes-content`: bàn phím ảo co vùng bố cục (như
 *    `dvh`) thay vì đè lên ô nhập.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="vi" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <meta name="theme-color" content="#FCFAF7" />
        <meta name="color-scheme" content="light" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Tắt cuộn thân trang để ScrollView hoạt động như native (bản mặc định của Expo). */}
        <ScrollViewStyleReset />

        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
