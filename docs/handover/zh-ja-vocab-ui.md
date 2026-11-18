# Bàn giao: giao diện từ vựng Tiếng Trung và Tiếng Nhật

Tài liệu cho phiên làm tiếp. Người dùng nói tiếng Việt, muốn kết quả làm đến cùng, ngắn gọn, và xác nhận bằng ảnh chụp trình duyệt.

## 1. Phạm vi và trạng thái

**Đã xong (chưa commit):**
- Trang sách Nhật (`app/vocabulary/book/[slug].tsx`, nhánh `ja`): hero xanh rừng, lưới chủ đề có tranh riêng.
- Trang bộ Nhật (`app/vocabulary/book/[slug]/[topic].tsx` → `JaUnitPage`): tranh chủ đề, hai mục "Bài hội thoại" và "Từ riêng lẻ".
- Trang bài Nhật (`app/vocabulary/topic/[slug]/index.tsx`, nhánh `ja`): đầu trang có tranh, thanh tiến độ, thẻ cách luyện và trạng thái kiểu Nhật (`JaTile`), từ vựng kiểu Nhật (`JaWordRow`), thanh "các bài cùng chủ đề" (`JaSiblingLessons`), nền mờ phố Nhật (`JaPageBackdrop`).
- Dữ liệu: 50 bài "từ riêng lẻ" (918 từ) tách từ 9 bộ Irodori, trong `src/data/east-asian-vocab.ts`. Bài hội thoại có slug chứa `irodori` và không có `-tu-`; bài từ riêng lẻ có `-tu-NN`.
- Tranh: 18 cảnh hội thoại (Bài 1–18), 9 icon cách luyện, 6 sticker, khung góc v2, 50 tranh bài từ riêng lẻ (`ja-set-NN.png`). Ánh xạ slug → tranh nằm trong `JA_SET_ART`.
- Trang bài Trung Quốc chưa đổi trong phiên này (`ChineseTopicPage`, `ZhPracticeGrid`, `ZhLessonList`...).
- Thanh bên (`src/components/layout/Sidebar.tsx`, `AppShell.tsx`): đã thêm chuyển động bề rộng, đã đưa vào lớp cố định để không dựng lại khi đổi trang, và các trang tác vụ giữ trạng thái thu gọn/mở rộng người dùng chọn.

**Chưa làm (ưu tiên từ trên xuống):**
1. **Kiểm bản điện thoại (375px)** cho trang bộ Nhật, trang bài Nhật, và danh sách 50 bài từ riêng lẻ. Đã kiểm trang bài và thẻ ghi nhớ; chưa kiểm hết.
2. **Đầu trang bài Trung Quốc** vẫn là `ChineseTopicPage` cũ; cần đối chiếu với phong cách Nhật (khung, tranh, thanh tiến độ) nếu người dùng muốn đồng bộ.
3. **Sách JLPT** (`book-jlpt-open-vocabulary`) chỉ được đổi khung và màu; chưa có tranh riêng và chưa có các thành phần JA như lưới tranh.
4. **Tranh bài 19** ("Dụng cụ văn phòng", slug `book-irodori-starter-topic-04-tu-06`) dùng tranh gần đúng (đống giấy và kẹp). Cần vẽ lại đúng nội dung: hộp, băng dính, máy photocopy, kéo, thùng rác.
5. **Thanh bên** (Sidebar) vẫn dùng bảng màu chung của app; người dùng đã hỏi có muốn đổi sang xanh rừng không và chưa trả lời.
6. **Nút "Thêm cả bộ"** đã đổi cho Nhật; các bộ khác vẫn gradient tím.
7. **Chuyển trang tác vụ**: đã sửa việc dựng lại thanh bên; chưa kiểm tra kỹ chuyển giữa trang duyệt và trang tác vụ bằng ảnh.
8. **Đánh dấu vẽ đè**: trang bài Nhật có `JaTile` cho cách luyện; các thành phần Flashcards/ExampleSentence vẫn dùng chung của app.

## 2. Bản đồ file

**Code Nhật (của phiên này):**
- `src/components/vocab/japanese/ja-art.ts`: bảng màu `JA`, `JA_THUMB` (thumbnail chủ đề), `JA_STICKER`, `JA_MODE_ART`, `JA_STATUS_ART`, `JA_SCENE` (cảnh Bài 1–18), `JA_SET_ART` (50 tranh bài từ riêng lẻ), `isDialogueLesson`, `isVocabLesson`, `sceneOf`.
- `src/components/vocab/japanese/JaBookParts.tsx`: `JaIntroHero`, `JaSectionTitle`, `JaTopicGrid`, `JaLessonCard`, `JaUnitPage`, `JaLessonHero`, `JaProgressBar`, `JaPageBackdrop`, `JaTile`, `JaWordRow`, `JaSiblingLessons`.
- `src/components/vocab/chinese/v4.ts`: khối `ZH_V4.ja` (banner, bg, corner, frameH, frameV, các sticker/tranh).
- `src/components/vocab/chinese/IntroHero.tsx`, `ZhNineFrame.tsx`: `ZhLevelCorners` dùng chung cho góc khung.
- `src/components/vocab/ToneTile.tsx`: thêm prop `art` (tranh riêng thay cho hoạ tiết và icon).
- `src/components/vocab/study/Flashcards.tsx`: hàng điều khiển cho phép xuống dòng (dùng chung cho mọi bộ).
- `src/data/east-asian-vocab.ts`: sinh bài từ riêng lẻ (`standaloneVocabLessons`), giữ `topic.words` chỉ từ hội thoại.
- `app/vocabulary/book/[slug].tsx`, `app/vocabulary/book/[slug]/[topic].tsx`, `app/vocabulary/topic/[slug]/index.tsx`.
- `src/components/layout/AppShell.tsx`, `Sidebar.tsx`.

**Tài nguyên:**
- `assets/chinese/v4/ja/`: banner-ja.jpg, page-bg-ja.jpg, ja-corner.png (đã thay bằng ja-frame-corner-v2.png trong `ZH_V4.ja.corner`), ja-frame-hbar-v2.png, ja-frame-vbar-v2.png, ja-st-*.png (sticker), ja-md-*.png (icon cách luyện), ja-scene-b01..b18.png, thumb-01..09.jpg, ja-set-01..50.png.

**Raw và công cụ (đã sao vào repo):**
- `docs/design/chinese-vocab/raw/v5/ja/`: các tấm ChatGPT gốc (frames-sheet-v2, stickers-v2, modes-v1, lessons-a/b-v1, sets-a..f-v1, picnic-v1).
- `docs/design/chinese-vocab/scripts/`: `zh_v4_process.py` (chroma key và tách thành phần, dùng cho mọi tấm), `zh_v5_ja_frames.py`, `zh_v5_ja_stickers.py`, `zh_v5_ja_sets.py`. Các script này đọc đường dẫn scratchpad tuyệt đối; khi chạy lại hãy đổi `sys.path` và đường dẫn `word_sets_plan.json` / `set_index.json` sang `docs/design/chinese-vocab/data/`.
- `docs/design/chinese-vocab/data/`: `word_sets_plan.json` (kế hoạch 6 tấm A–F, slug và mô tả cảnh), `set_index.json` (slug → tên file tranh).

## 3. Quy trình sinh tranh ChatGPT (đã chạy được)

1. Chọn trình duyệt: `mcp__claude-in-chrome__select_browser` với deviceId `e4278a5b-becf-4e10-ac30-f104b76d1738` (tài khoản ChatGPT phụ, đã đăng nhập). Luôn gọi `tabs_context_mcp` (createIfEmpty) trong cùng một tin nhắn. Nhóm tab hay đổi giữa hai Chrome; nếu lệnh báo "Tab không trong nhóm", lặp lại cặp này.
2. Mở chat mới: `javascript_exec` với `window.location.assign('https://chatgpt.com/')`.
3. Gõ prompt bằng `document.execCommand('insertText', ...)` vào `#prompt-textarea` hoặc `div[contenteditable]`. Gửi bằng phím thật: `mcp__claude-in-chrome__computer` với `action: key`, `text: Return`. Phím tổng hợp qua JS không gửi được.
4. Chờ ảnh: vòng lặp JS tìm `img` có `naturalWidth > 400`, lấy ảnh cuối và tạo `<a download>`. Lưu ý JS không được trả về chuỗi có query string (bị chặn), chỉ trả trạng thái.
5. File tải về nằm ở `D:\` hoặc `D:\MovedFromC\Downloads\` (không cố định). Tìm bằng `ls -t`, rồi `mv` vào `docs/design/chinese-vocab/raw/v5/ja/`.
6. Đọc ảnh bằng `Read` để kiểm tra nội dung trước khi cắt. Ghi lại lỗi nếu có (ví dụ tấm C không đúng thứ tự, đã phải ánh xạ theo nội dung).
7. Cắt nền magenta bằng `zh_v4_process.extract` (theo lưới 3×3 hoặc theo hình dạng), rồi `save` ra `assets/chinese/v4/ja/`. Đăng ký slug trong `set_index.json` và `JA_SET_ART`.

**Prompt mẫu (tấm từ riêng lẻ):** "nine separate illustrated scene cards arranged in a 3 by 3 grid on a solid pure magenta #FF00FF background... gouache Japanese illustration style with gold-leaf accents and cherry blossoms... No text, no letters, no Japanese characters, no watermark." Liệt kê từng cảnh theo thứ tự trái → phải, trên → dưới.

## 4. Lỗi đã gặp và cách xử lý

- **Metro hết bộ nhớ (exit 134, EMFILE)**: cache Metro bị hỏng. Xoá `C:\Users\admin\AppData\Local\Temp\metro-cache` và `metro-file-map-expo-*`. Chạy server bằng `NODE_OPTIONS=--max-old-space-size=8192 npx expo start --web --port 8098` (nền). Mở bằng `preview_start` với `url`. Nếu thấy 61 tiến trình node, cảnh báo: có thể có server của phiên khác; không kill bừa.
- **Trang trắng khi tải lần đầu**: làm nóng bằng cách tải trang gốc `/vocabulary/book/book-irodori-starter`, rồi tải trang bài. Nếu vẫn trắng, `tabs_select` rồi chụp lại.
- **Pane ẩn**: `tabs_select` trước khi chụp; nếu tab kẹt, mở tab mới bằng `tabs_create`.
- **Giới hạn tab**: đóng tab cũ bằng `tabs_close` (tối đa khoảng 9 tab).
- **Lệnh tsc**: `NODE_OPTIONS=--max-old-space-size=3072 npx tsc --noEmit -p .` (có lúc bị OOM khi nhiều node chạy).
- **Heredoc bash**: nếu có nội dung nhiều dòng, dùng `Write` để tạo file scratch, rồi `python` đọc file đó. Heredoc thiếu `EOF` làm lệnh lỗi im lặng.
- **Edit tool**: nếu file thay đổi trên đĩa (do script Python), phải `Read` lại trước khi `Edit`.

## 5. Các quy ước và lưu ý

- Thay đổi chưa commit. Git có nhiều thay đổi của phiên khác (hsa, learning-path, sync, scripts/listening). **Chỉ commit các file liệt kê ở mục 2**, không dùng `git add -A`.
- Không gọi `preview_stop` cho server của phiên khác; chỉ dừng server mình khởi động.
- Với mọi thay đổi giao diện: `tsc` sạch, rồi chụp trang ở 1280px và 375px bằng browser pane, rồi mới báo xong.
- Không đoán nội dung học tiếng Nhật: nghĩa và phiên âm lấy từ `src/data/east-asian-vocab.json` và `east-asian-extra-ja.json`.
- Phong cách: vàng kim, xanh rừng, kem, đỏ son. Tránh viền hoa lặp lại trên mỗi thẻ (người dùng đã chê "quê"); ưu tiên tranh là điểm nhấn.
- Người dùng muốn trả lời ngắn, không hỏi lại khi đã rõ việc; việc hoàn thành thì làm đến cùng.
