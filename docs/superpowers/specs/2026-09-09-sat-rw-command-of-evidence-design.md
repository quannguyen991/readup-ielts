# Sinh câu Command of Evidence định lượng bằng code

*Lấp mảng Information & Ideas của SAT R&W để dựng được đề thi thử đúng form.*

---

## Vấn đề

Kho câu SAT R&W có 384 câu nhưng **sai hình dạng** so với đề thật:

```
Standard English Conventions   192  (50%)   đề thật ~26%
Craft and Structure             72  (19%)   đề thật ~28%
Information and Ideas           72  (19%)   đề thật ~26%
Expression of Ideas             48  (12%)   đề thật ~20%
```

Một đề đủ form cần 54 câu (2 module × 27). Dựng theo đúng tỉ lệ blueprint thì
`Expression of Ideas` cạn trước — chỉ ra được ~4 đề không trùng câu, trong khi gần một
nửa kho câu ngữ pháp nằm không.

Nguyên nhân: unit 1–10 sinh bằng luật (ngữ pháp sinh được), unit 11–16 đọc hiểu **soạn
tay** nên ít. Ba mảng thiếu chính là mấy unit soạn tay ấy.

**Ràng buộc cứng: không được gọi API.** Luật đã chốt 07/09/2026 vì hết tiền API, và vì
gọi AI lúc chạy làm "làm lại đề cũ" thành làm một đề mới nên không so được hai lần làm.

## Điều được xây

Bộ sinh **Command of Evidence (định lượng)** — dạng có thật trong đề số hoá: một bảng số
liệu, một nhận định, và bốn phương án nói về dữ liệu.

**Vì sao chính dạng này thoát được bế tắc.** Mọi dạng đọc hiểu khác đòi VĂN HAY, mà sinh
văn bằng luật thì dở. Dạng này không đòi văn — nó đòi **dữ liệu**, và dữ liệu thì sinh
bằng code là chuyện đã làm tốt ở SAT Math.

**Và nó miễn nhiễm với chính lỗi 32% vừa đo.** Bảng số là bịa ra, nên không kiến thức
phổ thông nào đoán được đáp án; muốn trả lời buộc phải đọc bảng. Đây là dạng câu mà phép
thử bịt mắt luôn xanh vì lý do đúng, chứ không phải vì hàng rào bỏ sót.

---

## Kiến trúc

Bám đúng khuôn `MathTemplate` đã có: `build` dựng THAM SỐ trước, rồi **tính** mọi thứ còn
lại từ tham số ấy.

```
src/services/sat-rw/evidence/
  types.ts        kiểu bảng, phương án, mã lỗi nhiễu
  evaluate.ts     hàm THUẦN: một nhận định có đúng với bảng không
  templates.ts    các họ đề (so sánh theo thời gian, xếp hạng, ngưỡng, khoảng cách)
  generate.ts     dựng một câu từ template + hạt giống
  verify.ts       hàng rào: đúng MỘT phương án đúng, và nó phải đỡ nhận định
```

### Nguyên tắc: phương án là MỆNH ĐỀ, không phải chuỗi chữ

Mỗi phương án được dựng thành một **mệnh đề có cấu trúc** (`Claim`) rồi mới quy ra câu
chữ. Nhờ vậy `evaluate.ts` phán xử được nó bằng chính bảng số — không phải so chuỗi.

Đây là chỗ khác biệt với "sinh bốn câu rồi đánh dấu câu đúng": ở đây **không ai đánh dấu
cả**, đáp án là kết quả của một phép tính trên bảng.

### Nhiễu có TÊN, không phải nhiễu bừa

Bốn kiểu sai, mỗi kiểu một mã — giống `used_diameter_not_radius` của SAT Math, để người
học sai được gọi đúng tên chỗ sai:

| Mã | Kiểu sai |
|---|---|
| `accurate_but_irrelevant` | đúng với bảng, nhưng không đỡ nhận định |
| `wrong_row` | đọc nhầm hàng — nói về thực thể khác |
| `reversed_comparison` | đảo chiều so sánh (cao ↔ thấp, tăng ↔ giảm) |
| `not_in_table` | khẳng định một con số bảng không hề có |

`accurate_but_irrelevant` là kiểu quan trọng nhất và cũng là kiểu đề thật hay dùng: người
học kiểm tra tính đúng của phương án rồi dừng lại, quên mất câu hỏi là *phương án nào ĐỠ
NHẬN ĐỊNH*.

### Họ đề

Bốn họ, đủ để 68+ câu không đọc ra như một khuôn:

1. **So sánh theo thời gian** — hai mốc, nhiều thực thể; nhận định: "X tăng nhiều hơn cả"
2. **Xếp hạng** — nhận định: "X cao nhất / thấp nhất"
3. **Ngưỡng** — nhận định: "quá nửa số điểm đo vượt mức N"
4. **Khoảng cách** — nhận định: "chênh lệch giữa A và B thu hẹp lại"

Bối cảnh lấy từ một bảng chủ đề khoa học / khoa học xã hội, đúng chất liệu SAT hay dùng.

---

## Hàng rào

Mọi câu sinh ra phải qua `verify.ts` trước khi vào kho. Trượt thì bỏ, không hạ chuẩn:

1. **Đúng một phương án đúng.** Đánh giá lại cả bốn bằng `evaluate.ts`; hai đúng hoặc
   không cái nào đúng đều là bỏ.
2. **Phương án đúng phải ĐỠ NHẬN ĐỊNH**, không chỉ đúng với bảng.
3. **Bốn phương án phải khác nhau** sau khi chuẩn hoá chữ.
4. **Mọi con số nêu trong phương án phải có trong bảng**, trừ phương án mang mã
   `not_in_table` — mã ấy là chỗ DUY NHẤT được phép nêu số lạ.
5. **Bảng phải đọc được**: 3–5 hàng, 2–3 cột số, không ô trống.

## Tất định

Cùng `templateSlug` + hạt giống → cùng câu, cùng thứ tự phương án. Không dùng
`Math.random()` ở đâu cả. Lý do giống hệt bộ đề trộn: người học làm lại đề cũ phải gặp
đúng câu ấy để đối chiếu tiến bộ, và một ca lạ phải dựng lại được để soi.

## Giới hạn, nói thẳng

- **Đây là MỘT dạng trong ba dạng của Information & Ideas.** *Ý chính* và *Suy luận* vẫn
  phải soạn tay; bộ này không thay thế chúng, chỉ gánh phần lớn số lượng.
- **Bảng số là bịa.** Nó dạy kỹ năng đọc bảng và nối bằng chứng với nhận định — đúng thứ
  SAT đo — nhưng không dạy kiến thức nền về chủ đề.
- **Không thay được văn hay.** Craft and Structure vẫn cần bài đọc thật; bộ này không
  chạm tới mảng đó.

## Thứ tự làm

1. `types.ts` + `evaluate.ts` — hàm thuần, test trước
2. `templates.ts` — họ "so sánh theo thời gian" trước, đủ chạy đầu-cuối
3. `generate.ts` + `verify.ts` — dựng và chặn
4. Ba họ còn lại
5. Nạp vào kho R&W, chạy lại thống kê mảng
6. Chỉ khi ba mảng đã đủ → mock R&W đúng form, rồi bài thi đầy đủ
