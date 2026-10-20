# Bàn giao: Crawl và OCR đề IELTS

**Ngày:** 20/10/2026  
**Phạm vi:** danh mục đề IELTS, OCR nguồn PDF cục bộ, forecast Speaking và nội dung luyện Listening.

## Hiện trạng

- Danh mục công khai có **421 liên kết từ 41 trang nguồn**. Bao gồm các bộ đề IELTS Online Tests, trang mẫu British Council/IDP và trang forecast Speaking. Các mục công khai mở tại trang nguồn; chúng không chứa toàn văn đề.
- Kho riêng `.local-private/ielts-ocr/source-tests.json` có **106 đề kỹ năng cục bộ** đã chia theo phần thi và thêm các mục Cambridge 10–16 chỉ dẫn tới nguồn ngoài. PDF, ảnh trang và audio riêng nằm trong thư mục bị Git ignore.
- OCR của các PDF cục bộ được lưu ở dạng văn bản theo trang, cùng ảnh gốc để giữ sơ đồ, bảng và biểu đồ. Cambridge 20 Reading/Listening có dữ liệu đề riêng; Cambridge 8 và Cambridge 17–21 được chia theo ranh giới nguồn đã nhập.
- Speaking có **8 bộ, 72 mẫu**: 4 nhóm chủ đề forecast Sep–Dec 2026 và 4 bộ dạng cue card phổ biến do ReadUp tự soạn. Mỗi mẫu có câu trả lời tiếng Anh, bản dịch, từ vựng và ghi chú cấu trúc.
- Listening đề gốc có thêm biến thể trình bày dạng ghi chú, bảng, tóm tắt và hoàn thành câu. Các kiểu bài tham khảo theo danh mục British Council/IDP; câu hỏi và transcript ReadUp là nội dung tự soạn.

## Ranh giới nguồn và quyền sử dụng

421 mục crawl hiện là liên kết cùng metadata, không phải bản sao câu hỏi. Không crawl hoặc chép hàng loạt toàn văn đề, bài đọc, transcript và đáp án từ trang bên ngoài vào kho ReadUp. Với nguồn ngoài, tiếp tục lưu liên kết, tên nguồn, kỹ năng và dạng bài; có thể viết tóm tắt ngắn hoặc tạo bài luyện mới bằng nội dung nguyên gốc.

Nếu có PDF người dùng sở hữu hoặc được cấp quyền sử dụng, đặt vào kho riêng `.local-private/ielts-ocr/`, rồi chạy quy trình OCR/import phù hợp. Không đưa PDF hoặc văn bản OCR riêng tư vào Git hay bundle triển khai thông thường.

## Việc đã cập nhật gần đây

- `scripts/ielts/crawl-public-catalog.py` bổ sung metadata cho British Council, IDP và hai nguồn forecast Speaking.
- `src/data/ielts-external-tests.json` được crawl lại: 421 mục, 41 trang nguồn.
- `src/data/speaking-common-practice.ts` thêm 4 bộ Speaking nguyên gốc.
- `src/data/speaking-forecast-current.ts`, `src/data/speaking-forecast.ts` và `app/speaking/index.tsx` đưa 36 mẫu mới vào ngân hàng, tách bộ dạng phổ biến khỏi forecast hiện tại.
- `src/data/listening-tests/original-topics.ts` thay đổi bố cục nhóm câu hỏi giữa các đề để luyện thêm dạng bảng, tóm tắt và hoàn thành câu.
- `docs/IELTS-OCR-LOCAL.md` và `docs/IELTS_BANK_AUDIT_2026-10-20.json` ghi lại danh mục và kiểm kê.

## Các giới hạn dữ liệu đang biết

- Thiếu audio gốc ở 6 đề: Cambridge 20 Listening Tests 3–4 và Cambridge 8 Listening Tests 1–4.
- Chỉ 6 đáp án Cambridge 20 hiện đủ điều kiện chấm tự động. Các key chưa xác minh chỉ để đối chiếu sau khi nộp.
- Cambridge 10–16 và 421 mục crawl công khai vẫn dẫn ra trang nguồn.
- Audio tổng hợp/giọng thiết bị của bài luyện không được gắn nhãn audio đề thi gốc.

## Lệnh tiếp tục

```sh
npm run ielts:crawl-catalog
npm run ielts:rebuild-sources
npm run ielts:audit-sources
```

`ielts:crawl-catalog` cập nhật metadata và liên kết nguồn. `ielts:rebuild-sources` dựng lại ngân hàng từ PDF/tệp đã có trong kho riêng. `ielts:audit-sources` kiểm tra cấu trúc và asset của dữ liệu cục bộ; nó không biến các liên kết ngoài thành bản OCR.

## Kiểm tra gần nhất

- Crawler hoàn tất: 421 liên kết từ 41 trang nguồn.
- TypeScript check hoàn tất không lỗi.
- ESLint trên các tệp liên quan hoàn tất không lỗi; còn cảnh báo unused đã có ở giao diện Speaking.
- `git diff --check` hoàn tất; chỉ có cảnh báo quy đổi LF/CRLF của working tree.
- Không chạy unit test trong lượt cập nhật gần nhất.
- Đã đọc tài liệu Expo v57 theo yêu cầu trong `AGENTS.md` trước khi cập nhật mã.

## Tài liệu liên quan

- `docs/IELTS-OCR-LOCAL.md`
- `docs/IELTS_BANK_AUDIT_2026-10-20.json`
- `scripts/ielts/rebuild-source-bank.py`
- `scripts/ielts/crawl-public-catalog.py`
- `src/services/ielts/source-catalog.ts`
