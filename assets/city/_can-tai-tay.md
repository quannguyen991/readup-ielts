# Model cần tải bằng tay (Thành Phố Tri Thức)

Quy tắc: không tạo tài khoản, không đăng nhập, không vượt captcha. Chỉ dùng model
có giấy phép cho phép **sử dụng thương mại** (ReadUp có thu phí). Mỗi model phải
có một dòng trong `assets/city/LICENSES.json` **trước khi** tải; file thô đặt ở
`assets/city/_raw/<id>/` (đã gitignore), rồi chạy `node scripts/city-assets/process.mjs`.

## Hiện tại: không có mục nào cần tải tay

Bộ đang dùng = công trình / cây / đồ nghề **dựng bằng code** + 13 model trang trí
**Poly Haven (CC0)** tải tự động bằng `scripts/city-assets/fetch.mjs`.

## Ghi chú về Free3D

Free3D yêu cầu đăng nhập để tải và giấy phép khác nhau theo từng model
("Personal Use Only" rất phổ biến). Vì vậy KHÔNG tải tự động. Danh sách ứng viên
Free3D trong bản nháp cũ (hải đăng, cối xay gió, thuyền, đài phun nước) **chưa
được xác minh** đường dẫn lẫn giấy phép nên đã bỏ; các công trình đó hiện dựng
bằng code. Nếu muốn thêm, người quản trị tự mở trang model, chụp lại phần giấy
phép (phải ghi rõ cho phép thương mại), thêm dòng vào `LICENSES.json`, rồi đặt
file vào `_raw/`.
