# ReadUp: tóm tắt dự án (để brainstorm)

> Cập nhật 24/09/2026. Mọi con số dưới đây đếm từ mã nguồn và dữ liệu thật của app, không ước lượng.

## 1. ReadUp là gì

- App web luyện **IELTS và SAT** cho học sinh Việt Nam: https://readup-ielts.vercel.app
- Làm bằng Expo (React Native + web), dữ liệu tài khoản trên Supabase, deploy trên Vercel. Chạy được trên web, sau này có thể ra iOS/Android từ cùng mã nguồn.
- Người làm là một học sinh THPT đang tự ôn IELTS và SAT để du học (dự kiến thi SAT 11/2027), nên cũng chính là người dùng mục tiêu.
- Bắt đầu 09/08/2026. Đến nay có 226 commit, 92 màn hình, 29 API, khoảng 2.400 test tự động.

## 2. Hiện trạng người dùng (quan trọng, nói thẳng)

- **Chỉ có 2 tài khoản đăng ký, cả hai của người làm.** Chưa có người dùng thật.
- Chưa đo được lượt truy cập: đã có sẵn mã Google Analytics và Vercel Analytics nhưng chưa bật.
- Người dùng khách (không đăng nhập) học được mọi thứ, dữ liệu lưu trên máy; đăng nhập thì đồng bộ nhiều máy.
- Nghĩa là **nút thắt hiện nay là có người dùng**, không phải thiếu tính năng.

## 3. Người dùng mục tiêu

- Học sinh lớp 10–12 ở Việt Nam muốn du học, thường cần **cả IELTS (hoặc tương đương) lẫn SAT**.
- Phụ huynh là người trả tiền; giáo viên/trung tâm là kênh có thể đưa cả lớp vào dùng.

## 4. App đang có gì

### IELTS
- **Reading**: luyện theo dạng câu hỏi, thi thử Reading tính giờ, kho bài đọc, xem lại phiên làm bài.
- **Đọc báo song ngữ**: 125 bài Anh–Việt đặt cạnh nhau, rê chuột vào từ để xem nghĩa, câu hỏi hiểu bài, danh sách từ vựng.
- **Writing**: đề Task 1 và Task 2, chấm bằng AI theo band (có giới hạn lượt theo gói), bài mẫu, luyện dịch 5 bậc (câu Việt → Anh, phải khớp câu mẫu).
- **Nghe & chép**: 50 bộ chép chính tả theo chủ đề, chép theo video YouTube, đọc theo bài VOA (251 bài công khai, máy nghe giọng và tô từng từ đọc đúng/hụt).

### SAT
- **SAT Math**: 19 bài lý thuyết, luyện từng dạng, bài chẩn đoán, thi thử tính giờ, từ vựng đề Toán.
- **SAT Verbal (Reading & Writing)**: 12 bài lý thuyết, luyện theo kỹ năng, đề trộn.
- **Thi thử SAT đầy đủ**: 98 câu đúng cấu trúc đề số hoá (Digital SAT) có chia module.

### Từ vựng
- 50 chủ đề IELTS × 50 từ (2.500 từ, có phiên âm, nghĩa Việt, ví dụ, từ đồng nghĩa), 23 bài từ vựng SAT (185 từ), sổ từ cá nhân, bộ từ tự tạo từ bài báo bất kỳ.
- Vào một bộ từ có 6 cách luyện: **Học xen kẽ** (lật thẻ, trắc nghiệm, điền chỗ trống kiểu đề THPT, gõ từ — trộn lẫn, từ sai gặp lại sau 2 câu bằng dạng dễ hơn, từ đúng vẫn gặp lại với khoảng cách giãn dần), Nghe chép, Điền vào câu, Phát âm (máy nghe và chấm), Kiểm tra 20 câu, trò chơi Bóng bay.
- Ôn tập dài hạn bằng thuật toán FSRS; "Vườn từ" 3D, mỗi từ là một cái cây héo dần nếu lâu không ôn.
- Bôi đen bất kỳ chữ tiếng Anh nào trong app là tra được, lưu thẳng vào sổ từ.

### Theo dõi tiến độ
- **Hồ sơ lỗi**: gom các lỗi đã gọi tên (sai chính tả, nhầm sang từ khác, sai dạng câu…) và chỉ bài để sửa.
- **Sổ bằng chứng**: mỗi kỹ năng có bằng chứng từ các bài đã làm.
- **Dự đoán điểm SAT có khoảng dao động** (ví dụ 1380–1450), kèm số câu cần làm thêm để khoảng này hẹp lại.
- **Lộ trình 60 tuần** IELTS + SAT.
- **Báo cáo cho phụ huynh**: một đường link chỉ xem, gửi qua Zalo, không cần tài khoản.
- **Trang cho giáo viên**.
- **Chất lượng đề AI**: trang công khai đo chính đề do AI sinh — 30,3% câu hỏi AI trả lời đúng được mà không cần đọc bài, những câu đó bị loại.

### Game và cạnh tranh
- **Game khi học**: mỗi câu đúng là một nhát chém vào quái (XP, combo, chí mạng, tim, boss, túi đồ, trợ lý "Hỏi Cú" gợi ý, nhiệm vụ ngày, huy hiệu, âm thanh). Có ở mọi màn luyện trừ Writing/Reading dài.
- **Sao**: kiếm bằng thời gian học, số câu (trần 60/ngày) và thành tích trong game. Đổi ở trang **Đổi quà**: vé dùng gói Plus/Pro 7 ngày, linh vật có kỹ năng hỗ trợ, trang phục nhân vật, avatar động, bìa hồ sơ động, vật phẩm.
- **Xếp hạng**: bảng vàng hằng ngày (sao, câu đúng, lượt ôn từ), bảng tháng có thưởng sao cho top 10, **Đề của tuần** cả nước cùng làm một đề, **Đấu 1–1** với bạn.
- **Bản đồ ReadUp**: thế giới pixel 6 đảo, mỗi nhiệm vụ là một bài học thật.
- **Mời bạn, học miễn phí**.

## 5. Nguyên tắc sản phẩm đã chốt

- **Đáp án tính bằng code, không để AI đoán.** Câu hỏi sinh từ luật và dữ liệu, có bước tự kiểm; AI chỉ dùng cho chấm Writing, trợ giảng, giải thích.
- **Không sao chép toàn văn báo có bản quyền**; bài đọc tự viết hoặc nguồn công khai.
- **Không tính điểm cho câu tự chấm** (lật thẻ, tự nói "đã biết"), để không ai bấm bừa lấy điểm.
- **Nói thật với người học**: dự đoán điểm là khoảng, không phải một con số; công khai cả chất lượng đề của chính mình.
- Thiết kế riêng, không giống IELTS Dictionary hay các app khác.

## 6. Mô hình kinh doanh hiện tại

| Gói | Giá/tháng | Giá/năm | Khác biệt chính |
|---|---|---|---|
| Free | 0 | 0 | 5 bài đọc/ngày, 1 đề thi thử/tuần, 100 từ, 3 lượt AI/tháng |
| Plus | 49.000đ | 470.000đ | Mở hết nội dung, 20 lượt AI/tháng |
| Pro | 140.000đ | 1.260.000đ | Thêm trợ giảng AI, bài mẫu, 120 lượt AI/tháng |
| Max | 400.000đ | 3.360.000đ | Như Pro, 720 lượt AI/tháng |

- Có mua theo nhóm (càng đông càng rẻ), dùng thử, và đổi sao lấy vé dùng gói.
- Chi phí vận hành thấp: đề sinh bằng code, không trả lương giáo viên; tốn tiền chủ yếu ở lượt gọi AI.

## 7. Đối thủ (nhìn từ phía người học Việt Nam)

- **Prep, ELSA**: mạnh AI chấm Speaking/Writing, thương hiệu lớn.
- **Study4, Zim**: kho đề IELTS miễn phí lớn, cộng đồng đông.
- **Duolingo**: vua giữ chân người dùng (chuỗi ngày, giải đấu).
- **Bluebook (College Board), Khan Academy**: đề SAT chính chủ, miễn phí.
- **Magoosh, UWorld**: luyện SAT/IELTS có phân tích lỗi, luyện theo điểm yếu.
- Trung tâm luyện thi offline: thu tiền theo khoá, quảng cáo học viên điểm cao.

## 8. Những hướng khác biệt đã đề xuất và vì sao chưa đủ

Người làm đã **gạt** các hướng sau vì "app nào cũng có":

1. Đáp án tính bằng code, có lời giải → người học coi đó là mặc định.
2. Gọi tên lỗi, luyện đúng kiểu lỗi, không học vẹt được vì đề sinh mới liên tục → Magoosh, UWorld, Prep đã có dạng tương tự.
3. Lộ trình du học gắn với trường mục tiêu và dự đoán ngày đạt điểm → lộ trình và dự đoán điểm app nào cũng có.

Hai hướng đưa ra cuối cùng, **chưa được thảo luận**:

- **Chỉ trả tiền khi điểm tăng thật** (học miễn phí, thi đầu vào/đầu ra bằng đề chuẩn, tăng từ 0,5 band mới trả). Đối thủ lớn khó làm vì họ thu tiền trước theo khoá.
- **Công khai con số thật**: trung bình học viên tăng bao nhiêu, kể cả người không tăng. Trung tâm khác chỉ khoe người điểm cao.

Ý tưởng khác từng nêu: gắn nhãn lỗi theo kiểu người Việt hay mắc (quên -s, quên mạo từ, dịch từng chữ); học theo nhóm 4–6 bạn quen nhau có phụ huynh cùng xem.

## 9. Câu hỏi cần brainstorm

1. Trong thị trường IELTS/SAT ở Việt Nam đang cạnh tranh gay gắt, ReadUp nên khác biệt ở **điều gì mà đối thủ không thể hoặc không muốn chép**? (Không phải thêm một tính năng nữa.)
2. Nên chọn **nhóm người dùng hẹp** nào để thắng trước?
3. Làm sao có **100 người dùng thật đầu tiên** khi chưa có ngân sách quảng cáo?
4. Mô hình thu tiền nào hợp với học sinh Việt Nam (và phụ huynh) mà vẫn bền?
5. Thứ nào trong app hiện tại nên **bỏ bớt** để tập trung?

Ràng buộc: người làm là học sinh, làm một mình cùng AI, thời gian hạn chế trong năm học; chi phí AI phải thấp; không dùng nội dung có bản quyền.
