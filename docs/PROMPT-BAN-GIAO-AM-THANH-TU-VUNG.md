# Cập nhật 03/10/2026 — đã sửa âm thanh, người dùng chọn Aoede

Người dùng đã nghe mẫu và chọn **Aoede** làm giọng mặc định, đồng thời cho phép triển khai Vercel. Yêu cầu Kore trong nội dung bàn giao cũ bên dưới đã được thay thế. Cấu hình duy nhất hiện tại: `src/data/pronunciation-voice.json`.

Nguyên nhân chính: `afade=t=out:d=0.04` không có thời điểm bắt đầu, làm MP3 gần như im lặng sau 40 ms. Đã sửa bộ cắt âm thanh, khôi phục 1.948 clip Kore từ WAV gốc và tạo 2.061 clip Aoede đã kiểm tra. Xem [báo cáo sửa lỗi](./KIEM-THU-AM-THANH-AOEDE.md) trước khi sửa tiếp.

---

# Prompt bàn giao — Sửa lỗi "màn Học từ vựng không tự đọc từ" (Band 9)

> Dán nguyên văn tệp này cho GPT/Codex. Repo: `D:\Claude\readup-ielts` (Expo SDK 57 web, expo-router, react-native-web, Zustand). Đọc `AGENTS.md` và `docs/BAN-GIAO-CODEX.md` trước.

## 1. Việc cần làm
Ở màn **Học từ vựng** (`/vocabulary/topic/<slug>/learn`, file `app/vocabulary/topic/[slug]/learn.tsx`), từ tiếng Anh phải **tự được đọc to** mỗi khi nó hiện ra (hoặc lộ ra cùng đáp án) — bằng **MỘT giọng duy nhất: Gemini "Kore"** (clip mp3 dựng sẵn). Hiện người dùng **nghe được hiệu ứng âm thanh game nhưng KHÔNG nghe được giọng tự đọc**, trên **Chrome máy tính**, dù đã deploy 3 bản sửa. Bạn cần tìm ra nguyên nhân thật và sửa đến khi nghe được, có bằng chứng.

## 2. Luật chủ dự án (không được phá)
- Chỉ **một giọng**: Kore. Không giọng nam, không Anh–Anh/Anh–Mỹ, không bản ghi âm người thật của từ điển (gstatic / dictionaryapi). Giọng máy của trình duyệt chỉ là **dự phòng tạm** cho từ chưa có clip; khi đủ clip thì bỏ.
- Tự phát âm là nội dung học, **không phụ thuộc** tắt/bật âm thanh game (`game.sound`).
- Không dán/ghi khoá API vào mã, chat hay báo cáo. Khoá Gemini nằm ở `D:\Claude\.secrets\` (`google-api-keys.txt`, `google-api-2.key`, `google-api.key`) — ngoài repo.
- Nhiều phiên cùng sửa thư mục này: `git status` trước khi sửa; chỉ commit tệp của mình. Deploy từ **git worktree sạch** (xem `docs/BAN-GIAO-CODEX.md` mục 3): `git worktree add -f ../readup-deployN HEAD`, `cp -r .vercel ../readup-deployN/`, `npx vercel deploy --prod --yes` (build ~13 phút), rồi `git worktree remove --force`.
- Test phải xanh: `npm test` và `npx tsc --noEmit` (phần Lịch sử đang có lỗi/ test đỏ của phiên khác, bỏ qua).

## 3. Cách tự phát âm đang hoạt động (đọc code theo thứ tự này)
1. `app/vocabulary/topic/[slug]/learn.tsx` ~dòng 208–220: tính `speakWhen = autoSpeakWhen({ kind, dir, flipped, revealed })` (luật ở `src/services/vocab/auto-speak.ts`), rồi `useAutoPronounce(shownWord, speakKey)`.
   - Thẻ chiều Anh→Việt: đọc ngay khi hiện (`show`). Thẻ Việt→Anh: đọc khi lật (`flip`). Câu mà đề chưa hiện từ Anh (Việt→Anh, điền chỗ trống, gõ từ): đọc khi đáp án lộ ra (`reveal`).
2. `src/services/audio/pronounce.ts`:
   - `useAutoPronounce` → `setTimeout(150ms)` → `autoSpeak(word, id)` (chống đọc trùng trong 1,5 giây; chỉ xét công tắc `learnSettings.autoPronounce`) → `pronounce(word, { auto: true })`.
   - `pronounce()`: `stopPronounce()` (tăng `token`, pause `current`, `Speech.stop()`), rồi `clips.find('kore', word)` (đọc `/audio/words/kore/index.json`, thư viện ở `pronounce-core.ts`) → `playClipUrl(url)`; nếu `NotAllowedError` thì `retryOnGesture` (phát lại ở lần chạm/phím đầu); nếu không có clip hoặc lỗi → `tts()` giọng máy.
   - `playClipUrl()`: máy tính tạo `new Audio(url)` mới mỗi lần; iPhone/iPad dùng một phần tử `shared` đã "mở khoá" bằng cử chỉ đầu (`armAudioUnlock`). Hết 6 giây không `play()` được → `TimeoutError` (không đánh dấu clip hỏng); `AbortError` cũng không đánh dấu.
3. `src/components/vocab/study/StudyKit.tsx` `speak()` giờ chỉ gọi `pronounce()` (bỏ nhánh giọng máy theo `voice`).
4. Tiếng hiệu ứng game là mã Web Audio riêng ở `src/services/audio/sfx.ts` — **nghe được**, nên Web Audio/loa/âm lượng hệ thống KHÔNG hỏng; vấn đề nằm riêng ở đường `HTMLAudioElement` / `speechSynthesis`.

## 4. Đã làm và đã kiểm chứng (đừng làm lại)
- Nguyên nhân đầu tiên (đã sửa, commit `065360d`): `autoSpeak` từng `return false` khi `isSfxMuted()`; Chrome của người dùng có `readup:game` → `state.sound = false` nên mọi tiếng đọc bị nuốt im lặng. Đã bỏ điều kiện này.
- Đã sửa (`1739130`, `60461f4`): không đánh dấu clip hỏng khi bị ngắt/quá giờ; phần tử audio mới mỗi lần trên máy tính; mở khoá cho iOS.
- Đã bỏ giọng nam/Anh–Anh và bản ghi âm người thật (`LearnSettingsSheet.tsx`, `voice.ts`, `pronounce.ts`).
- Clip Kore: **1726 / 2064 từ (83,6%)** trong `public/audio/words/kore/` (đo bằng `npx tsx scripts/vocab/audio-coverage.ts`). 338 từ còn lại tạm đọc bằng giọng máy. Script tạo: `scripts/listening/gen_word_audio.py --voice Kore --batch 60` (xoay khoá, tự chia nhỏ lô khi API trả 400); tác vụ Windows `Band9-DailyVoiceAudio` chạy 15:30 mỗi ngày. Hạn mức Gemini TTS miễn phí hết hôm nay (≈14:00 giờ VN reset).
- Bản đang chạy: `https://band9-ielts.vercel.app` (đã deploy `60461f4`).
- Test đơn vị liên quan xanh: `npx tsx --test src/services/audio/*.test.ts src/services/vocab/auto-speak.test.ts`.

## 5. Điều CHƯA biết (đây là chỗ phải điều tra)
Tôi chưa từng **nghe/đo được tiếng thật trong một tab đang hiển thị**: tab Chrome tôi điều khiển luôn có `document.visibilityState === 'hidden'`, trình duyệt trì hoãn media ở tab ẩn nên mọi đo đạc chỉ cho thấy lệnh `play()` được gọi, không cho thấy âm thanh thật sự chạy. Dữ kiện đo được trên bản deploy (tab ẩn):
- Với "Âm thanh game" tắt, lật thẻ/qua thẻ có gọi `HTMLMediaElement.play()` với `words/kore/<từ>-xxxx.mp3`; đôi lần ngay sau đó có `AbortError`, hoặc sau ~2,5 giây có `speechSynthesis.speak("<từ>")` (nghĩa là clip không bắt đầu phát kịp → rơi xuống giọng máy). Các số 2,5 giây này là của bản cũ; bản `60461f4` đã nâng lên 6 giây nhưng **chưa đo lại**.
- Với "Âm thanh game" bật, người dùng báo vẫn không nghe tự đọc (hiệu ứng thì nghe được).
- Thẻ đầu tiên khi vừa mở trang: Chrome chặn tự phát tới khi có cử chỉ (`NotAllowedError` → `retryOnGesture`).

Các giả thuyết cần loại trừ lần lượt (làm trong **Chrome thật, tab đang hiển thị**, DevTools mở):
1. `play()` có resolve không? Gắn log vào `playClipUrl` (resolve / reject + `a.readyState`, `a.error`, `networkState`, `paused`, `currentTime`) và sự kiện `playing/ended/error/stalled` của phần tử. Kiểm tra `GET /audio/words/kore/index.json` và mp3 trả 200 đúng `Content-Type: audio/mpeg`, có `Accept-Ranges`; thử mở thẳng URL mp3 xem nghe được không (loại trừ clip hỏng/đầu im lặng quá dài do cắt `silenceremove`).
2. Chu kỳ gọi chồng nhau làm tự huỷ: `useAutoPronounce` có thể chạy 2 lần (React StrictMode / effect), `stopPronounce()` của lần sau pause lần trước; kiểm tra `speakKey`, `lastAuto` dedupe, và xem còn chỗ nào khác gọi `stopPronounce()`/`Speech.stop()`/`speechSynthesis.cancel()` ngay sau khi hiện từ (ví dụ `useEffect` dọn dẹp màn hình, SFX `playSfx`, effect "chiều nghe" ở `learn.tsx` ~dòng 206).
3. Hàm `clips.find()` (`pronounce-core.ts` `createClipLibrary`) trả `null` vì khoá chuẩn hoá (`clipKey`) không khớp `index.json` → rơi xuống `tts`. Kiểm tra với vài từ (`pollution`, `emission`) và từ có hoa/thường, dấu cách.
4. `autoPronounce` bị tắt trong `learnSettings` đã lưu của người dùng, hoặc `autoSpeakWhen` trả `null` cho loại thẻ họ đang gặp (kiểm tra `dir`/`kind` thực tế của từng thẻ).
5. Giọng máy dự phòng im vì thiết bị không có giọng tiếng Anh hoặc `englishVoice()` chọn sai định danh; thử `speechSynthesis.getVoices()` trong Chrome của người dùng.
6. Autoplay policy: kiểm tra `navigator.userActivation.hasBeenActive` tại thời điểm `play()`; trang mở bằng điều hướng cứng thì chưa có cử chỉ.
7. Một lớp phủ/tiện ích Chrome (chặn media tự phát, "Mute site") — hỏi người dùng nếu cần, xem biểu tượng loa trên tab.

## 6. Tiêu chí xong (phải có bằng chứng, không chỉ "đã gọi play")
- Trong Chrome thật (tab hiển thị, âm lượng bật) vào `/vocabulary/topic/environment/learn`: mỗi thẻ Anh→Việt mới hiện ra thì **nghe được giọng Kore đọc từ trong ≤ ~0,5 giây**; thẻ Việt→Anh đọc khi lật; câu điền chỗ trống/gõ từ đọc khi lộ đáp án. Qua 10 thẻ liên tiếp, kể cả bấm nhanh, không thẻ nào im. Chụp/ghi log cho thấy sự kiện `playing` của phần tử audio với đúng URL `…/kore/…mp3` và không có `speechSynthesis.speak` (trừ từ chưa có clip).
- Hoạt động cả khi "Âm thanh game" tắt và khi bật.
- Thêm test hồi quy cho phần logic thuần có thể test được (ví dụ chọn nguồn phát, không đánh dấu clip hỏng khi bị ngắt/quá giờ).
- Báo cáo trung thực: cái gì đã nghe/đo thật, cái gì chỉ suy ra.

## 7. Việc phụ (sau khi nghe được)
- Hoàn tất clip Kore cho 338 từ còn lại (chạy `gen_word_audio.py` khi có hạn mức), commit `public/audio/words/kore/` + deploy; sau đó **bỏ nhánh giọng máy dự phòng** để thật sự chỉ còn một giọng.
- Màn Chính tả (`dictation.tsx`) còn ô chọn giọng máy nhưng đã vô hiệu; nên gỡ ô đó.
