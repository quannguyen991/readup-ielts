# Chuỗi kiểm chứng — từ "AI viết câu này" đến "em này làm được"

*Thiết kế cho hồ sơ dự thi AI for SDGs 2026 (UNU Macau). Hạn nộp 15/09/2026.*

---

## Vấn đề

ReadUp có một cỗ máy nhưng chưa có một phát hiện nào. Mọi thứ trong hồ sơ hiện tại
là cơ chế cộng lập luận; không có con số nào mà người khác chưa có, và không có
tính năng nào nhìn vào là thấy mới.

Đo lại thì thấy ba chỗ hở cụ thể:

1. **Hàng rào canh cổng phụ.** Phép thử bịt mắt — hai model ở thế đối kháng — chỉ
   chạy khi `isTransfer`, nhánh hiếm nhất trong app. Đường sinh đề chính không có
   hàng rào AI nào.
2. **Phán quyết bị vứt đi.** `Receipt` trong `/api/proofloop/probe` trả về trong một
   HTTP response rồi biến mất. Không có gì tích luỹ, nên không đo được gì.
3. **Sổ bằng chứng không mang đi được.** `buildExport` đã sinh ra một object JSON
   mang đi được, nhưng không ký. Ai cũng sửa được, không ai kiểm được. Hồ sơ đã tự
   thú giới hạn này.

## Điều được xây

Một **chuỗi giám sát liên tục**, ký số ở từng mắt xích:

```
AI viết câu  →  nhãn xuất xứ ký số  →  người học làm  →  chứng chỉ ký số  →  ai cũng kiểm được
```

Chưa từng có đường nào đi liền từ *"model nào viết câu này và nó có hợp lệ không"*
tới *"người học này làm được gì"* mà không khúc nào đòi phải tin nhà cung cấp.

**AI là lõi theo nghĩa chặt:** thứ được ký, được truy xuất, được đem ra đấu — đều là
sản phẩm của model. Bỏ AI ra thì cả chuỗi không còn gì để chứng thực.

---

## Bốn tính năng

### 1 · Nhãn xuất xứ ký số, gắn trên từng câu hỏi

Mỗi câu do AI sinh mang theo một nhãn mở ra xem được trong lúc làm bài: model nào
viết, qua những luật nào, model bịt mắt trả lời ra sao, đã loại bao nhiêu bản nháp
và vì sao.

Không sản phẩm edtech nào hiện bán ra kèm xuất xứ cho đề do AI sinh. Đây là dạng
cụ thể của AI literacy, không phải một bài giảng về AI literacy.

### 2 · Chứng chỉ năng lực người học tự giữ — `did:key` + W3C VC

Sổ bằng chứng ký thành chứng chỉ chuẩn W3C. Khoá nằm trên máy người học. Không
blockchain, không máy chủ, không cần mạng.

Ruột chứng chỉ không ghi điểm số. Nó ghi: *kỹ năng X đã công nhận qua phép thử
chuyển giao sang nguồn khác, dựa trên các câu có nhãn xuất xứ `#…`* — một chứng chỉ
mang theo chuỗi bằng chứng của chính nó.

`did:key` chứ không blockchain vì: không cần hạ tầng, không phí giao dịch, chạy khi
mất mạng. Đó chính là lập luận SDG 10 / track LDC.

### 3 · Bộ kiểm độc lập — chạy được khi ReadUp biến mất

Trang tĩnh + lệnh CLI: dán chứng chỉ vào, nó đi ngược cả chuỗi và báo cáo. Không gọi
về ReadUp một lần nào. **Báo cả chỗ chưa kiểm được**, y hệt hàng "không máy nào kiểm
được" trong biên nhận hiện có.

### 4 · Đấu trường model — công khai

Chọn hai model, cùng một bài, cùng sinh đề, model bịt mắt xử. Bảng xếp hạng: model
nào ra nhiều đề hỏng nhất. Biến phát hiện thành thứ nghịch được, và mỗi lượt nghịch
đẻ thêm dữ liệu.

---

## Phối hợp với phiên đang chạy song song

Một phiên khác đang sửa `src/services/questions/verify.ts`, `blueprint.ts`,
`app/api/questions+api.ts`, `src/services/mastery/reading-skill.ts`.

`verify.ts` của họ là **nửa luật** của hàng rào: `verifyQuestion` (7 mã lỗi cấp câu)
+ `verifySet` (4 mã cấp bộ), đặt ở cửa đóng băng seed.

**Phân vùng:**

| Vùng | Ai giữ |
|---|---|
| `services/questions/*`, `blueprint`, `questions+api`, `mastery/reading-skill` | phiên kia |
| `services/credential/*`, `services/provenance/*`, `scripts/verify-credential.ts` | phiên này |
| Hàng rào bịt mắt | phiên này, **module rời**, ghép vào sau khi họ commit |

Hàng rào bịt mắt viết như hàm thuần nhận `GeneratedQuestion` — **compose** với
`verifyQuestion` của họ, không thay thế, không sửa file của họ.

---

## Kiến trúc

### `src/services/credential/`

| File | Vai trò |
|---|---|
| `keys.ts` | sinh cặp khoá Ed25519; mã hoá khoá công khai thành `did:key:z6Mk…` |
| `canonical.ts` | tuần tự hoá JSON tất định — thứ tự khoá cố định |
| `sign.ts` | ký / kiểm chữ ký trên payload đã canonical hoá |
| `vc.ts` | dựng và kiểm Verifiable Credential từ `Ledger` |
| `store.ts` | giữ khoá riêng trên thiết bị (adapter, không phải hàm thuần) |

### `src/services/provenance/`

| File | Vai trò |
|---|---|
| `label.ts` | kiểu `ProvenanceLabel`, dựng nhãn, băm nội dung ra id |
| `blind-gate.ts` | hàng rào bịt mắt như hàm thuần + một lời gọi model tách riêng |
| `ledger.ts` | sổ phán quyết — tích luỹ verdict để đo |

### Nguyên tắc giữ nguyên từ dự án

- **Model không được quyết định, chỉ được dựng.** `judgeBlindAnswer` vẫn thuần, có test.
- **Không nói dối về chỗ chưa kiểm được.** Hàng rào lỗi thì ghi `check-failed`, không
  ghi là đã đỗ.
- **Tất định.** Canonical hoá phải cho cùng một chuỗi trên mọi máy, mọi lần chạy —
  không thì chữ ký vô nghĩa.

---

## Điều kiện phủ định — đăng ký TRƯỚC khi đo

Ghi ở đây trước khi chạy phép đo, để một kết quả đáng thất vọng không bị diễn giải
lại sau khi đã nhìn thấy nó.

**Ngưỡng: 8%.** Nếu tỉ lệ câu bị hàng rào bịt mắt loại — trên mẫu ≥200 câu, ≥2 model
— **thấp hơn 8%**, thì kết luận phải viết đúng như sau vào hồ sơ:

> Hàng rào bịt mắt bắt được ít hơn mức đáng để chạy nó ở quy mô lớn. Chi phí gấp đôi
> số lời gọi model để loại dưới một câu trong mười hai. Cơ chế đúng về nguyên tắc
> nhưng không đáng tiền ở quy mô này.

Chọn 8% vì dưới ngưỡng đó, chi phí gấp đôi lời gọi model không đổi lại được gì mà một
lần rà soát tay của giáo viên không làm được rẻ hơn.

**Các caveat phải ghi kèm mọi con số công bố:**

1. "Model trả lời được khi bịt mắt" là **cận dưới của rò rỉ**, không phải phán quyết
   sư phạm. Đề thi thật cũng có câu trả lời được một phần bằng kiến thức nền.
2. Kho bài là Wikipedia / Gutenberg / PLOS, **không phải đề thi thật**.
3. Model có phiên bản; phải ghim tên và ngày đo.
4. Model bịt mắt cũng là model. Phải neo bằng người thật (xem dưới), và báo cáo tỉ lệ
   đồng thuận **dù nó xấu**.

## Neo bằng người thật

3–8 bạn cùng lớp làm ~100 câu **không cho đọc bài**, đối chiếu với phán quyết của
model bịt mắt. Báo cáo tỉ lệ đồng thuận.

Không có bước này thì cả phép đo là *AI chấm AI* — tự sập. n=8 thừa sức đỡ một chỉ số
đồng thuận, trong khi n=8 **không** đỡ nổi nghiên cứu học tập mà `pilot-protocol.en.md`
định làm. **Nghiên cứu học tập đó bị cắt.**

---

## Giới hạn, nói thẳng

- **Chưa trường nào công nhận chứng chỉ này**, và sẽ không có trong 8 ngày. Giá trị
  nằm ở chỗ hồ sơ và bằng chứng của nó mang đi được và kiểm được, theo đúng chuẩn mà
  một tổ chức *có thể* chấp nhận.
- **Khoá riêng mất là mất.** Không có khôi phục. Đó là cái giá của việc không có máy chủ.
- **Chữ ký chứng minh "sổ này không bị sửa sau khi ký"**, không chứng minh "người học
  không gian lận lúc làm bài". Hai chuyện khác nhau, không được lẫn.

## Thứ tự làm

1. Xương sống mật mã — `canonical.ts` → `keys.ts` → `sign.ts` *(mọi thứ treo vào đây)*
2. Verifiable Credential — `vc.ts` + `scripts/verify-credential.ts`
3. Nhãn xuất xứ — `label.ts` + sổ phán quyết
4. Hàng rào bịt mắt như module rời, ghép sau khi phiên kia commit
5. Mặt giao diện: nhãn trong lúc làm bài, chứng chỉ ở màn sổ bằng chứng
6. Đấu trường model
7. Viết lại hồ sơ tiếng Anh quanh phát hiện; deck, logo, ảnh
