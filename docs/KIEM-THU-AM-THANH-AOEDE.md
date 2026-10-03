# Phát âm từ vựng — Aoede, 03/10/2026

Người dùng chọn Aoede sau khi nghe mẫu và cho phép triển khai lên `band9-ielts.vercel.app`.

## Nguyên nhân và bản sửa

Bộ cắt MP3 cũ dùng `afade=t=out:d=0.04` mà không đặt thời điểm bắt đầu. FFmpeg làm toàn bộ phần tiếng sau 40 ms gần như im lặng, dù trình duyệt vẫn tải và phát clip thành công. Ví dụ `pollution` cũ có mức tín hiệu sau 80 ms gần -200 dB.

`word_audio.py` thực hiện fade-in trên đoạn đảo ngược, rồi đảo lại để fade-out đúng cuối từ. Đã khôi phục 1.948 clip Kore bằng cách đối chiếu hash với bản cắt cũ từ WAV gốc, không suy đoán nhãn từ.

Giọng mặc định và mô hình tạo clip dùng chung `src/data/pronunciation-voice.json`: Aoede / `gemini-2.5-flash-preview-tts`. Không phụ thuộc công tắc hiệu ứng game. Khi thiếu clip hoặc mạng lỗi, tạm dùng giọng máy tiếng Anh.

Đã sửa hủy lượt phát cũ, chỉ giữ lần thử lại autoplay mới nhất, hủy khi rời thẻ hoặc tắt tự phát âm, dọn timer khi phát và giới hạn thời gian tải index. Kho từ được tra trước kho câu để thẻ có clip không phải chờ index câu.

## Kiểm thử trước triển khai

- Bản làm việc riêng, chỉ chứa thay đổi phát âm: 4.752/4.752 kiểm thử JavaScript đạt; TypeScript kiểm tra không lỗi.
- Sáu kiểm thử Python đạt, gồm tái hiện lỗi fade-out và tránh gán nhãn sai khi lời nói thiếu từ.
- 2.061 clip Aoede được giải mã và kiểm tra toàn bộ: không clip nào thiếu tiếng sau 80 ms hoặc vượt giới hạn độ dài; mức tín hiệu thấp nhất sau 80 ms là -30,75 dB (ngưỡng loại -50 dB).
- Chrome, tab hiển thị: 10 lượt Anh→Việt và 10 lượt Việt→Anh, lặp với hiệu ứng game bật/tắt. Mỗi trường hợp có đủ sự kiện `playing` và `ended`, URL Aoede, `muted=false`, âm lượng 1; không có lỗi phát. Anh→Việt khi bật hiệu ứng có thêm một lần phát do cập nhật mã trong dev server. Đây là 10 lần xuất hiện, lặp hai từ `pollution` và `emission`, không phải 10 từ khác nhau.
- Đã kiểm tra phát Aoede khi đáp án điền chỗ trống lộ ra.
- Bằng chứng trên là sự kiện trình duyệt và tín hiệu MP3, không phải xác nhận nghe qua loa vật lý. Người dùng đã tự nghe và chọn mẫu Aoede.

## Phạm vi và phần còn lại

Kho từ vựng có 2.064 mục chuẩn hóa; Aoede có 2.061 mục (99,85%). Ba mục `ultra vires`, `pidgin`, `haute couture` chưa qua đối chiếu lời nói chính xác nên chưa đưa vào index; các mục này vẫn đọc bằng giọng máy dự phòng. Không bỏ nhánh dự phòng cho đến khi các clip còn lại và kho câu đầy đủ.

Các WAV, nhãn, bản nhận dạng, báo cáo tín hiệu và log kiểm thử nằm trong `tmp-art/` (không đưa lên website). Chỉ đưa MP3 có trong index lên Vercel. Có thể thêm `?audioDebug=1` vào URL học để thu sự kiện phát trong console; bình thường không ghi log này.

Triển khai từ worktree sạch để tránh đưa thay đổi lịch sử/du ngoạn của các phiên khác vào bản phát âm.
