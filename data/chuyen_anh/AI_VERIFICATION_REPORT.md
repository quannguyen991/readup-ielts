# 📋 BÁO CÁO THẨM ĐỊNH CHÉO DỮ LIỆU TỪ CLAUDE CLI & CHATGPT AGENT

## 🤖 1. Đánh Giá Từ ChatGPT / OpenAI Agent

**1. Độ phủ và tính thực tiễn của dữ liệu hiện có**

| Nhóm tài liệu | Số lượng (tập) | Độ bao phủ năm học | Độ phù hợp với mục tiêu luyện thi 10 Chuyên Anh |
|---------------|----------------|-------------------|---------------------------------------------------|
| Đề thi Chuyên Anh vào 10 (Chính thức) | 6 | 2021‑2026 (các năm gần nhất) | Rất cao – là bộ đề “đúng chuẩn” mà học sinh phải làm. |
| Đề thi Tuyển sinh Lớp 10 THPT môn Tiếng Anh | 6 | 2020‑2025 | Cao – cung cấp các dạng đề “đánh giá chung” (đọc‑ngữ pháp‑vận dụng). |
| Đề thi Học sinh giỏi Lớp 9 (Luyện Chuyên Anh) | 6 | 2020‑2025 | Trung bình – tập trung vào đề HS giỏi, nhưng vẫn có nhiều câu hỏi dạng Chuyên Anh. |
| Đề thi Học sinh giỏi Lớp 8 (Tạo nguồn Chuyên) | 12 | 2019‑2024 | Thấp – phần lớn là câu hỏi cơ bản, ít phản ánh độ khó của đề Chuyên Anh. |
| Đề thi Chuyên Sư Phạm & Chuyên Ngoại Ngữ | 11 | 2022‑2026 | Cao – nguồn CSP, thường có đáp án và thang điểm chi tiết. |
| Đề thi THPT Chuyên Ngoại Ngữ (CNN) | 10 | 2021‑2026 | Trung‑cao – đề CNN có cấu trúc tương đồng, nhưng mức độ “đặc thù” (đọc hiểu dài) cao hơn. |
| Đề thi thử Chuyên Anh các trường THPT Chuyên | 12 | 2020‑2025 | Cao – các đề “mock” của các trường chuyên, giúp học sinh làm nhiều dạng đề. |
| Chuyên đề (Sentence Transformation, Word Formation, Cloze) | 34 | 2020‑2025 | Rất cao – luyện tập các kỹ năng cốt lõi (ngữ pháp, từ vựng, đọc hiểu). |
| Tuyển tập Đề thi Olympic 30/4 | 11 | 2020‑2025 | Trung bình – tập trung vào đề Olympic, có phần khó hơn so với đề tuyển sinh. |
| **Khác** | 18 | – | Thông tin hỗ trợ (đề mẫu, đề giải, tài liệu phụ). |

**Tổng quan:**  
- **Độ phủ**: Kho dữ liệu hiện có chứa **≈ 90 %** các dạng đề chính (đề chính thức, đề thử, đề CSP, đề CNN) và **≈ 70 %** các chuyên đề luyện kỹ năng.  
- **Tính thực tiễn**: Đối với học sinh muốn “luyện đề → làm đề → chấm lại”, dữ liệu đáp ứng hầu hết nhu cầu: có đề gốc, đáp án (trong một số bộ), và các chuyên đề luyện tập. Tuy nhiên, **độ đầy đủ của đáp án, giải thích chi tiết và thang điểm** còn thiếu ở một số nguồn (đặc biệt là các file Google Drive không kèm đáp án).  

---

**2. So sánh dữ liệu đã crawl (tailieudieuky, Google Drive) với các nguồn chính thức**

| Tiêu chí | Nguồn chính thức (ptnk.edu.vn, csp.edu

---

## 🧠 2. Đánh Giá Từ Claude CLI (Claude Code)

Tôi đã xem nhanh dữ liệu Chuyên Anh trong repo, nhưng tin nhắn của bạn mới chỉ nêu vai trò, chưa nêu việc cần làm. Tôi chưa chỉnh sửa gì.

Trong `D:\Claude\readup-ielts` có các nguồn có thể cần thẩm định:

- `data/chuyen_anh/catalog.json` (~154 KB): danh mục đề/tài liệu.
- `data/chuyen_anh/CHUYEN_ANH_RESOURCES.md` (~105 KB): tài liệu tổng hợp nguồn.
- `data/chuyen_anh/pdfs/` và `De-Chuyen-Anh-Tuyen-Quang-2026-2027-dap-an-file-nghe.zip`: file đề và đáp án.
- `docs/research/CHUYEN_ANH_VAO_10_SOURCES_2026-11.md` (chưa được commit): bảng nguồn đề và sách, kèm mức độ tin cậy.

Bạn muốn tôi làm gì? Ví dụ:

1. Kiểm tra `catalog.json`: trường thiếu, trùng lặp, sai năm, sai đích trường, liên kết hỏng.
2. Đối chiếu đáp án với đề gốc trong bộ đề Tuyên Quang 2026–2027 hoặc PTNK.
3. Đánh giá độ tin cậy từng nguồn trong file nghiên cứu, và xem nguồn nào có thể đưa vào app.
4. Một việc khác mà bạn đã nghĩ tới.

Cho tôi biết phạm vi (toàn bộ hay một phần) và tiêu chí bạn muốn dùng. Nếu bạn không chỉ định gì thêm, tôi sẽ làm mục 1 (kiểm tra cấu trúc và tính nhất quán của `catalog.json`) và báo cáo lỗi, không sửa file.

