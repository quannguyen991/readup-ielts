# Prompt gửi ChatGPT: gắn video nền + giao diện tranh cổ động vào web

## Cách đưa folder cho ChatGPT

ChatGPT không đọc được ổ đĩa của bạn, nên:
1. Gửi **file `web-bg-pack.zip`** (nén thư mục này, khoảng 1 MB) bằng nút đính kèm.
2. Gửi kèm **mã nguồn của chính trang web** bạn muốn sửa: ít nhất component hiện đang hiển thị ảnh nền,
   khung chữ bên trái, thanh chọn cảnh 1–12 và bộ phát âm thanh (dán code hoặc đính kèm file `.tsx/.jsx/.css`).
3. Dán nguyên phần **PROMPT** bên dưới, điền bảng ở mục 4 trước khi gửi.

Nếu dùng Codex/Claude Code đang mở sẵn project web thì khỏi zip: trỏ thẳng tới thư mục này.

---

## PROMPT (dán từ dòng này)

Bạn là kỹ sư frontend React 19. Tôi có web học lịch sử Việt Nam bằng tiếng Anh (React 19). Hiện mỗi cảnh
có **ảnh nền phủ kín**, **khung chữ song ngữ bên trái**, **thanh bước cảnh 9–12**, và **bộ phát âm thanh**
(nút play, tốc độ 0.75×). Tôi muốn **thay ảnh nền tĩnh bằng video nền lặp** và đổi giao diện sang
**phong cách tranh cổ động** (xanh rừng, đỏ cờ, vàng sao, giấy kem). Tôi đính kèm `web-bg-pack.zip`.

### 1. Nội dung gói đính kèm
- `road|dawn|night|battle|flag` mỗi loại có `.webm`, `.mp4`, `-poster.jpg` (clip 8 giây, lặp liền mạch, tắt tiếng, không chữ)
- `SceneBackground.tsx` — component React 19: hiện ảnh bìa ngay, tải video sau, dừng khi tab ẩn,
  tôn trọng `prefers-reduced-motion`, chuyển cảnh mờ dần khi đổi `scene.base`
- `poster-theme.css` — biến màu, khung chữ, huy hiệu, nút bước hình sao, thanh phát âm thanh, lớp tối nhẹ sau khung chữ

### 2. Việc cần làm (làm đúng thứ tự)
1. Chép các file `road/dawn/night/battle/flag.*` vào thư mục tĩnh của app (ví dụ `public/bg/`).
   Chép `SceneBackground.tsx` vào `src/components/` và `poster-theme.css` vào nơi chứa CSS toàn cục, rồi import nó
   **sau** CSS hiện có. Nạp font Playfair Display, Barlow Condensed, Be Vietnam Pro như hướng dẫn đầu file CSS.
2. Tìm component đang render **ảnh nền của cảnh** và thay bằng:
   `<SceneBackground scene={{ base: BG_BY_SCENE[sceneIndex] }} />`
   đặt ngay dưới thẻ gốc của trang với `position: fixed; inset: 0; z-index: 0`. Nội dung còn lại phải có
   `position: relative; z-index: 1`. Thêm `<div className="scene-scrim" />` giữa video và nội dung.
3. Tạo bảng ánh xạ cảnh → clip (đường dẫn không có đuôi, ví dụ `/bg/road`) theo bảng ở mục 4.
   Cảnh không có trong bảng dùng `/bg/dawn`.
4. Gắn class của `poster-theme.css` lên các phần tử hiện có (đổi tên class của tôi sang tên mới, không viết lại logic):
   khung chữ → `scene-card` (kèm `.badge`, `.badge.period`, `.subtitle`, `.place`, `.en`, `.vi`),
   thanh chọn ngôn ngữ → `lang-tabs`, nút bước → `step` (`aria-current="step"` cho cảnh đang chọn),
   bộ phát → `player` (`.play`).
5. Đánh dấu từ đang đọc bằng `.word-hl` nếu trang đã có đồng bộ chữ với âm thanh; nếu chưa có thì bỏ qua.
6. Xoá các ảnh nền cũ **chỉ khi** không còn chỗ nào dùng. Giữ lại ảnh cũ nếu còn dùng ở trang khác.

### 3. Ràng buộc (không được vi phạm)
- **Không sửa logic âm thanh, tiến trình, chuyển cảnh, i18n.** Chỉ thay lớp nền và class/CSS.
- Video nền **luôn `muted`**, không bao giờ phát tiếng; tiếng chỉ đến từ bộ phát hiện có.
- Không thêm thư viện mới. Nếu cần thì hỏi trước.
- Khung chữ phải **luôn đọc được** trên mọi clip nền (kiểm bằng mắt hoặc contrast ≥ 4.5:1).
- Trên điện thoại (<768px) khung chữ chiếm toàn chiều ngang phía dưới, video nền vẫn phủ kín phía sau.
- Không tải cả 5 video cùng lúc: chỉ tải clip của cảnh hiện tại, và preload clip cảnh kế tiếp khi trình duyệt rảnh.
- Giữ TypeScript sạch (`tsc --noEmit` không lỗi) và không có cảnh báo React trong console.

### 4. Bảng ánh xạ (điền trước khi gửi; xoá dòng không dùng)
| Cảnh | Tiêu đề | Clip |
|---|---|---|
| 1 | … | dawn |
| … | … | … |
| 9 | Preparing for Điện Biên Phủ: roads, loads and bicycles | road |
| 10 | Điện Biên Phủ, 13/3–7/5/1954 | battle |
| 11 | Geneva Accords, 21/7/1954 | flag |
| 12 | … | flag |

Gợi ý chọn clip: `dawn` khởi đầu/độc lập · `road` hành quân/dân công · `night` du kích/bí mật ·
`battle` trận đánh · `flag` chiến thắng/kết thúc.

### 5. Cách báo cáo khi xong
- Liệt kê file đã tạo/sửa/xoá.
- Cho tôi đoạn diff của component nền và bảng `BG_BY_SCENE`.
- Nói rõ chỗ nào bạn **không chắc** hoặc đã đoán, và lệnh để tôi chạy thử (`npm run dev`).
- Nêu 3 điều tôi nên kiểm bằng mắt: chữ đọc rõ, video lặp không giật, chuyển cảnh không nháy.
