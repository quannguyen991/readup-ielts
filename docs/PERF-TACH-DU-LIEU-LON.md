# Tốc độ tải: tách dữ liệu lớn khỏi gói dùng chung (đo ngày 18/11/2026)

## Số đo (bản production, `expo export -p web`)
- Mọi trang tải `__common-*.js`: **87 MB** (≈20 MB gzip, ≈17 MB brotli). Nó nằm sẵn trong HTML của mọi trang.
- Mở `/hub/tutor`: ≈2,5 giây chạy script, bộ nhớ ≈86 MB. Phần lớn là **tải + phân tích cú pháp 87 MB**, không phải chạy dữ liệu:
  đo độ phủ mã thì chỉ 1/2211 mô-đun của `__common` được chạy ở trang này.
- Expo 57 không có tuỳ chọn chia gói (`experiments.chunking` chỉ có từ SDK 58; tài liệu: "The chunk splitting heuristic cannot be customized").

## Vì sao to
Metro gom mô-đun được **từ 2 route trở lên** dùng chung vào `__common`. Script `reach` (xem lịch sử phiên) cho thấy 54 tệp JSON ≥250 KB ngoài layout: 58 MB dùng chung ≥2 trang, 9 MB chỉ một trang. Nặng nhất:

| Dữ liệu | Kích thước | Số route chạm tới |
|---|---|---|
| east-asian-open-vocab + extra-zh/ja + hanyu + vocab | ≈16 MB | 55 |
| vocab-study4 | 5,6 MB | 53 |
| vocab-topics (seed) | 4,4 MB | 53 |
| bilingual/index | 3,9 MB | 4 |
| book-vocab | 2,7 MB | 53 |
| vocab-cambridge anki + entries | 3,4 MB | 46–48 |

Gần như toàn bộ do `src/data/vocab-topics.ts` và `study-decks.ts` (58 tệp nhập) gom thành mảng hằng đồng bộ.

## Việc đã làm
- `useTopicStudyStore` không còn nhập tĩnh `topic-fsrs` (cầu nối `topic-fsrs-registry.ts`): bớt việc chạy dữ liệu ở lớp gốc.
- Ảnh bối cảnh Luyện nói: 5,4 MB → 0,7 MB (WebP 640 px).
- Danh mục tìm kiếm đã nạp lười sẵn (`import()` trong SearchPalette).

## Cách giảm thật (cần làm có phối hợp, đụng 58 tệp)
Chỉ có một cách: dữ liệu thành **chunk riêng nạp theo yêu cầu** (`import()`), vì Metro không cho cấu hình. Gợi ý theo thứ tự lợi/hại:
1. Đưa `east-asian-*` ra khỏi `vocab-topics.ts` (≈16 MB): chỉ trang Trung/Nhật dùng. `BOOK_VOCAB_BOOKS` hiện gộp cả sách Trung/Nhật nên mọi nơi lặp qua `BOOK_VOCAB_DECKS` (tìm slug, FSRS, tìm kiếm) phải biết bộ Trung/Nhật có thể chưa nạp.
2. Cổng nạp dữ liệu theo nhóm route (`app/vocabulary/_layout.tsx`): `await loadVocabData()` rồi mới render; mô-đun dữ liệu xuất biến `let` gán sau khi nạp.
3. Rồi tới `vocab-study4`, `vocab-topics`, `book-vocab`, Cambridge anki.
Rủi ro: mảng hằng được dùng ngay khi mô-đun chạy (`const X = VOCAB_TOPICS.map(...)` ở cấp mô-đun) sẽ vỡ nếu chưa nạp. Cần test từng nhóm; **không làm khi phiên khác đang sửa phần từ vựng Trung/Nhật.**

## Cách đo lại
`NODE_ENV=production npx expo export -p web --output-dir dist-prod`, rồi đo kích thước `dist-prod/client/_expo/static/js/web/__common-*.js` và thời gian chạy script (CDP `Performance.getMetrics`).
