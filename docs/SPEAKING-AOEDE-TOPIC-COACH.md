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

- Toàn bộ bộ kiểm thử: 4.759 kiểm thử đạt trước chỉnh nhỏ cuối về nghe lại; bộ kiểm thử Speaking và TypeScript được chạy lại sau chỉnh cuối.
- AI thực tế tạo đủ hai bài mẫu cho hai câu Weather, phân tích và trích đúng lỗi ngữ pháp từ bài trả lời. Tạo Aoede thực tế cho bài mẫu thành công.
- Chrome local: Aoede có sự kiện playing/ended, không mute; ô trả lời mở sau ended. Câu 1 dừng chờ thao tác; câu 2 tự mở trang phân tích với đúng hai câu. Nói lại mở đúng câu đã chọn.
- Kiểm tra giao diện dùng nhập văn bản mẫu, không giả lập một bài nói qua micro. Nhận giọng nói vẫn dùng cơ chế Chrome hiện có; AI phân tích bản chữ, không trực tiếp nghe bản ghi âm.

Các bằng chứng kiểm thử và AI thực tế được giữ tại `D:/Claude/readup-ielts/tmp-art/` (không đưa dữ liệu/quyền truy cập vào Git).
