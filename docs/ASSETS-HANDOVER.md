# Bàn giao asset (icon, mascot, huy hiệu, hoạt họa) — Band 9 Hub

Tài liệu cho phiên sau. Đọc cùng [HANDOVER-2026-10-17.md](HANDOVER-2026-10-17.md).

## 1. Phong cách chuẩn (bắt buộc giữ)

- **2D phẳng kiểu Duolingo / sticker**: viền đen đậm, màu bão hoà phẳng, hình khối đơn giản, một điểm sáng trắng nhỏ. Không 3D, không gradient trên thân, không bóng đổ.
- **Nhân vật Leo** (linh vật): sư tử con trắng kem, bờm vàng xù, viền đen, má hồng, ngôi sao vàng trên bụng, đuôi có chùm vàng.
- **Huy hiệu**: lục giác bo góc, nền màu phẳng tươi, viền đen đậm, biểu tượng ở giữa, không chữ.
- **Icon UI**: ô vuông bo góc, nền màu phẳng, biểu tượng trắng-vàng viền đen, không chữ.

Ảnh tham chiếu (đính kèm khi vẽ thêm để giữ phong cách):
- `Downloads/leo-mascot-sheet-2d.png` — lưới 6 tư thế Leo chuẩn.
- `Downloads/leo-badges-batch2.png` — lưới 9 huy hiệu 2D.

## 2. Đã có trong dự án

### Mascot Leo — `public/mascot/lion2d/` (12 file, PNG trong suốt)
| File | Biểu cảm / dùng cho |
|---|---|
| leo-wave.png | vẫy tay (chào, mặc định) |
| leo-cheer.png | cổ vũ, giơ tay |
| leo-think.png | suy nghĩ |
| leo-read.png | đọc sách (bài học) |
| leo-point.png | chỉ tay (gợi ý) |
| leo-sleep.png | ngủ (chưa có chuỗi) |
| leo-celebrate.png | ăn mừng (mở huy hiệu, cấp cao) |
| leo-sad.png | buồn (trượt bài, mất chuỗi) |
| leo-focus.png | tập trung viết (đang làm bài) |
| leo-streak.png | cầm lửa (đang giữ chuỗi) |
| leo-correct.png | giơ ngón cái (làm đúng) |
| leo-surprised.png | ngạc nhiên |

### Huy hiệu — `public/badges/` (21 file)
badge-first-lesson, badge-lessons-5, badge-lessons-12, badge-grammar, badge-streak-7, badge-streak-14, badge-streak-30, badge-streak-60, badge-streak-100, badge-scenarios-3, badge-speaking-10, badge-scenarios-25, badge-scenarios-50, badge-tasks-25, badge-tasks-100, badge-tasks-250, badge-perfect, badge-sounds-10, badge-sounds-30, badge-level-5, badge-level-10.

Tên file khớp với `art` trong [src/services/hub/achievements.ts](../src/services/hub/achievements.ts). Đổi tên là phải đổi ở đó.

### Ảnh bối cảnh tình huống — `public/hub/scenes/` (19 file JPG, ChatGPT)
airport, restaurant, cafe, grocery, market, clothing, office, clinic, hotel, bank, classroom, kitchen, street, station, taxi, phone, home, delivery, service. Map key trong [src/data/hub/scenes.ts](../src/data/hub/scenes.ts).

## 3. Đã bổ sung sau đó

- **Bộ 9 icon công cụ** — `public/icons/tools/` (tool-voice, tool-pitch, tool-video, tool-shadow, tool-scenarios, tool-topics, tool-tutor, tool-meeting, tool-roadmap). Ảnh gốc: `Downloads/Colorful Cartoon App Icon Grid.png`. Đã cắt bằng `--drop-edge-specks`.
- Chrome đã cho tải lại (sau khi người dùng cho phép). Nếu lần sau bị chặn lại, kiểm tra quyền tải của chatgpt.com trong Chrome.

## 4. Quy trình tạo asset (đã chạy được)

1. Mở chat ChatGPT ở chế độ **Trò chuyện** (chế độ Công việc làm treo trình duyệt khi gõ).
2. Đính kèm ảnh tham chiếu (tuỳ chọn; có lúc làm treo tab, khi đó chỉ dùng mô tả bằng chữ).
3. Prompt có: phong cách (mục 1), số ô và cách xếp lưới, nền **magenta #FF00FF đặc**, không chữ, không bóng trên nền, mỗi hình nằm gọn trong ô.
4. Tải ảnh về `Downloads/`.
5. Cắt thành PNG trong suốt:
   ```
   python scripts/art/chroma_sheet.py "<đường dẫn lưới>" <thư mục đích> <tiền tố> <số cột> <số hàng> "tên1,tên2,..."
   ```
   Script xoá magenta nối với mép, xoá magenta kín bên trong, xoá viền tím sát vùng trong suốt, cắt từng ô, thu về cạnh dài 512px. Thêm `--drop-edge-specks` khi làm icon (xoá mảnh lọt từ ô bên cạnh). Không dùng cờ này cho mascot (có thể mất chữ Z của biểu cảm ngủ). Nằm ở [scripts/art/chroma_sheet.py](../scripts/art/chroma_sheet.py).
6. Mở từng file kiểm tra (không còn viền magenta, không thiếu hình).

## 5. Việc tiếp theo cho phiên sau (theo thứ tự ưu tiên)

1. Gắn 9 icon công cụ (`public/icons/tools/`) vào thẻ công cụ AI của màn Hub (đang dùng icon Lucide, cần thay).
2. **Hoạt hoạ streak** (khung chuyển động, 4 khung mỗi bộ, 3 tầng lửa: cam / đỏ / xanh): lưới 2x2 mỗi tầng. Đặt `public/anim/flame-<tầng>-<n>.png`.
3. **Hoạt hoạ hoàn thành** (vòng tick nổ, 4 khung): `public/anim/check-burst-<n>.png`.
4. **Pháo giấy / pháo hoa** dạng sprite (4 khung): `public/anim/confetti-<n>.png`.
5. **Biểu cảm Leo thêm**: chạy, nhảy, nhảy múa, ăn, ôm, đang ngủ có "zzz" nhiều hơn. Lưới 3x2, cắt vào `public/mascot/lion2d/`.
6. **Icon chung** (đá quý, sao, ổ khoá, micro, sách, loa, lịch, cúp, mục tiêu, lửa nhỏ): lưới 3x3 → `public/icons/ui/`.
7. Sau khi có file, nối vào app: mascot theo trạng thái (đã có hàm chọn trong `app/hub/index.tsx` bản thử), huy hiệu đã nối.

## 6. Trạng thái code liên quan

- Hiệu ứng đã viết (chưa thấy trực tiếp trên màn hình vì chưa tạo được tình huống mở khoá thật): [src/components/hub/effects.tsx](../src/components/hub/effects.tsx) (pháo giấy, pháo hoa, tia sáng xoay, quầng sáng, nhịp đập, lửa nhấp nháy, nảy khi hoàn thành).
- Âm thanh tổng hợp bằng Web Audio, không dùng file: [src/services/hub/sfx.ts](../src/services/hub/sfx.ts). Có nút bật/tắt.
- Thông báo khi làm xong việc học và khi tăng chuỗi: [src/components/hub/RewardWatcher.tsx](../src/components/hub/RewardWatcher.tsx), gắn ở layout Hub.
- Màn Hôm nay đang là bản cũ (theo yêu cầu). Các hiệu ứng và huy hiệu không hiện trên màn này nữa, chỉ hiện khi mở khoá.
