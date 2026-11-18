# Người đóng góp cho ReadUp (Band 9)

File này ghi ai làm phần nào, theo đúng việc đã làm. Ai tham gia thêm thì mở pull request sửa file này.

## Danh sách

| Người đóng góp | Vai trò | Liên hệ |
|---|---|---|
| quannguyen991 | Chủ dự án: sản phẩm, kỹ thuật, máy chủ, nội dung | GitHub: [quannguyen991](https://github.com/quannguyen991) |
| Phí Ngọc Minh Sang | Frontend Support (hỗ trợ giao diện) | GitHub: [sagifTheCoder](https://github.com/sagifTheCoder) |

## Phạm vi từng vai trò

### Chủ dự án — quannguyen991
- Quyết định sản phẩm, nội dung luyện thi và luật tính điểm.
- Phụ trách API, cơ sở dữ liệu (Supabase, migration), máy chủ và triển khai.
- Duyệt mọi thay đổi trước khi gộp vào nhánh chính.

### Frontend Support — Phí Ngọc Minh Sang

**1. Giao diện màn hình**
- Dựng và sửa màn hình trong thư mục `app/` (Expo Router) và thành phần dùng chung trong `src/components/`.
- Bố cục chạy tốt trên điện thoại và trên trình duyệt máy tính, kể cả thanh tab dưới của bản điện thoại.
- Giữ thống nhất với thư viện bố cục đang có, không tự tạo kiểu riêng cho từng màn.

**2. Hệ thống thiết kế**
- Dùng đúng bảng màu, chữ và khoảng cách trong `DESIGN.md` và `src/theme/`.
- Không mã cứng màu hay cỡ chữ trong từng màn hình; đưa vào token nếu cần dùng lại.

**3. Chữ hai ngôn ngữ**
- Mọi chữ người dùng nhìn thấy đi qua hệ thống dịch (`src/i18n/`). Thêm chữ mới thì phải có cả bản tiếng Việt và tiếng Anh.
- Không viết chữ tiếng Việt thẳng vào code giao diện.

**4. Thư viện và bìa sách**
- Thẻ bộ từ, thư viện từ vựng và các bìa sách (ví dụ `src/components/vocab/`).
- Trang tủ sách (`app/tu-sach.tsx`) đang được làm theo tiến độ học; phần này nằm trên nhánh `sach-mo-dan`.

## Ngoài phạm vi frontend

Các việc dưới đây không giao cho vai trò frontend, trừ khi chủ dự án giao riêng:
- API và logic phía máy chủ (`app/api/`, `api/`), migration cơ sở dữ liệu (`supabase/`).
- Triển khai, máy chủ sản xuất, khoá bí mật, file `.env`, cookie hay token.
- Logic chấm điểm, luật rủi ro và nội dung đề thi.

## Cách làm việc

1. Đọc `AGENTS.md` và tài liệu Expo SDK 57 trước khi viết code.
2. Tạo nhánh riêng từ `main`, ví dụ `frontend/ten-viec`. Không đẩy thẳng lên `main`.
3. Trước khi mở pull request, chạy:
   - `npm run typecheck`
   - `npm test`
   - `npm run lint`
4. Chạy thử trên trình duyệt bằng `npm run web`. Cần file `.env.local` có các biến môi trường do chủ dự án cung cấp.
5. Không commit file `.env`, khoá API, cookie hay token. Nếu lỡ commit, báo chủ dự án ngay.
6. Mở pull request, mô tả màn hình nào đã đổi và đã kiểm tra trên thiết bị nào.

## Quy ước ghi nhận

- Vai trò ghi đúng phạm vi đã làm, không ghi cao hơn.
- Muốn thêm hoặc sửa tên, mở một issue hoặc nhắn trực tiếp cho chủ dự án.
