# Bàn giao dự án ReadUp

Tài liệu này viết cho một trợ lý lập trình khác (ChatGPT) tiếp quản dự án. Đọc
hết trước khi sửa dòng mã đầu tiên. Phần 5 và 6 là phần đắt nhất: đó là những
thứ đã trả giá bằng thời gian gỡ lỗi, không đoán lại được từ mã nguồn.

Cập nhật: 20/09/2026 · nhánh `proofloop` · commit gần nhất `c4a9240`.

---

## 0. Đọc trong 60 giây

| Việc | Câu lệnh |
|---|---|
| Thư mục gốc | `D:\Claude\readup-ielts` |
| Chạy web | `npm run web` (mở http://localhost:8081) |
| Kiểm kiểu | `npm run typecheck` |
| Chạy test | `npm test` — hiện **1848 pass / 0 fail** |
| Lint | `npm run lint` |
| **Triển khai** | `npx vercel deploy --prod --yes` |
| Bản chạy thật | https://readup-ielts.vercel.app |

**Git không có remote.** `git push` sẽ báo lỗi. "Đẩy lên" trong dự án này nghĩa
là chạy `vercel deploy --prod`. Vẫn commit đầy đủ vào nhánh `proofloop` ở máy.

---

## 1. Dự án là gì

ReadUp — app luyện thi tiếng Anh cho một người học cụ thể (học sinh cấp 3 Việt
Nam, mục tiêu IELTS + SAT, thi SAT tháng 11/2027). Một codebase chạy cả web,
iOS, Android.

Stack: **Expo SDK 57 + expo-router** · TypeScript strict · **NativeWind**
(Tailwind cho React Native) · Zustand (có persist) · TanStack Query ·
**Supabase** (auth + đồng bộ) · ts-fsrs (lặp lại ngắt quãng) · Reanimated ·
Recharts (web) / victory-native (mobile).

> Expo 57 khác nhiều so với các bản trước. Tra tài liệu đúng phiên bản tại
> https://docs.expo.dev/versions/v57.0.0/ trước khi viết mã liên quan tới Expo.

Quy mô hiện tại: 65 màn (`app/*.tsx`), 25 API route (`app/api/*+api.ts`),
80 component, 135 tệp test.

**Các mảng chính**

- **IELTS Reading** — kho bài đọc, phòng thi, chấm, sổ bằng chứng.
- **IELTS Writing** — đề, chấm bằng AI, bài mẫu, luyện dịch câu.
- **SAT Math** — chẩn đoán, drill theo kỹ năng, đề thi thử.
- **SAT Reading & Writing** — 16 unit, đề trộn.
- **Nghe & chép chính tả** — thư viện VOA, video YouTube, bộ đề.
- **Từ vựng** — sổ từ FSRS, từ vựng chủ đề, luyện điền từ.
- **Đọc báo song ngữ** — 125 bài, từ điển tra tại chỗ (mục 7).
- **Trò chơi hoá** — điểm, xếp hạng, cửa hàng đổi điểm.
- **Thanh toán** — gói Free/Pro/Max, mua chung, mời bạn, SePay.

---

## 2. Chạy và triển khai

```bash
npm install
cp .env.example .env.local     # rồi điền giá trị thật
npm run web
```

Biến môi trường: xem `.env.example` (đã liệt kê đủ và có chú thích). Tóm tắt:

- `EXPO_PUBLIC_*` được **inline vào bundle** — chỉ để thứ công khai được.
- Khoá bí mật (`SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `AI_*_API_KEY`) chỉ
  đọc trong API route / Edge Function. Xem cổng chặn ở `src/lib/env.ts`.
- Trên Vercel, biến môi trường đã khai sẵn ở dashboard. Deploy không cần truyền
  gì thêm.

**Ba cửa AI.** Mọi lời gọi AI đi qua `src/services/ai/fallback.ts`: ba proxy
độc lập, hỏng cửa này thì sang cửa khác, mỗi cửa một model khác nhau (cùng model
chỉ chống được sự cố hạ tầng, không chống được model trả rác). Đọc khối chú
thích đầu tệp đó trước khi đụng vào — trong đó ghi lại một lỗi câm: **cửa thứ
hai nuốt mất vai `system`**, nên phải gộp chỉ dẫn vào tin nhắn người dùng
(`foldSystemIntoUser`). Thêm cửa mới thì phải **đo**, đừng tin là tương thích.

---

## 3. Bản đồ mã nguồn

```
app/                      route (expo-router, file-based)
  _layout.tsx             providers, font, AppShell, PageTransition
  index.tsx               điều hướng: lần đầu → /intro, đã học → /dashboard
  intro.tsx               trang chủ giới thiệu (hero nền lưới sáng)
  dashboard.tsx           Tổng quan — buổi học hôm nay
  api/*+api.ts            25 endpoint chạy server (nơi duy nhất thấy khoá)
src/
  components/ui/          Card, Button, Badge, Icon, ProgressBar, StatCard...
  components/layout/      AppShell, Sidebar, Screen, Grid, LightHero, GridBackdrop
  components/motion/      Motion.tsx — PageTransition và các primitive chuyển cảnh
  components/reader/      HoverGloss, WordPopover — lõi của màn đọc song ngữ
  navigation/nav-items.ts KHAI BÁO ĐIỀU HƯỚNG DÙNG CHUNG web + mobile
  services/               logic thuần, không phụ thuộc React — chỗ đặt test
  store/                  Zustand + persist (useStudyStore là trung tâm)
  theme/tokens.ts         màu, bo góc, chữ, bóng, gradient
  data/seed/              nội dung tĩnh (16 MB, xem dưới)
supabase/migrations/      SQL
public/bilingual-dict/    125 tệp từ điển theo bài, tải khi mở bài
docs/                     hồ sơ dự án, tài liệu này
```

**Dữ liệu tĩnh (`src/data/seed/`)** — 16 MB, nạp sẵn để app chạy được offline:
`bodies` 7,7 MB (thân bài đọc) · `bilingual` 4,2 MB (125 bài song ngữ) ·
`vocab-topics` 1,9 MB · `index.json` 1,3 MB · `audio-library` 1,3 MB ·
`sat-rw` 560 KB · `translation-sets` 372 KB · `writing` 88 KB.

**Store nào giữ gì** — `useStudyStore` (nhật ký học theo ngày; nguồn duy nhất
tính điểm và chuỗi ngày) · `useVocabStore` (FSRS) · `useMathStore` ·
`useSentenceStore` · `useWritingStore` · `useRewardStore` (điểm đã tiêu, avatar,
thẻ đóng băng) · `useBillingStore` · `useAuthStore` · `useSyncStore` (đẩy/kéo
Supabase).

**Điều hướng.** Sửa `src/navigation/nav-items.ts` là đủ cho cả sidebar web lẫn
bottom tabs mobile. Sidebar là **thanh biểu tượng rộng cố định 68px**, tên mục
hiện trong thẻ nhỏ khi rê chuột — đừng làm nó bung ngang trở lại (đã thử, mảng
lớn trồi lên che chỗ đang đọc).

---

## 4. Quy ước viết mã trong repo này

Đây không phải sở thích cá nhân; làm khác đi thì mã mới sẽ lạc lõng.

1. **Chú thích viết bằng tiếng Việt và giải thích VÌ SAO, không mô tả cái gì.**
   Mã đã nói nó làm gì rồi. Chú thích tốt trong repo này ghi lại: quyết định
   đánh đổi, cái bẫy đã gặp, kết quả đo được, lý do không chọn cách hiển nhiên.
   Xem `src/services/ai/fallback.ts` hoặc `app/api/leaderboard+api.ts` làm mẫu.
2. **Chữ hiển thị cho người dùng: tiếng Việt.** Tên biến, tên hàm: tiếng Anh.
3. **Test đặt cạnh mã** (`foo.ts` + `foo.test.ts`), chạy bằng `tsx --test`.
   Chỉ test logic thuần trong `src/services/**` và `src/lib/**`; không test
   component.
4. **Logic tính toán không nằm trong màn hình.** Màn hình gọi service. Ví dụ:
   luật đề thi SAT ở `src/services/.../full-test.ts`, luật điểm ở
   `src/services/gamification/points.ts` — cùng một bộ luật chạy cả ở máy người
   dùng lẫn trên máy chủ (`/api/leaderboard`) để số hai nơi khớp nhau.
5. **Dùng token màu ở `src/theme/tokens.ts`**, đừng rải mã màu vào component.
6. **Không thêm phụ thuộc mới** nếu chưa hỏi. Dự án chạy trên cả ba nền tảng,
   nhiều thư viện web thuần sẽ làm vỡ bản mobile.
7. **Message commit tiếng Việt, một dòng tiêu đề nói KẾT QUẢ** (không phải "sửa
   file X"), thân commit nói vì sao.

---

## 5. Mười hai cái bẫy đã trả giá — đọc kỹ

Mỗi mục dưới đây từng ngốn một phiên gỡ lỗi. Đừng gặp lại.

1. **NativeWind + `Pressable`: `style` dạng hàm bị bỏ qua.** Nếu một
   `Pressable` có `className`, thì `style={({ hovered }) => ...}` **không chạy**.
   Triệu chứng: nút không đổi màu khi rê chuột, viền không hiện, mà không có
   lỗi nào. Cách làm đúng: dùng `HoverPressable` (đã có sẵn trong repo) hoặc
   `useState` + `onHoverIn/onHoverOut`.
2. **react-native-web không chuyển tiếp `onMouseEnter`/`onMouseLeave` cho
   `View`.** Chỉ `Pressable` mới nhận `onHoverIn`/`onHoverOut`. Gắn listener
   qua DOM ref cũng từng im lặng không chạy. Muốn hover trên một khối thì bọc
   `Pressable`.
3. **`flexBasis: 0` trong một cột = chiều cao 0.** Đây là nguyên nhân chữ Anh và
   Việt chồng lên nhau trên tablet/điện thoại. `flex-1` chỉ an toàn trong hàng
   ngang; trong cột cao-theo-nội-dung nó co về 0. Xem cách xử lý ở
   `src/components/layout/LightHero.tsx` (bọc thêm một hàng ngang quanh nền).
4. **Reanimated: không dùng `entering=`** trên web — trang trắng. Tự chạy
   animation bằng shared value.
5. **Trùng `id` của gradient trong SVG.** Hai component SVG dùng cùng một id
   gradient thì cái sau ăn màu của cái trước. Sinh id bằng `useId()`.
6. **`\b` của JavaScript không hiểu chữ có dấu.** `\bcâu\b` khớp nhầm cả chữ
   "C" trong "Câu". Dùng `\p{L}` kèm cờ `u`.
7. **Định nghĩa component bên trong hàm render** làm React remount mỗi lần vẽ
   lại — ô nhập liệu mất chữ đang gõ. Đưa lên cấp module.
8. **Phím Enter bị `TextInput` của RN-web nuốt.** Nghe ở pha nổi bọt không nhận
   được. Phải `window.addEventListener('keydown', onKey, true)` (pha bắt).
9. **PowerShell làm hỏng tệp UTF-8.** Đừng sửa mã nguồn bằng
   `Get-Content`/`Set-Content` — tiếng Việt sẽ nát. Dùng công cụ sửa tệp của
   trợ lý, hoặc script Python đọc/ghi với `encoding='utf-8'`.
10. **Heredoc và dấu thoát.** Truyền script qua shell làm mất một lớp `\`.
    Trong script Python sinh mã, dựng dấu gạch chéo bằng `chr(92)`. Script dài
    thì ghi ra tệp rồi chạy, đừng nhét inline.
11. **Chèn/sửa HTML bằng cách khớp thẻ đóng thì ăn mất nội dung.** Chốt bất
    biến "tệp chỉ được dài ra" và kiểm số dòng trước/sau khi ghi.
12. **Dừng tiến trình nền có ống (`| tail`) không giết được tiến trình thật.**
    Nó vẫn chạy và vẫn ghi tệp, làm lẫn dữ liệu mà không báo lỗi gì.

---

## 6. Luật cứng — không được phá

Đây là ràng buộc của chủ dự án, không phải gợi ý.

1. **Không sao chép toàn văn báo có bản quyền**, kể cả khi có dẫn link, kể cả
   khi app cho dùng miễn phí. Mục Đọc báo song ngữ **chỉ** dùng nguồn công khai
   hoặc giấy phép mở: VOA và NASA (public domain), Global Voices (CC BY 3.0),
   Wikinews (CC BY 2.5), Wikipedia (CC BY-SA 4.0 — **bản dịch phải mang cùng
   giấy phép**), và bài tự viết. Đã kiểm và **loại**: The Conversation (CC BY-ND
   cấm dịch), ProPublica (NC-ND). Guardian/NYT/Economist/WSJ/CNN/Healthline/New
   Scientist: không được.
   Mỗi bài phải có dòng dẫn nguồn + giấy phép ở đầu.
2. **Không in, không log, không commit khoá API.** Khoá chỉ sống trong biến môi
   trường và chỉ được đọc ở phía máy chủ.
3. **Đề luyện tập sinh bằng luật, không gọi API.** Bộ sinh đề chạy offline bằng
   mã. AI chỉ dùng cho chấm bài, giải thích, hội thoại.
4. **Phép thử bịt mắt cho đề AI**: che bài đọc đi mà AI vẫn trả lời đúng thì đề
   đó không đo đọc hiểu → loại. Kết quả đo hiện có: 30,3% đề AI trượt phép thử
   này (xem `/observatory`).
5. **Riêng tư trên bảng xếp hạng.** Chỉ hiện tên khi người dùng **tự đặt** một
   cái tên trông như tên người; còn lại là "Học viên ABCD". Khi đăng ký bằng
   email, `display_name` thường bị điền sẵn bằng phần trước dấu `@` — đem lên
   bảng là phát tán email của người khác. Email và id đầy đủ không rời máy chủ.
   Luật này nằm ở `displayableName()` trong `app/api/leaderboard+api.ts`.
6. **Nhiều phiên làm việc dùng chung thư mục này.** Luôn `git status` trước khi
   sửa, và **chỉ `git add` đúng những tệp mình đụng vào** — đừng `git add -A`.
   Hiện đang có việc của phiên khác chưa commit: `app/api/tutor/`,
   `src/services/tutor/`, `scripts/kb-ingest.ts`, và sửa đổi ở `.env.example`,
   `.gitignore`, `package.json`. **Đừng commit hộ, đừng revert.**
7. **Xác nhận trước khi làm việc khó lùi** (xoá dữ liệu, đổi cấu hình Vercel,
   chạy migration trên Supabase thật).

---

## 7. Trạng thái hiện tại

Vừa xong (theo thứ tự thời gian, mới nhất trên cùng):

- `c4a9240` Hero trang Tổng quan dùng chung kiểu nền lưới sáng của trang chủ —
  component mới `src/components/layout/LightHero.tsx`, dùng lại được.
- `0918bcf` Sidebar có mục "Trang chủ" trỏ về `/intro`.
- `bd6f822` Sidebar chỉ còn biểu tượng; thêm trang **Xếp hạng** và **Cửa hàng
  đổi điểm**.
- `6159aa9` Điều hướng chuyển thành cột dọc bên trái, tách nhóm IELTS và SAT.
- `f812201` 125 bài song ngữ (74 tự viết + 51 báo nguồn mở).
- `1ad4cfd` Màn luyện Reading chuyển sang bố cục phòng thi.
- `805894a` Từ điển chi tiết cho các bài song ngữ: 10.064 mục, có phiên âm,
  định nghĩa, ví dụ, từ đồng nghĩa; tách theo bài ở `public/bilingual-dict/`
  (tải một lần khi mở bài, nên tra từ không có độ trễ mạng).

**Luật tính điểm** (`src/services/gamification/points.ts`): 1 điểm/phút học,
0,5 điểm/câu làm, hệ số chuỗi ngày `1 + 0,1 × số ngày` (trần 2), trần 60
điểm/ngày. Xu = tổng điểm trọn đời − đã tiêu. Mọi số đều dẫn xuất từ
`useStudyStore.daily`, không có biến đếm riêng nào để lệch.

**Sức khoẻ**: `npm test` 1848/1848 · `npm run typecheck` sạch · lint sạch ·
production trả 200.

---

## 8. Việc còn dang dở

Xếp theo mức sẵn sàng. Mục 1–3 là mã đã viết xong nhưng **chưa được nối vào
app** — làm xong nhanh và có giá trị ngay.

1. **Trang pháp lý chưa có route.** `src/content/legal/` (điều khoản, bảo mật,
   hoàn tiền) và `src/components/legal/LegalTabs.tsx` đã viết xong nhưng
   **không tệp nào import** và không có `app/legal.tsx`. Cần: tạo route, nối
   vào chân trang và trang thanh toán. Bắt buộc phải có nếu còn bán gói.
2. **Trang liên hệ.** `.env.example` đã có `EXPO_PUBLIC_SUPPORT_EMAIL`,
   `_ZALO`, `_SELLER_NAME`, `_SELLER_ADDRESS`, `_SELLER_TAX_ID`; README nói
   chúng hiện ở `/contact` — nhưng `app/contact.tsx` **không tồn tại**. Quy tắc:
   biến để trống thì chỗ đó im lặng, **không bịa địa chỉ**.
3. **Đo lường chưa bật.** `src/services/analytics/` đã có (`events.ts`,
   `track.ts`, `useAnalytics.ts`, có test) nhưng `app/_layout.tsx` không gọi
   bootstrap, và **chưa có `ConsentBanner`**. Cần: banner đồng ý cookie (không
   khai `EXPO_PUBLIC_META_PIXEL_ID`/`GA4_ID` thì không tải script, không hiện
   banner), rồi bắn `begin_checkout` và `purchase`.
4. **Trang `/books`** cho tủ sách PDF + script tải lên (các cuốn IELTS/SAT đã in
   nằm ở `D:\Claude\tong-hop-sach`).
5. **Gói 3 tháng** — giá 135k / 390k / 1.100k **chưa được chủ dự án chốt**.
   Hỏi trước khi đưa vào bảng giá.
6. **Xác nhận thanh toán SePay tự động** và thông báo MOIT; điền giá trị env cho
   relay YouTube.
7. **Đồng bộ chưa phủ hết store.** `useSyncStore` chưa đẩy/kéo các store
   writing, sentence, reader, mastery — đổi máy là mất phần tiến độ đó.
8. **Sửa tiêu đề trang `/intro`** (đã ghi nhận nhưng chưa làm).
9. **Nợ chất lượng nội dung**: trong 34 bài song ngữ đời đầu, 87% câu hỏi có
   đáp án đúng là phương án **dài nhất** — người học đoán được mà không cần đọc.
   Bộ mới đã có luật chặn (`longestRight <= floor(n*3/8)`), cần chạy lại cho 34
   bài cũ. Đã đề xuất nhưng chủ dự án chưa nhận.

---

## 9. Cách nghiệm thu một thay đổi

Chủ dự án kiểm tra kết quả thật, nên đừng báo xong khi mới viết xong mã.

1. `npm run typecheck` và `npm test` phải sạch.
2. `npm run web`, mở màn vừa sửa **trong trình duyệt**, xem tận mắt. Đo bằng
   JavaScript (`getBoundingClientRect`) khi cần khẳng định về bố cục — đừng
   khẳng định suông là "đã hết chồng chữ".
3. Thử ở khổ hẹp (điện thoại/tablet) nếu có đụng bố cục.
4. Commit chỉ những tệp mình sửa.
5. `npx vercel deploy --prod --yes`, rồi `curl -o /dev/null -w "%{http_code}"`
   vào đúng đường dẫn vừa sửa.
6. Báo cáo trung thực: test trượt thì nói trượt kèm output; bỏ qua bước nào thì
   nói rõ.

---

## 10. Những gì KHÔNG nên làm

- Không làm app mới, không dựng lại từ đầu. ReadUp là app chính, mọi thứ dồn
  vào đây.
- Không đổi `slug`/`bundleIdentifier` (`readup-ielts`) — đổi là đổi cả dự án
  Vercel lẫn danh tính app trên cửa hàng.
- Không refactor diện rộng ngoài phạm vi việc đang làm.
- Không chỉnh cỡ chữ/màu bằng cách sửa CSS rải rác — sửa token.
- Không tự ý bật lại sidebar bung ngang, hay đổi màn đọc song ngữ về một cột.

---

## Đoạn mồi để mở phiên mới

> Tôi đang tiếp quản dự án ReadUp ở `D:\Claude\readup-ielts` (Expo SDK 57 +
> expo-router + NativeWind + Supabase, chạy web trên Vercel). Đọc kỹ
> `docs/ban-giao-chatgpt.md` trước, đặc biệt mục 5 (các bẫy kỹ thuật) và mục 6
> (luật cứng). Việc tiếp theo tôi muốn làm là: **[điền việc]**. Trước khi sửa,
> chạy `git status` để không đụng vào việc của phiên khác, và nói cho tôi biết
> bạn định sửa những tệp nào.
