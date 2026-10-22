# Kế Hoạch Triển Khai & Phản Hồi Kỹ Thuật Dự Án Band 9

> **Cập nhật:** 22/10/2026  
> **Dự án:** Band 9 (9band.com)  
> **Nội dung:** Kế hoạch Reddit Quốc Tế & Phản hồi chi tiết 6 vấn đề kỹ thuật

---

## PHẦN 1: Kế Hoạch Lên Lịch Đăng Bài & Đi Cmt Dạo Reddit Quốc Tế

### 1. Phân bổ cộng đồng & Khung giờ vàng (Theo múi giờ quốc tế):

| Ca | Giờ VN (UTC+7) | Giờ Quốc Tế (US/EU) | Subreddit trọng tâm | Mục tiêu & Dạng nội dung |
| :--- | :--- | :--- | :--- | :--- |
| **Ca 1 (Sáng)** | **07:30 – 09:00** | 20:30 – 22:00 US EST (Tối Mỹ) | **r/Sat**, **r/Anki** | Trả lời thắc mắc đề SAT Math, chia sẻ thuật toán FSRS ghi nhớ từ vựng. |
| **Ca 2 (Trưa)** | **12:30 – 14:00** | 07:30 – 09:00 EU (Sáng châu Âu) | **r/IELTS**, **r/EnglishLearning** | Giải cứu kỹ năng Reading Cam 19, kỹ thuật tra từ 1 chạm và mẹo T/F/NG. |
| **Ca 3 (Chiều)** | **17:00 – 18:30** | 11:00 – 12:30 UK (Trưa Anh) | **r/EnglishLearning**, **r/IELTS** | Giải đáp câu hỏi ngữ pháp, Collocation, bài mẫu Speaking band 7.5+. |
| **Ca 4 (Tối)** | **21:30 – 23:00** | 10:30 – 12:00 US EST (Sáng Mỹ) | **r/Sat**, **r/IELTS** | Chia sẻ mẹo bấm máy đồ thị Desmos SAT Math và phòng luyện nói AI Aoede. |

### 2. Kịch bản cmt dạo tự nhiên (Tỷ lệ 80/20 - Giá trị / Giới thiệu):
- **Nguyên tắc Reddit:** Không quăng link trần (tránh bị bot AutoModerator xóa/shadowban).
- **Cấu trúc cmt chuẩn:**
  1. *Đồng cảm & Giải đáp trực tiếp:* Trả lời đúng trọng tâm câu hỏi của chủ thớt (giải thích từ vựng, công thức Desmos hoặc cách định vị dẫn chứng Reading).
  2. *Gợi ý tự nhiên:* Nhắc đến một tính năng miễn phí hữu ích trên `9band.com` như một người học chia sẻ kinh nghiệm ("Mình từng bị kẹt 5.5 Reading như bạn cho đến khi cày bộ công cụ tra từ 1 chạm trên web này...").

---

## PHẦN 2: Tin Nhắn Mẫu Phản Hồi Gửi Đối Tác / Lead

```text
Em chào anh, em đã kiểm tra toàn bộ các điểm anh vừa rà soát trên 9band.com và xử lý xong các yêu cầu mới. Em xin phản hồi chi tiết:

1. Về bản code trên web (File cũ 46.8MB):
• Toàn bộ tính năng mới (lưu UTM First-Touch, 4 sự kiện đo lường, trang /ig độc lập, ẩn nút Google trên Instagram, fix Desmos) đã được hoàn thiện trên nhánh mã nguồn tại máy phát triển.
• Lý do trên 9band.com vẫn đang là bản cũ vì code mới chưa được đẩy lên Vercel Production. Bên em đã sẵn sàng bộ build mới, anh muốn em push lên nhánh chính để Vercel tự deploy lên 9band.com hay gửi link bản xem trước (Vercel Preview) để anh kiểm tra trước ạ?

2. Về việc đăng nhập (/write, /write/tests, /speaking/room):
• Hiện tại các trang này đang được bảo vệ bởi MemberGate để hạn chế tải AI.
• Bên em đã chuẩn bị sẵn cấu hình mở tự do: chỉ cần gỡ tiền tố khỏi danh sách chặn là khách vào thẳng giao diện làm bài mà không bị popup đăng nhập. Riêng hạn chót 26/10 cho /write bên em đã chuẩn bị xong, khi anh chốt danh sách mở phần nào em sẽ kích hoạt ngay trong 30 giây.

3. Về Link sâu vào thẳng bài học (02/11 và 07/12):
Em đã chuyển link trỏ trực tiếp vào đúng bài học chuyên sâu theo đúng yêu cầu:
• Tuần 02/11 (True/False/Not Given): https://9band.com/ielts/skills/reading-tfng
  (Vào thẳng phòng luyện dạng TFNG với 20 câu drill và phân tích chiến thuật, không qua trang tổng).
• Tuần 07/12 (Vào thẳng 4 chủ đề từ vựng lớn):
  - Môi trường: https://9band.com/vocabulary/topic/oxford-nature-environment
  - Công nghệ: https://9band.com/vocabulary/topic/oxford-science-technology
  - Giáo dục: https://9band.com/vocabulary/topic/oxford-education
  - Sức khỏe: https://9band.com/vocabulary/topic/oxford-body-health

4. Về /sat/desmos thiếu API Key:
• Em đã cấu hình lại: Nhúng trực tiếp bản Desmos Graphing Calculator chính thức qua giao diện Iframe của Desmos.
• Kết quả: Ẩn hoàn toàn thông báo thiếu EXPO_PUBLIC_DESMOS_API_KEY, người xem vào trang là thấy ngay máy tính đồ thị trực quan, vẽ hàm và bấm máy mượt mà.

5. Bỏ qua màn chào 5 bước khi vào bằng link sâu:
• Em đã thêm cơ chế: Bất kỳ khi nào khách truy cập qua link sâu (khác trang chủ / và /gioi-thieu), hệ thống tự động ghi nhận cờ đã xem vào trình duyệt (readup:welcome-seen = 1).
• Khách sẽ vào thẳng bài học mong muốn và không bao giờ bị chuyển hướng sang màn chào 5 bước nữa.

6. Bổ sung 4 sự kiện đo lường:
• Đã cập nhật vào hệ thống đo lường (Meta Pixel + Google Analytics 4):
  - start_lesson (Bắt đầu bài)
  - complete_lesson (Làm xong bài)
  - sign_up (Đăng ký tài khoản - kèm UTM gốc)
  - upgrade (Nâng cấp gói)
• UTM First-Touch được tự động lưu vào bảng page_views ngay khi khách vào trang lần đầu.

Anh xem qua và báo em để em đẩy bản mới lên web nhé!
```

---

## PHẦN 3: Bảng Cập Nhật 8 Link Sâu Mới Nhất

| Ngày đăng | Chủ đề | URL Đích Mới (Vào Thẳng Bài) | Trạng thái kỹ thuật |
| :--- | :--- | :--- | :--- |
| **26/10** | Writing 4 tiêu chí | `https://9band.com/write` | Sẵn sàng mở gate cho khách trước 26/10 |
| **02/11** | Reading True/False/Not Given | `https://9band.com/ielts/skills/reading-tfng` | Vào thẳng bài luyện 20 câu TFNG |
| **09/11** | SAT tổng quan | `https://9band.com/sat` | Hub lộ trình Digital SAT |
| **16/11** | Speaking AI Aoede | `https://9band.com/speaking/room` | Phòng luyện nói tương tác AI |
| **23/11** | Listening điền đáp án | `https://9band.com/sentence/dictation` | Luyện nghe chép chính tả điền từ |
| **30/11** | Writing Task 1 | `https://9band.com/write/tests` | Đề thi biểu đồ và dàn bài Task 1 |
| **07/12** | 4 Chủ đề từ vựng Oxford | - `https://9band.com/vocabulary/topic/oxford-nature-environment`<br>- `https://9band.com/vocabulary/topic/oxford-science-technology`<br>- `https://9band.com/vocabulary/topic/oxford-education`<br>- `https://9band.com/vocabulary/topic/oxford-body-health` | Vào thẳng 4 deck từ vựng FSRS lớn |
| **14/12** | SAT Math Desmos | `https://9band.com/sat/desmos` | Đã ẩn cảnh báo API Key, nhúng máy tính trực tiếp |
