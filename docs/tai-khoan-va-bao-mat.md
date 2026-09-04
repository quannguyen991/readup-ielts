# Tài khoản, đồng bộ dữ liệu và bảo mật

Tài liệu này có hai phần: **phần đã code xong** (chạy ngay khi có key) và **phần
chỉ bạn làm được** (bấm trong console của Supabase, Google, Meta, Twilio — tôi
không tạo tài khoản hay nhập khoá thay bạn được).

---

## 1. Nguyên tắc gốc: đăng nhập là TUỲ CHỌN

App chạy đầy đủ khi chưa có tài khoản. Dữ liệu học nằm trong zustand + storage
của thiết bị. Tài khoản chỉ thêm đúng hai thứ:

- giữ tiến độ khi đổi máy,
- không mất dữ liệu khi xoá trình duyệt.

Mọi hàm trong `src/services/auth/` đều chịu được việc chưa cấu hình Supabase và
trả về thông báo tiếng Việt thay vì ném lỗi. Đây là ràng buộc thiết kế, không
phải trạng thái tạm — bắt đăng nhập trước khi cho dùng là cách nhanh nhất khiến
người ta đóng app.

---

## 2. Đã code xong

| Mảng | File | Ghi chú |
|---|---|---|
| Chuẩn hoá số điện thoại | `src/services/auth/phone.ts` | `0912…`, `+84912…`, `84912…` → cùng một E.164. Chặn số bàn và đầu số không tồn tại **trước khi gửi SMS** |
| Dịch lỗi | `src/services/auth/errors.ts` | Phân biệt lỗi của người dùng với lỗi cấu hình; lỗi cấu hình bị đánh dấu `retryable: false` |
| Xác thực | `src/services/auth/session.ts` | Google, Facebook, SMS OTP, email OTP, hồ sơ, đăng xuất, xoá tài khoản |
| Trạng thái | `src/store/useAuthStore.ts` | Không persist gì — Supabase đã tự lưu phiên |
| Màn hình | `app/auth/sign-in.tsx`, `otp.tsx`, `callback.tsx` | |
| Đồng bộ | `src/services/sync/` | Gộp hai chiều, không ghi đè |
| Xoá tài khoản | `app/api/account/delete+api.ts` | Chạy server, xác minh danh tính từ token |
| Lược đồ | `supabase/migrations/20260822000100_user_state.sql` | Bảng `user_state` + RLS + vá trigger tạo hồ sơ |

**Email: mã 6 số hay liên kết, do GÓI SUPABASE quyết định, không do ta chọn.**

Thiết kế ban đầu là mã 6 số: liên kết mở ở trình duyệt mặc định, mà trên điện
thoại đó thường không phải chỗ app đang chạy — người dùng bấm xong thấy một tab
lạ báo thành công còn app vẫn đứng im.

Nhưng **gói free dùng SMTP mặc định thì không sửa được mẫu email**:

> `Email template modification is not available for free tier projects using
> the default email provider.`

Mà mẫu mặc định chỉ có `{{ .ConfirmationURL }}`, không có `{{ .Token }}` — tức
là mã 6 số không bao giờ tới. Bày ô nhập mã ở trạng thái đó là hứa một thứ không
tồn tại: người dùng mở hộp thư, thấy một cái nút, quay lại app tìm mã, không có,
rồi tưởng email chưa gửi.

Vì vậy có `EXPO_PUBLIC_EMAIL_AUTH_MODE` (`link` | `code`).
`scripts/provision-supabase.ts` tự đặt: cài được mẫu `{{ .Token }}` thì `code`,
không thì `link`. `app/auth/otp.tsx` đổi màn theo biến đó.

**Ở chế độ `link`, phải mở liên kết trên chính trình duyệt đã bấm gửi.** Luồng
PKCE giữ `code_verifier` trong bộ nhớ của trình duyệt ấy; mở email ở máy khác thì
không có gì để đổi lấy phiên. Màn "Kiểm tra email" nói rõ điều này.

Muốn mã 6 số: nối SMTP riêng (Resend, Brevo, SendGrid đều có gói free) rồi chạy
lại `npm run setup:supabase` — nó tự cài mẫu và lật biến sang `code`.

**Nút đăng nhập chỉ hiện cách nào đang bật.** `src/services/auth/capabilities.ts`
hỏi `/auth/v1/settings` lúc mở màn; Google, Facebook, SMS chưa bật thì không vẽ
ra. Bày đủ bốn nút rồi để ba cái dẫn tới trang lỗi tiếng Anh là kiểu thất hứa tệ
nhất — người dùng đã bỏ công bấm rồi mới biết.

---

## 3. Đồng bộ: gộp, không ghi đè

Kịch bản quyết định toàn bộ thiết kế:

> Học trên điện thoại lúc mất mạng → mở máy tính → đồng bộ.

Buổi học trên điện thoại **không được biến mất**. Vì vậy mỗi trường dữ liệu phải
trả lời đúng một câu: *đây là lịch sử tích luỹ hay là một lựa chọn?*

| Loại | Cách gộp | Ví dụ |
|---|---|---|
| Lịch sử tích luỹ | Hợp hai tập theo id | Lượt làm bài, từ đã lưu |
| Tiến độ | Giữ bản **xa hơn** | Đọc tới 90% ở máy này, 30% ở máy kia → 90% |
| Số đếm theo ngày | Lấy **số lớn hơn**, không cộng dồn | Phút học (cộng dồn thì đồng bộ 2 lần là thành tích nhân đôi) |
| Thẻ FSRS | Giữ bản **ôn gần đây hơn** | Chọn nhầm là lịch ôn lùi về quá khứ |
| Lựa chọn | Bên sửa sau thắng | Mục tiêu band, phút mỗi ngày |

Ba thời điểm đồng bộ: ngay sau đăng nhập (gộp hai chiều), 8 giây sau thay đổi
cuối (chỉ đẩy lên), và khi bấm nút trong Cài đặt. **Không** đồng bộ theo chu kỳ.

**Vì sao lưu JSON theo store, không dùng các bảng quan hệ đã có:** mục tiêu là
dữ liệu không mất khi đổi máy, và một bảng khoá-giá trị giải quyết trọn vẹn việc
đó cho mọi store cùng lúc. Các bảng quan hệ vẫn còn nguyên, dành cho thứ JSON
không làm được (truy vấn phía máy chủ, thống kê nhiều người). Đánh đổi đã biết:
máy chủ không query vào trong payload, và gộp diễn ra ở client.

---

## 4. Mô hình bảo mật

**Cái gì bảo vệ dữ liệu:** RLS, không phải việc giấu khoá.

- `EXPO_PUBLIC_SUPABASE_ANON_KEY` **là khoá công khai theo thiết kế** — nó nằm
  trong bundle và ai cũng đọc được. Nó không cấp quyền gì; mọi bảng đều bật RLS
  và lọc theo `auth.uid()`.
- `SUPABASE_SERVICE_KEY` **bỏ qua RLS**, nên nó chỉ được đọc ở server.
  `src/lib/supabase-admin.ts` ném lỗi ngay nếu bị import vào code client. Tuyệt
  đối không đặt tên biến bắt đầu bằng `EXPO_PUBLIC_` cho khoá này.
- `user_state` có `with check (auth.uid() = user_id)`. Thiếu vế `with check` thì
  RLS chỉ lọc lúc **đọc**, và người dùng vẫn ghi được bản ghi mang `user_id` của
  người khác.

**Luồng OAuth dùng PKCE** (`flowType: 'pkce'` trong `src/lib/supabase.ts`). Luồng
implicit mặc định trả token thẳng trên URL sau dấu `#` — token đi vào lịch sử
trình duyệt, log của proxy, và header `Referer`. PKCE chỉ trả một mã dùng một
lần, phải đổi bằng `code_verifier` mà chỉ trình duyệt đó có.

**Xoá tài khoản không tin client.** `app/api/account/delete+api.ts` lấy danh tính
từ access token và xác minh với Supabase; nó **không** nhận `userId` từ body.
Nhận từ body nghĩa là ai cũng xoá được tài khoản người khác bằng cách đổi một
chuỗi. Token đọc từ header `Authorization`, không đọc từ query string (query
string đi vào log máy chủ).

**Không có mật khẩu.** Cả bốn cách đăng nhập đều không đặt mật khẩu, nên không
có mật khẩu để rò rỉ, để dùng lại từ site khác, hay để phải lưu hash.

**Giới hạn tần suất.** Supabase tự chặn phía máy chủ; màn OTP còn đếm ngược 60
giây phía client và đọc đúng số giây máy chủ yêu cầu khi bị chặn. Mỗi SMS là
tiền thật, nên chặn sớm rẻ hơn chặn muộn.

**Điểm yếu còn lại, nói thẳng:**

- Phiên lưu trong `localStorage` trên web. Nếu có lỗ XSS thì token đọc được.
  Giảm thiểu bằng: không `dangerouslySetInnerHTML`, không nhúng script bên thứ
  ba, CSP ở tầng hosting. Đây là đánh đổi tiêu chuẩn của SPA.
- Chưa có 2FA. Với app học thì mức rủi ro thấp, nhưng đừng nói là "đã bảo mật
  hai lớp".
- Xoá một từ vựng ở máy này **không** xoá ở máy kia (gộp là hợp hai tập). Đánh
  đổi có ý thức: mất một từ đã lưu khó chịu hơn thấy lại một từ tưởng đã xoá.

---

## 4b. Gói thuê bao và quyền quản trị

Bốn bậc: **Free · Plus · Pro · Max** (`src/lib/billing/plans.ts`).

Bậc thang chia theo **chi phí thật**, không chia bừa để ép nâng cấp:

| Bước | Mở thêm gì | Vì sao ở đúng chỗ đó |
|---|---|---|
| Free → Plus | toàn bộ nội dung | SAT Math sinh bằng code, bài đọc cào sẵn — chi phí ~0, nên mở sớm và mở hẳn |
| Plus → Pro | chatbox + bài mẫu AI | hai thứ này gọi model, mỗi lượt là tiền thật |
| Pro → Max | ngân sách AI gấp 4 + hỗ trợ ưu tiên | Max **không** có tính năng độc quyền nào khác, và trang giá nói thẳng như vậy |

Có test chặn ba lỗi lặng lẽ nhất của kiểu bảng giá này: gói đắt hơn thiếu tính
năng mà gói rẻ hơn có, hạn mức đi lùi giữa hai bậc, và câu mời nâng cấp đòi gói
đắt hơn mức cần.

### Thanh toán bằng QR chuyển khoản

Người dùng chọn gói → `/checkout` tạo một đơn `pending` kèm **mã đối chiếu** →
quét QR, chuyển khoản → chủ app đối chiếu sao kê rồi bấm xác nhận ở `/admin`.

**Cần khai ba biến môi trường**, nếu không trang thanh toán nói thẳng "chưa cấu
hình" thay vì hiện một mã QR trỏ vào hư không:

```
EXPO_PUBLIC_BANK_BIN=970436          # mã BIN 6 chữ số của ngân hàng
EXPO_PUBLIC_BANK_ACCOUNT=0123456789  # số tài khoản nhận
EXPO_PUBLIC_BANK_ACCOUNT_NAME=NGUYEN VAN A
```

Ba giá trị này **công khai theo thiết kế** — chúng nằm ngay trên mã QR mà ai
quét cũng đọc được, đúng như số tài khoản in trên hoá đơn giấy. Biết số tài
khoản chỉ để chuyển tiền VÀO, không rút ra được.

**QR sinh tại chỗ, không gọi dịch vụ ngoài.** `src/lib/payment/vietqr.ts` dựng
chuỗi EMVCo/VietQR rồi `src/components/payment/QrCode.tsx` vẽ bằng
`react-native-svg`. Dùng img.vietqr.io thì trang thanh toán hỏng theo máy chủ
của họ, và số tài khoản đi qua máy họ ở mọi lượt xem trang.

Hai chi tiết đã cắn một lần và giờ có test khoá:

- **CRC là biến thể CCITT-FALSE** (poly 0x1021, init 0xFFFF). Chọn nhầm biến thể
  là lỗi im lặng tuyệt đối — chuỗi vẫn dựng ra, chỉ có điều không app ngân hàng
  nào quét được. Test khoá giá trị kiểm chuẩn `CRC("123456789") = 0x29B1`.
- **CRC tính trên cả bốn ký tự `6304` của chính trường CRC.** Sai chỗ này thì
  mọi app chỉ báo "mã QR không hợp lệ" mà không nói vì sao.

### Mã đối chiếu

`src/lib/payment/reference.ts` — dạng `RU` + 6 ký tự + 1 ký tự kiểm, ví dụ
`RUCKNC363`. Bốn ràng buộc đều đến từ chỗ nó phải sống sót qua hệ thống ngân
hàng: chỉ A–Z và số (ngân hàng bỏ dấu, viết hoa); không có `0 O 1 I L U` (người
dùng chép tay); có ký tự kiểm (**test kiểm mọi lỗi gõ sai một ký tự đều bị bắt**);
và ngắn.

Nội dung chuyển khoản là `READUP <mã>`. `extractReference()` tìm được mã trong
một dòng sao kê lộn xộn — sẵn cho lúc nối webhook đối chiếu tự động.

### Nối thanh toán tự động sau này

Lược đồ đã sẵn. Chỉ cần thêm một route nhận webhook (Casso, SePay, hoặc cổng
thanh toán), gọi `extractReference()` trên nội dung giao dịch, so số tiền, rồi
làm đúng những gì `POST /api/admin/payments` đang làm. Trang `/checkout` không
phải sửa gì — nó vốn đã hỏi lại trạng thái theo chu kỳ.

`payments.provider_ref` là **duy nhất theo `(provider, provider_ref)`** — webhook
bị gửi lại (chuyện bình thường ở mọi cổng) cũng chỉ cộng gói đúng một lần.

### Chống lạm dụng ở luồng tiền

| Ca | Chặn ở đâu |
|---|---|
| Client gửi `amount: 1000` cho gói Max | route bỏ qua, tra bảng giá phía máy chủ |
| Tự tạo đơn `status = 'paid'` | policy `payments_insert_own` có `with check (... and status = 'pending')` |
| Tự sửa đơn của mình thành `paid` | không có policy UPDATE + đã `revoke update on payments` |
| Tạo đơn đứng tên người khác | `with check (auth.uid() = user_id)` |
| Người thường tự xác nhận đơn | `requireAdmin` → 403 |
| Admin bấm xác nhận hai lần | `.eq('status','pending')` ngay trong câu UPDATE → 409, không cộng gói lần hai |
| Body gửi kèm `plan: 'max'` khi xác nhận đơn 79k | gói lấy từ ĐƠN đã lưu, không lấy từ body |

Bộ dò 14 ca cho bảng này đã chạy trên cả localhost lẫn production.

### Cấp gói

Chưa có cổng thanh toán, nên quy trình thật là: người dùng chuyển khoản → đối
chiếu → bật gói bằng tay.

- **Trang `/admin`** — chỉ hiện với `profiles.role = 'admin'`.
- **Dòng lệnh** — `npm run grant -- --email ... --plan max --role admin --forever`.
  Dùng cho admin ĐẦU TIÊN (trang admin đòi phải đã là admin — con gà và quả trứng),
  và nó tạo sẵn tài khoản nếu email chưa từng đăng nhập.

Cả hai đường đều ghi `admin_audit` kèm giá trị **trước và sau**. Cấp gói là thao
tác đụng tới tiền; tháng sau không ai nhớ nổi vì sao một tài khoản thành Max.

### ⚠️ Bài học đắt nhất của phần này: REVOKE theo cột không trừ được vào GRANT theo bảng

Hai migration đầu viết:

```sql
revoke update (plan, plan_started_at, plan_expires_at) on profiles from authenticated;
revoke update (role) on profiles from authenticated;
```

và ghi chú rằng "người dùng không tự nâng gói được". **Sai hoàn toàn.** Trong
PostgreSQL, `REVOKE UPDATE (cột)` chỉ gỡ quyền cấp ở **mức cột**; nó không trừ
gì vào quyền cấp ở **mức bảng**. Supabase mặc định chạy
`grant all on all tables in schema public to authenticated`, nên `authenticated`
có UPDATE toàn bảng — và UPDATE toàn bảng cho ghi **mọi** cột. Hai lệnh trên là
lệnh rỗng.

Đo được bằng bộ dò trước khi vá:

```
PATCH /rest/v1/profiles?id=eq.<mình>  {"plan":"max"}   → HTTP 204
PATCH /rest/v1/profiles?id=eq.<mình>  {"role":"admin"} → HTTP 204
```

Bất kỳ ai đăng nhập cũng tự cấp cho mình gói đắt nhất, rồi tự phong quản trị
viên, rồi cấp gói cho người khác. RLS không cứu được: policy `profiles_update_own`
cho sửa **đúng hàng của mình**, mà hàng đó chứa cột `role`. RLS lọc theo HÀNG,
quyền lọc theo CỘT.

Cách đúng (`20260902000200_fix_column_grants.sql`):

```sql
revoke update on profiles from authenticated;   -- gỡ quyền MỨC BẢNG trước
grant update (display_name, avatar_url, target_band, target_date,
              daily_goal_minutes, locale) on profiles to authenticated;
```

Kiểm lại bằng SQL, đừng tin lời chú thích trong migration:

```sql
select privilege_type from information_schema.table_privileges
 where table_name = 'profiles' and grantee = 'authenticated';
-- KHÔNG được có UPDATE trong kết quả
```

`TRUNCATE` cũng đã thu hồi: nó là lệnh DDL, **RLS không lọc nó**.

### Ba tầng chặn, không tầng nào đủ một mình

| Tầng | Ở đâu | Chặn được gì |
|---|---|---|
| Giao diện | `app/admin.tsx`, sidebar | ẩn nút. **Không phải bảo mật** — sửa JS là hiện lại |
| Route máy chủ | `src/services/admin/guard.ts` | danh tính từ access token, vai trò đọc lại từ DB bằng service key |
| Cơ sở dữ liệu | quyền theo cột + RLS | chặn cả khi ai đó bỏ qua app, gọi thẳng PostgREST |

Bộ dò 12 ca cho ba tầng này nằm ở lịch sử phiên làm việc; ca quan trọng nhất là
"người dùng thường tự đặt `plan=max` / `role=admin` qua PostgREST" — đúng ca đã
bắt được lỗ hổng trên.

---

## 5. Việc chỉ bạn làm được

Tôi không tạo tài khoản hay nhập khoá thay bạn được. Đây là danh sách chính xác.

### 5.1 Tạo project Supabase — **một lệnh**

Việc duy nhất không tự động được là **tạo tài khoản**. Xong cái đó thì chỉ cần
một token, phần còn lại chạy bằng Management API:

1. Đăng nhập **supabase.com** (đăng nhập bằng GitHub là nhanh nhất, miễn phí).
2. Mở **https://supabase.com/dashboard/account/tokens** → *Generate new token*.
3. Chạy:

```bash
npm run setup:supabase -- --token sbp_... --vercel
```

Lệnh đó làm trọn: tạo project ở Singapore, đợi database khoẻ, đẩy toàn bộ
migration (có sổ ghi nên **chạy lại được**), khai Site URL + Redirect URL, đổi mẫu
email sang mã 6 số, ghi `.env.local`, và (với `--vercel`) đặt biến môi trường
trên Vercel — `SUPABASE_SERVICE_KEY` **chỉ ở Production**, vì preview URL ai đoán
được cũng vào được mà khoá này bỏ qua toàn bộ RLS.

Token là chìa khoá toàn tài khoản Supabase. Dùng xong thu hồi ở đúng trang đó.

Kiểm lại bằng `npm run setup:check`.

<details>
<summary>Làm tay, nếu không muốn cấp token</summary>

1. supabase.com → **New project**, region **Singapore**.
2. **Settings → API**, chép ba giá trị vào `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_KEY=<service_role key>
```

3. Đẩy lược đồ: `npx supabase link --project-ref <ref>` rồi `npx supabase db push`.
4. **Authentication → URL Configuration**:
   - Site URL: `https://readup-ielts.vercel.app`
   - Redirect URLs: `https://readup-ielts.vercel.app/auth/callback`,
     `http://localhost:8081/auth/callback`, `readupielts://auth/callback`
   - Thiếu dòng nào thì đăng nhập ở môi trường đó kẹt ở trang trắng.
5. **Authentication → Emails → Magic Link**: đổi nội dung sang `{{ .Token }}` để
   email gửi **mã 6 số** thay vì liên kết — màn `app/auth/otp.tsx` đợi mã, không
   đợi liên kết.
6. Đặt ba biến trên vào Vercel rồi deploy lại.

</details>

### 5.3 Google

1. console.cloud.google.com → tạo project → **APIs & Services → OAuth consent
   screen** → điền tên app, email hỗ trợ, và **link chính sách quyền riêng tư**.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
   *(là URL của Supabase, không phải URL app của bạn.)*
4. Dán Client ID + Client Secret vào **Supabase → Authentication → Providers →
   Google** → Enable.

### 5.4 Facebook

1. developers.facebook.com → **Create App** → chọn **Consumer** → thêm sản phẩm
   **Facebook Login**.
2. **Facebook Login → Settings → Valid OAuth Redirect URIs**:
   `https://<ref>.supabase.co/auth/v1/callback`
3. **Settings → Basic**: lấy App ID + App Secret → dán vào **Supabase →
   Providers → Facebook**.
4. ⚠️ Facebook bắt **App Review** trước khi người ngoài danh sách test đăng nhập
   được, và bắt buộc có URL chính sách quyền riêng tư công khai. Duyệt thường
   mất vài ngày. Trước khi duyệt xong, chỉ tài khoản bạn thêm vào **Roles →
   Testers** mới đăng nhập được.

### 5.5 SMS — **phần tốn tiền**

Supabase **không tự gửi SMS**. Phải nối một nhà cung cấp:

1. **Authentication → Providers → Phone** → Enable.
2. Chọn Twilio (phổ biến nhất), MessageBird, Vonage hoặc Textlocal.
3. Với Twilio: tạo tài khoản → mua số hoặc tạo Messaging Service → lấy
   **Account SID**, **Auth Token**, **Message Service SID** → dán vào Supabase.

**Chi phí thật:** SMS về Việt Nam khoảng **0,03–0,06 USD một tin**, tính cả tin
gửi hỏng. 1.000 lượt đăng nhập ≈ **30–60 USD**. Twilio còn thu phí thuê số hàng
tháng.

**Gợi ý:** để **email OTP làm mặc định** (miễn phí) và coi SMS là lựa chọn thứ
hai. Code đã hỗ trợ cả hai, đổi thứ tự chỉ là đổi tab mặc định ở
`app/auth/sign-in.tsx`.

### 5.6 Email — cái bẫy hay bị bỏ qua

SMTP mặc định của Supabase **giới hạn vài email mỗi giờ** và chỉ dành cho lúc
phát triển. Dùng thật thì phải nối SMTP riêng:

**Authentication → Emails → SMTP Settings** → điền thông tin của Resend,
SendGrid, Postmark hoặc Amazon SES. Không làm bước này thì người dùng thứ năm
trong giờ sẽ không nhận được mã, mà log không báo gì rõ ràng.

---

## 6. Kiểm sau khi cấu hình xong

```bash
npm --prefix readup-ielts test
```

```bash
npm --prefix readup-ielts run typecheck
```

Rồi mở app và đi đúng chuỗi này:

1. `/auth/sign-in` — banner "chưa nối máy chủ" phải **biến mất**.
2. Đăng nhập bằng email → nhận mã → vào được.
3. Vào Cài đặt, xem dòng "Đã đồng bộ lúc…".
4. Làm một bài ở Math, chờ 10 giây, mở **cửa sổ ẩn danh**, đăng nhập cùng tài
   khoản → lượt làm bài phải có mặt.
5. Kiểm chiều ngược lại: làm bài ở cửa sổ ẩn danh, quay về cửa sổ đầu, bấm "Đồng
   bộ ngay" → **cả hai lượt** phải còn. Đây là bài kiểm quan trọng nhất — nó
   chứng minh gộp hoạt động chứ không phải ghi đè.
