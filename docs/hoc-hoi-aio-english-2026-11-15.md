# Học hỏi AIO English (aioenglish.com) — 15/11/2026

Nguồn: đọc trang **Yêu cầu tính năng** (74 ý tưởng của người học) và từng màn chức năng của AIO English trong Chrome của người dùng, chỉ đọc, không gửi gì. Ảnh chụp và số đo nằm ở thư mục tạm của phiên (`scratchpad/aio`). Phần "Band 9 hiện có" chỉ ghi điều đã xác minh trong code.

## 1. Họ có gì (đọc từ app)

| Mục | AIO English | Con số |
|---|---|---|
| Học qua gõ câu | Nghe trước gõ sau, chấm từng từ; lộ trình A1–C1 + 12 bộ "tình huống đời sống" + 10 bộ "môi trường công việc" | 1.007 bài |
| Luyện từ vựng | Oxford 3000/5000, 8 chủ đề, IELTS 5 bộ, TOEIC 4 bộ, cụm động từ, cụm cố định học thuật, thành ngữ, Academic Word List, bộ từ tự tạo (có nhập hàng loạt và nhập bằng AI) | 10.929 thẻ |
| Luyện ngữ pháp | Chương theo cấp, mỗi điểm có câu ví dụ và 3 bậc thành thạo | 230 điểm (B2: 42) |
| Đọc & dịch | Dịch từng câu ngẫu nhiên, dịch theo bài, dịch đoạn có chấm điểm, báo song ngữ (Guardian, The Conversation, The Atlantic), dán link, tạo bài bằng AI | 266 bài, 12 chủ đề |
| Luyện phát âm | Bảng IPA, mỗi âm gắn độ khó với người Việt (Dễ/Vừa/Khó), Anh–Anh 50 âm / Anh–Mỹ 46 âm, nhóm "âm cuối" (-t, -k, -s, -(e)s) | 50 âm |
| Dictation & Shadowing | Mỗi video có 4 cách học: chép chính tả, nói theo, trắc nghiệm, phụ đề song ngữ; dán link YouTube | 1.222 video |
| Từ điển chuyên sâu | Tra từ, nghe phát âm, câu ví dụ thật, **so sánh hai từ** | — |
| Lộ trình | Chọn mục tiêu (IELTS Band 7.0), 45 phút mỗi ngày, ước "khoảng 3 tháng tới Band 7.0", mục lục theo chương, bài kiểm tra lên cấp | 167 trạm |
| Trang chủ | Lời chào, điểm danh + chấm 7 ngày, "Hôm nay học gì?", **Kế hoạch hôm nay** có thời lượng từng bài và mục "Còn từ hôm qua" | — |
| Bạn bè | Bảng tin, tìm bạn, kế hoạch và lộ trình chung | — |
| Yêu cầu tính năng | Bình chọn, trạng thái, "Đội ngũ" trả lời công khai | 74 ý tưởng |

## 2. Band 9 hiện có (xác minh trong code)

- **Phát âm**: khoá 44 âm có chấm bằng micro, trò chơi cặp âm tối thiểu, trọng âm (`app/hub/phoneme`, `app/hub/games`). Hơn AIO ở khoản chấm; thiếu nhãn độ khó cho người Việt và mục âm cuối.
- **Ngữ pháp**: A1–C2, có kiểm tra cuối 5 câu (`src/data/grammar`). Trước đợt này 77 bài, **B2 chỉ 14 bài** so với 42 điểm B2 của AIO. Nay 85 bài, B2 có 22.
- **Từ vựng**: Oxford, A1–C1, chủ đề IELTS, sổ cụm từ (collocation + phrasal verbs 10 chủ đề), ôn lặp ngắt quãng, nhập từ từ bài đọc, vườn từ. Chưa thấy: thành ngữ riêng, Academic Word List riêng, nhập hàng loạt có AI.
- **Gõ câu / nghe chép / dịch / shadowing / video / báo song ngữ**: có trong `app/sentence`, `app/shadow`, `app/bilingual`, `app/luyen-doc`.
- **Xếp trình độ đầu vào**: có (`app/ielts/placement.tsx`).
- **Luyện nói AI** (gia sư, nhập vai, gọi điện): có, rộng hơn AIO (AIO chỉ mới "đã lên kế hoạch").
- **Chấm Writing**: có (`app/write`) — ý tưởng 86 phiếu của người dùng AIO.
- **Yêu cầu tính năng**: có (`app/feature-requests.tsx`), đã sửa lỗi máy chủ tối 15/11 (thiếu migration `20261108000100_feature_updates.sql`).
- **Động từ bất quy tắc**: **không có** trước đợt này (27 phiếu bên AIO, trạng thái "đang làm").

## 3. Thiết kế của AIO: số đo và điều học được

Số đo thật từ trang (trang chủ, ngữ pháp, phát âm):

- Nền giấy ấm `#F3F2EB`, thẻ `#FBF7EC` / `#FFFDF8`, nhấn vàng `#FBE08C`, chữ chính `#1D1C27`, chữ phụ `#4B4858`.
- Phông: **Bricolage Grotesque** (tiêu đề, đậm 700–800), **Nunito** (thân, 500), Quicksand cho giao diện, Andika cho phiên âm. Cỡ chữ chính 14,4 px và 16,5 px; nhãn nhỏ 11,5 px.
- Bo góc: thẻ 22 px, thẻ lớn 28 px, nút 16 px, viên thuốc 999 px. Viền dày 2 px, đổ bóng theo màu của mục (token `--sh-tint-*`).
- Mỗi mục một tông riêng: gõ câu xanh chàm (~234°), từ vựng xanh lá (~83°), ngữ pháp hồng cam (~347°), đọc & dịch xanh ngọc (~174°), video cam (~23°), từ điển vàng (~44°), lộ trình tím (~261°), bạn bè xanh dương (~205°).
- Chuyển động: 0,24 s / 0,3 s, đường cong `cubic-bezier(.65,0,.35,1)`; nổi lên 4 px khi rê chuột.

Nguyên tắc học được (không chép tài sản của họ):

1. **Mỗi mục một màu nhận diện**, đồng bộ từ thanh bên, dải tiêu đề, đến thẻ. Người học biết mình đang ở đâu mà không đọc chữ.
2. **Dải tiêu đề cố định cấu trúc**: tên mục có dấu chấm cuối, một chỉ số tiến độ ("0/230 điểm đã nắm"), 2–3 chip giá trị, một nút "Tiếp tục".
3. **Mọi ô chức năng đều có con số** ("1.007 BÀI", "10.929 THẺ") — chứng minh độ dày nội dung ngay từ trang chủ.
4. **Kế hoạch hôm nay** có thời lượng từng bài, mục "Còn từ hôm qua", nhãn "Tiếp theo" — biến lộ trình thành việc làm được trong 45 phút.
5. **Dự báo mục tiêu**: "45 phút mỗi ngày, khoảng 3 tháng tới Band 7.0" — một câu làm người học tin vào lộ trình.
6. **Thang thành thạo từng bài** (3 vạch) và **nhãn độ khó theo người Việt** (Dễ/Vừa/Khó) ở mỗi âm.
7. **Quyền riêng tư và phản hồi công khai**: "Đội ngũ" trả lời từng yêu cầu, trạng thái rõ.

Band 9 đang dùng ngôn ngữ khác (kính mờ, cầu vồng, bóng 3D); không đổi nhận diện. Điều nên lấy là 1–7 ở trên, vẽ bằng màu và phông của Band 9.

## 4. Yêu cầu của người dùng AIO (74): Band 9 đã đáp ứng chưa

| Nhóm | Phiếu nổi bật | Band 9 |
|---|---|---|
| Luyện nói / giao tiếp AI | 284 (nhiều nhất), 7, 0… | Có (hub tutor, roleplay, gọi điện) |
| Chấm Writing bằng AI | 86 | Có |
| TOEIC riêng | 93 | Có `app/toeic`, `app/toefl` |
| Trắc nghiệm sau bài đọc | 27 | Một phần (thi thử Reading; bài báo song ngữ chưa thấy) |
| **Động từ bất quy tắc** | 27 | **Làm xong đợt này** |
| Game từ vựng | 37, 0 | Có (`vocabulary/topic/[slug]/game`) |
| Bài kiểm tra tổng hợp ngữ pháp / qua cấp | 23, 4 | Có kiểm tra cuối từng bài; **chưa có bài tổng hợp theo cấp** |
| Học bộ từ liên quan (đồng nghĩa, collocation) | 9 | Có sổ cụm từ; chưa có "bộ từ liên quan" trên thẻ |
| Phím số chọn đáp án, phím tắt | 6, 2 | **Chưa** |
| Loa cho câu ví dụ trên thẻ | 3 | Có (`ExampleSentence`) |
| Sửa kho ôn ngắt quãng, loại từ quá dễ | 3, 0 | Cần kiểm lại màn ôn lặp |
| Shadowing/dictation cả đoạn dài | 1, 0 | Có shadowing theo bài song ngữ; cả đoạn chưa kiểm |
| Lưu video yêu thích | 0 | Có "Đã lưu" chung (`/bookmarks`) |
| Truyện song ngữ, chủ đề khoa học | 3, 0 | Thiếu nội dung truyện ngắn |
| Widget màn hình khoá | 0 | Không (bản web) |
| Đừng thu phí / donate | 54, 44 | Không áp dụng (Band 9 có gói trả phí) |

## 5. Đã làm trong đợt này

1. **Động từ bất quy tắc** (`/dong-tu-bat-quy-tac`, mục "Động từ bất quy tắc" dưới IELTS): 167 động từ có nghĩa, ghi chú dễ nhầm (lie/lay, rise/raise, get/gotten, read…), tìm kiếm không dấu, lọc 4 kiểu biến đổi, 20 nhóm theo quy luật âm, câu ví dụ có loa cho 65 động từ, đánh dấu "đã thuộc" có lưu, bài kiểm tra nhanh 10 câu ưu tiên chữ chưa thuộc. Dữ liệu có test tự động (kể cả kiểm câu ví dụ có đúng V2/V3).
2. **8 bài ngữ pháp B2 mới** (thứ tự 15–22; B2 từ 14 lên 22 bài, tổng 85): tương lai hoàn thành (+ tiếp diễn), bị động nâng cao (get, make/see/hear, tường thuật), wish/if only/as if/it's time, whereas/while/whatever/no matter, thì khi kể chuyện (used to, would, was going to), suy đoán/needn't have/dare/might as well, mạo từ nói chung + lượng từ + hoà hợp chủ ngữ, mệnh đề quan hệ nâng cao + cụm phân từ. Mỗi bài đủ bước, ví dụ có dịch, lỗi hay mắc và 5 câu kiểm tra; test kiểm cấu trúc và chuỗi tô nổi.
3. **Thành ngữ thông dụng** (`/vocabulary/thanh-ngu`, mục dưới "Luyện từ vựng"): 100 thành ngữ, 10 chủ đề × 10, nghĩa tiếng Việt và câu ví dụ tự viết; tìm không dấu, loa + dịch từng câu, nút "Lưu để ôn" đưa vào sổ từ (ôn lặp ngắt quãng). Đã kiểm trong trình duyệt: lưu được và bộ đếm đổi.
4. **Đọc đuôi -s, -ed** (`/am-cuoi-s-ed`, mục dưới IELTS): quy tắc ba cách đọc cho mỗi đuôi theo âm cuối của từ gốc, 38 từ -ed và 33 từ -s/-es bấm nghe được, bài kiểm tra 10 từ có lời giải thích vì sao. Test tự động kiểm cách đọc ghi tay có khớp quy tắc suy ra từ âm cuối (đã bắt một lỗi dữ liệu ở "lives").
5. **Làm lại trang Luyện phát âm** (`/hub/learn`, 16/11, làm hai lượt theo góp ý "xấu, nhiều chữ"): nền trắng bo tròn bóng mềm thay cho khung viền đậm; dải tiêu đề gradient chỉ còn tên, thanh tiến độ và nút "Luyện tiếp /iː/"; lộ trình thành ba ô Dễ/Vừa/Khó (số âm + thanh tiến độ); lưới IPA 44 thẻ dùng dải màu độ khó thay chip chữ, loa tách riêng, thanh điểm xanh/cam/đỏ; các mục dưới (lỗi người Việt, bài tập, IELTS Speaking) chỉ còn ô tên ngắn, bỏ hết đoạn mô tả. **Phông riêng cho trang**: Nunito (tiêu đề và chữ thường), Andika (ký hiệu IPA); layout hub có thêm lớp `hub-own-font` để trang tự chọn phông thay vì bị ép Nunito. Độ khó 44 âm là đánh giá của Band 9 theo hệ âm tiếng Việt (`src/services/hub/phoneme-levels.ts`, có test phân hoạch); thành phần ở `src/components/hub/PhonemeCourse.tsx`. Cửa sổ "Lỗi người Việt" chấm bằng so khớp chữ máy nghe được (không còn điểm ngẫu nhiên). Đã kiểm trên máy tính và điện thoại.
6. **Sửa trang Yêu cầu tính năng** (migration thiếu trên máy chủ).

**Về việc "thêm dữ liệu từ bên họ sang":** không sao chép nội dung của AIO (câu chữ bài học, ngân hàng câu, bản dịch, danh mục video, bộ từ vựng đã biên tập). Đó là công sức và bản quyền của họ, và lấy hàng loạt qua tài khoản đăng nhập vi phạm điều khoản. Cách làm: xác định khoảng trống, rồi tự viết nội dung riêng cho Band 9; dữ liệu công khai như danh sách động từ bất quy tắc thì tự biên soạn lại lời giải thích, ví dụ và nhóm âm.

## 6. Việc nên làm tiếp (xếp theo giá trị / công sức)

1. **Phím số 1–4 và Enter** cho mọi câu trắc nghiệm (hook dùng chung, chỉ web). Công sức nhỏ, 8 phiếu.
2. **Kế hoạch hôm nay** có thời lượng + "Còn từ hôm qua" + dự báo "X phút mỗi ngày → ~Y tháng tới Band Z" trên trang Lộ trình/Hôm nay. Cần dữ liệu thời lượng từng loại bài.
3. ~~Nhãn độ khó cho 44 âm~~ — đã xong ở mục 5.5.
4. **Màu nhận diện theo mục** (thanh bên + dải tiêu đề) — chạm giao diện chung, cần thống nhất với phiên đang sửa `app/*` trước.
5. **Nội dung từ vựng còn thiếu**: Academic Word List theo sublist (danh sách công khai, tự viết nghĩa và ví dụ), "bộ từ liên quan" (đồng nghĩa/trái nghĩa/collocation) trên thẻ, thêm thành ngữ (hiện 100).
6. **Bài kiểm tra tổng hợp ngữ pháp theo cấp** và **tính năng so sánh hai từ** trong từ điển.
7. **Gõ câu theo tình huống đời sống / công việc** (22 bộ ×~26 bài) — công sức lớn, nên chia đợt.
