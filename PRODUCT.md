# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Học sinh THPT Việt Nam (15–18 tuổi) ôn IELTS hoặc SAT để du học hoặc xét tuyển. Họ tự học trên điện thoại và máy tính, thường sau giờ học trên lớp. Người mở trang giới thiệu lần đầu đến từ một link được chia sẻ (Facebook, Zalo, nhóm lớp) và quyết định trong vài giây có thử hay không. (Xác nhận 08/10/2026.)

## Product Purpose

Band 9 (trước đây là ReadUp) là web app luyện IELTS và SAT. Thành công là học sinh làm bài thật, thấy rõ mình sai ở đâu, và quay lại luyện tiếp mỗi ngày.

## Positioning

Hai điều trang phải làm người mới tin ngay (người dùng chọn 08/10/2026):

1. **Đề sát thi thật, chấm ngay, biết sai ở đâu**: Reading/Listening chấm tức thì, Writing/Speaking có AI góp ý theo tiêu chí IELTS, đáp án SAT Math tính bằng code thay vì AI đoán.
2. **Học như chơi game**: Du ngoạn (bản đồ thành phố pixel, nói chuyện tiếng Anh với nhân vật, nhiệm vụ du học), Thành phố tri thức, Chuyến bay từ vựng, sao và quà.

IELTS và SAT nằm chung một app.

## Capabilities and Constraints

- Khách (chưa đăng nhập) dùng ngay: Từ vựng, Reading, Luyện câu, SAT Math, SAT Reading & Writing. Cần tài khoản: Listening, Speaking, Writing, Thi thử, Đọc báo song ngữ, Du ngoạn, Cộng đồng (nguồn: `src/lib/access/member-gate.ts`).
- Tài khoản mới được tặng 14 ngày gói Plus (`WELCOME_DAYS`).
- Expo / React Native Web, deploy Vercel; tên miền `band9-ielts.vercel.app` và `9band.com`.
- Giọng phát âm từ vựng: Gemini Aoede.

## Brand Commitments

- Tên **Band 9**, logo Band 9 và màu **vàng kim** (đổi thương hiệu 01/10/2026) phải giữ nguyên trên trang giới thiệu.
- Không bắt chước nhận diện TID (đã bị bắt sửa trước đây).

## Evidence on Hand

- Ảnh chụp thật các màn trong app (Du ngoạn, màn học từ, luyện thi) có thể chụp từ bản đang chạy.
- Số liệu nội dung trên trang `/intro` cũ (1.400 bài đọc, 151 bộ đề Math, 3.232 câu toán, 60 đề Writing) là con số app tự ghi, chưa kiểm lại.
- Chưa có lời chứng thực, số người dùng hay điểm thi của học viên. Không được bịa.

## Product Principles

- Cho thấy, không kể: trang đưa ra màn thật của app (câu sai được chỉ ra, nhân vật trò chuyện) thay vì khẩu hiệu.
- Ít chữ: học sinh đọc lướt trên điện thoại.
- Thật thà về giới hạn: nói rõ phần nào mở cho khách, phần nào cần tài khoản.
- Không số liệu giả, không lời chứng thực bịa.
