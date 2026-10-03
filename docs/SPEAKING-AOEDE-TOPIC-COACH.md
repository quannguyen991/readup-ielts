# Speaking: luyện theo chủ đề với Aoede

Ngày cập nhật: 03/10/2026.

## Luồng đã chỉnh

- Mặc định Part 1, chủ đề Weather / Thời tiết, luyện 2 câu. Có thể chọn 1 câu, chọn chủ đề khác hoặc bốc chủ đề.
- Aoede đọc câu hỏi. Chỉ mở lượt trả lời sau khi âm thanh kết thúc; nghe lại trong lúc đang hỏi cũng giữ đúng nhịp này.
- Sau câu đầu có thể phân tích ngay hoặc chủ động sang câu thứ hai. Câu cuối tự chuyển tới kết quả; không tiếp tục hỏi hết Part 1.
- Mỗi câu có bài mẫu, phân tích AI bằng tiếng Việt, trích lỗi cụ thể và gợi ý sửa. Có thể nghe bài mẫu bằng Aoede.
- Nói lại đúng câu đã được góp ý; kết quả hiển thị câu trả lời trước và sau. Có thể luyện tiếp 1–2 câu trong cùng chủ đề.
- Full test / thi thật vẫn là lựa chọn riêng. Gõ phím không được gán band Speaking.

## Âm thanh

48 câu hỏi Part 1 có MP3 Aoede được tạo sẵn trong `public/audio/speaking/aoede/`. Mỗi clip được đối chiếu toàn bộ câu bằng ASR và kiểm tra thời lượng, tín hiệu sau mã hóa.

Câu hỏi chưa có clip và bài mẫu dùng `/api/speaking/voice`, giọng Aoede với `gemini-2.5-flash-preview-tts`. Khóa ở biến môi trường server `GEMINI_TTS_API_KEYS` (các khóa phân cách bằng dấu phẩy), không đưa vào client. Bài mẫu yêu cầu đăng nhập. Có cache, gộp yêu cầu đồng thời, giới hạn tốc độ, timeout và kiểm tra PCM tránh phát clip gần như im lặng. Khi lỗi không tự đổi sang giọng khác; có thông báo và lựa chọn đọc câu hỏi để trả lời.

## Kiểm tra

- Toàn bộ bộ kiểm thử: 4.759 kiểm thử đạt trước chỉnh nhỏ cuối về nghe lại; 37/37 kiểm thử Speaking và TypeScript đều đạt sau chỉnh cuối.
- AI thực tế tạo đủ hai bài mẫu cho hai câu Weather, phân tích và trích đúng lỗi ngữ pháp từ bài trả lời. Tạo Aoede thực tế cho bài mẫu thành công.
- Chrome local: Aoede có sự kiện playing/ended, không mute; ô trả lời mở sau ended. Câu 1 dừng chờ thao tác; câu 2 tự mở trang phân tích với đúng hai câu. Nói lại mở đúng câu đã chọn.
- Kiểm tra giao diện dùng nhập văn bản mẫu, không giả lập một bài nói qua micro. Nhận giọng nói vẫn dùng cơ chế Chrome hiện có; AI phân tích bản chữ, không trực tiếp nghe bản ghi âm.

Các bằng chứng kiểm thử và AI thực tế được giữ tại `D:/Claude/readup-ielts/tmp-art/` (không đưa dữ liệu/quyền truy cập vào Git).

## Triển khai

- Commit mã nguồn: 88e23e, nhánh codex/speaking-topic-coach.
- Vercel READY: https://readup-ielts-1bup2s7qy-siu6.vercel.app
- Website: https://band9-ielts.vercel.app/speaking
- Đã tải kiểm tra cả 48 clip trên production: SHA-256 khớp bản local. API giọng trả WAV Aoede; bài mẫu không đăng nhập trả 401.
- Chrome production: hai câu Weather kết thúc đúng lượt, AI trả đủ hai bài mẫu và phân tích riêng; nút luyện lại mở đúng câu đã chọn.


## Lỗi tương phản đã phát hiện trên production

- Trang Speaking bị bộ đổi màu của chủ đề Từ vựng ghi đè màu chữ trên thẻ trắng. StudyFrame hỗ trợ chủ đề hiển thị cục bộ; riêng kết quả Speaking đặt nền theme Mặc định để chữ luôn dễ đọc.
- Lời nhắc AI yêu cầu khớp giải thích với ngữ pháp và nội dung thực có trong bài mẫu, cho phép bỏ qua sửa lỗi khi câu đã đúng, tránh giải thích mâu thuẫn, và kết thúc bằng việc cụ thể cần luyện lại. Không gợi ý bịa trải nghiệm cá nhân.
- AI chạy thật (openai/gpt-oss-120b) trả đủ bài mẫu và phân tích riêng cho cả hai câu Weather; TTS tạo file Aoede cho bài mẫu.
- Hai chỉnh sửa này cần cập nhật production lần nữa sau ảnh kiểm tra trực tiếp.
