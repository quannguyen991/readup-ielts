# Luyện đọc & nghe tin tức — kế hoạch chi tiết (Band 9)

Lập ngày 17/10/2026. Giai đoạn 1 làm trong phiên này. Các mục đánh dấu **[cần duyệt]** chỉ làm sau khi bạn đồng ý, vì liên quan tới giấy phép, chi phí hoặc lịch tự động.

## 1. Mục tiêu

Một chỗ để người học **đọc, nghe và phát âm tiếng Anh mỗi ngày**: tin tức mới, video, podcast và sách nói. Giao diện dùng đúng bảng màu và thành phần của Band 9 (nền kem, vàng kim, navy), gọn và dễ quét.

## 2. Thực tế về nguồn (đo ngày 17/10/2026)

| Nguồn | Kết quả đo | Hệ quả |
|---|---|---|
| VOA Learning English (trang chính) | Không truy cập được từ môi trường làm việc (tên miền không phân giải) | Không tải được tin mới của VOA |
| Kho âm thanh VOA sẵn có trong repo | 251 bài, ngày mới nhất **20/03/2025** | Không dùng được làm "tin hôm nay" |
| Kênh YouTube VOA Learning English | 30 video, ngày mới nhất **30/04/2025** | Video VOA là lưu trữ, không phải tin mới |
| Wikipedia — Portal:Current events | Truy cập được qua API; có tin cho từng ngày | **Nguồn tin hằng ngày khả thi** (CC BY-SA 4.0) |
| NASA news feed | Truy cập được (phạm vi công cộng) | Dự phòng cho tin khoa học, chưa dùng ở GĐ1 |
| LibriVox API | Truy cập được; có chương MP3 và tên người đọc | Dùng cho sách nói |
| Gutenberg | Truy cập được (văn bản phạm vi công cộng) | Dự kiến cho GĐ3 |

Kết luận: **không cào báo** (luật đã ghi trong `readup-bai-doc-ban-quyen`). Tin hằng ngày lấy từ Wikipedia, phải ghi nguồn và giữ CC BY-SA. Đây là điều **[cần duyệt]** (mục 7).

## 3. Phạm vi các mảng

| Mảng | Nội dung | Nguồn & giấy phép | Trạng thái |
|---|---|---|---|
| **Tin hằng ngày** | Tin theo mục (xung đột, khoa học, kinh tế…), 7 ngày gần nhất, nghe bằng giọng máy | Wikipedia Current events, CC BY-SA 4.0 | GĐ1 |
| **Sách nói** | 8 sách kinh điển, đọc bởi tình nguyện viên, phát theo chương | LibriVox, phạm vi công cộng; ghi tên người đọc | GĐ1 |
| **Video VOA** | 19 video VOA Learning English, nhúng qua trình nhúng chính thức | YouTube (VOA, phạm vi công cộng) | GĐ1 (lưu trữ, ghi ngày thật) |
| **Podcast VOA** | Chương trình âm thanh VOA theo chuyên mục | VOA, phạm vi công cộng | GĐ1 (dữ liệu sẵn có, mở trang nghe có sẵn) |
| **Phát âm** | Nghe giọng máy đọc tin; đọc theo (shadowing) | Giọng máy trên thiết bị; `/shadow` có sẵn | GĐ1 (nghe); GĐ2 (chấm điểm) |
| **Nghe chép & phụ đề dịch** | Dán phụ đề video rồi chép chính tả, dịch phụ đề | Có sẵn: `/sentence/youtube` | GĐ1 (nối vào); GĐ2 (phụ đề tự động) |

## 4. Luật cứng

1. Không cào báo, không chép toàn văn bài có bản quyền.
2. Không tải file video. Video chỉ nhúng qua trình nhúng chính thức.
3. Tin Wikipedia luôn kèm nguồn và giấy phép; không bỏ phần ghi nguồn để gọn giao diện.
4. Không gọi API AI trả phí khi chưa được duyệt ngân sách (xem `feedback-kiem-so-du-truoc-khi-tieu-tien`).
5. Dữ liệu tải về là **seed** trong repo; script làm mới **không ghi đè** nếu tải về quá ít (chống mất dữ liệu khi mạng hỏng hoặc trang đổi cấu trúc).

## 5. Kiến trúc

**Route mới**
- `/luyen-doc` — trang tổng hợp (hero, các dải cuộn ngang).
- `/luyen-doc/tin` — tin theo ngày, lọc theo mục, nút Nghe.
- `/luyen-doc/sach-noi` — danh sách sách nói.
- `/luyen-doc/sach-noi/[id]` — chi tiết sách, danh sách chương, trình phát.

**Route có sẵn được nối vào**
- `/sentence/youtube?v=ID` — xem video, dán phụ đề, chép chính tả, dịch.
- `/sentence/audio` — podcast VOA; `/sentence/listen?a=ID` — nghe bài VOA có lời.
- `/shadow` — đọc theo (phát âm); `/sentence` — nghe & chép; `/bilingual` — song ngữ.

**Dữ liệu và script**
- `src/data/seed/wiki-news/index.json` ← `scripts/ingest-wiki-news.ts` (7 ngày, giữ 14 ngày).
- `src/data/seed/librivox/index.json` ← `scripts/ingest-librivox.mjs`.
- `src/data/seed/voa-video/index.json` ← `scripts/ingest-voa-video.mjs`.
- `src/services/news/wiki-current-events.ts` — đổi wikitext thành tin (có test).
- `src/data/luyen-doc.ts` — nhóm tin theo ngày, định dạng thời lượng, nguồn ghi (có test).

**Điều hướng**: mục "Luyện đọc" nằm đầu nhóm IELTS. Lý do: thanh bên có test giới hạn 7 mục chính; đưa thêm mục cấp một sẽ phá giới hạn đó. Có thể đưa lên cấp một nếu bạn muốn, khi đó sửa test.

## 6. Giao diện (đồng bộ Band 9)

- Hero dùng `LightHero` + `HeroStat`, badge in hoa, tiêu đề hai dòng (Việt/Anh), phụ đề một ý ≤ 60 ký tự.
- Mỗi mục: tiêu đề + "Xem tất cả" + dải cuộn ngang (`HScroll`, có mép mờ).
- Thẻ tin: nhãn mục (màu riêng từng mục), ngày theo giờ Việt Nam, tiêu đề, ý chi tiết, dòng nguồn.
- Thẻ sách: bìa vẽ bằng gradient vàng kim và tên sách (không dùng bìa có bản quyền), tác giả, thời lượng, người đọc.
- Trình độ: A2 xanh ngọc, B1 vàng, B2 navy, C1 cam (mỗi mức một màu, không đổi theo sắc độ).
- Lề 16px trên điện thoại; không cuộn ngang trang.
- Không dùng logo, màu hay tên của app khác.

## 7. Điều cần bạn duyệt **[cần duyệt]**

1. **Giấy phép tin Wikipedia (CC BY-SA 4.0).** Tin được dùng thương mại được, nhưng phải ghi nguồn và chia sẻ bản dẫn xuất theo CC BY-SA. Nếu gói học bán tiền, cần xác nhận cách hiển thị và trách nhiệm này trước khi phát hành.
2. **Lịch làm mới tự động.** Hiện chạy tay bằng `npx tsx scripts/ingest-wiki-news.ts`. Tự động hằng ngày cần một tác vụ định kỳ trên máy có mạng và một lần deploy lại seed. Chưa đặt lịch.
3. **Chi phí phụ đề dịch (GĐ2).** VOA không có mốc thời gian từng câu và chưa có bản dịch. Dịch tự động cần AI trả phí. Trước khi chạy hàng loạt, sẽ ước tính token và xin duyệt ngân sách; dùng model rẻ nhất đủ chất lượng.
4. **Video VOA cũ (2025).** Có giữ mục này khi chưa có video mới, hay chỉ hiển thị khi có dữ liệu mới?

## 8. Kiểm thử và nghiệm thu GĐ1

- Test seed: id đúng dạng, ngày đúng, URL HTTPS, có nguồn và giấy phép; sách có chương MP3 và tổng thời lượng khớp.
- Test logic: parser wikitext (liên kết, mẫu, thẻ tham chiếu, entity), nhóm ngày (Hôm nay / Hôm qua / các ngày trước), định dạng thời lượng.
- `npm run typecheck` không có lỗi mới.
- Trên trình duyệt (máy tính và 375px): mở được các trang; không cuộn ngang; nút Nghe đọc được tin; sách phát được chương MP3 trên web; video nhúng chạy; không có lỗi console mới do tính năng.

## 9. Rủi ro

- **Tin không tự cập nhật** nếu không chạy script hoặc đặt lịch. Hiển thị ngày rõ để người học biết tin cũ hay mới.
- **Trang Wikipedia đổi cấu trúc** làm parser đọc sai. Parser có test; script dừng nếu có quá ít tin.
- **Sách nói chỉ phát trên web** ở GĐ1. Trên điện thoại (native) cần `expo-audio`; kiểm tài liệu Expo SDK 57 trước khi làm (AGENTS.md yêu cầu).
- **Giọng máy** đọc tin không có nhấn âm như người bản xứ. Đây là công cụ nghe thử, không thay thế bản thu thật.
- **Quyền video**: video VOA thuộc phạm vi công cộng; cần xem lại với mọi nguồn khác trước khi bán gói.

## 10. Giai đoạn sau

- **GĐ2**: lịch làm mới tự động (sau duyệt); phụ đề dịch cho tin (sau duyệt ngân sách); chấm phát âm (đọc theo + so khớp); sách nói trên native; nối nghe chép vào sách nói khi có mốc thời gian.
- **GĐ3**: thêm nguồn công cộng (NASA news, Gutenberg có chữ); thống kê tiến độ; thẻ từ từ bài đọc.

## 11. Ghi chú kỹ thuật

- Script làm mới đều chạy được lặp lại (idempotent) và in rõ số mục đã ghi.
- Kho seed đang có: tin 6 ngày (81 tin) · sách 8 · video VOA 19.
- Mọi số liệu trong tài liệu này đo ngày 17/10/2026; chạy lại script sẽ thay đổi.

## 12. Trạng thái sau phiên 17/10/2026

**Đã làm (GĐ1)**
- Tin hằng ngày từ Wikipedia Current events: 7 ngày gần nhất, nghe bằng giọng máy trên thiết bị, ghi nguồn và giấy phép trên từng tin.
- Sách nói: 8 sách LibriVox, có danh sách chương và trình phát trên web.
- Video VOA: 19 video, là lưu trữ đến 30/04/2025; mở bằng trang luyện có sẵn để dán phụ đề và chép.
- Trang `/luyen-doc` (tổng hợp), `/luyen-doc/tin` (tin theo ngày), `/luyen-doc/sach-noi` và `/luyen-doc/sach-noi/[id]`.
- Điều hướng: mục "Luyện đọc" đầu nhóm IELTS; kỹ năng "reading" trong `ielts-focus.ts`.
- Test: 16 test mới (parser wikitext và dữ liệu, nhóm theo ngày, thời lượng). Typecheck: không có lỗi trong file mới.

**Chưa làm (cần duyệt hoặc để GĐ2)**
- Lịch làm mới tự động (mục 7.2).
- Phụ đề dịch tự động và chấm phát âm (mục 7.3).
- Sách nói trên điện thoại (cần expo-audio, kiểm tài liệu SDK 57 trước).
- Nguồn tin công cộng khác (NASA news) và văn bản Gutenberg.
