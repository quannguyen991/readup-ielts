# Hướng Dẫn Clone Giọng Aoede & Chạy Hoàn Toàn Offline (Không Tốn API)

Tài liệu này cung cấp 2 giải pháp hoàn chỉnh giúp bạn sử dụng giọng **Aoede** bao nhiêu tùy thích mà **hoàn toàn không lo tốn phí API hay bị giới hạn lượt gọi (Rate-limit)**.

---

## Giải Pháp 1: Tự Động Lưu Vĩnh Viễn Trên Ổ Cứng (Persistent Disk Cache) - *ĐÃ KÍCH HOẠT SẴN*

Hệ thống backend của Band 9 tại `src/services/speaking/voice-server.ts` đã được tích hợp bộ nhớ đệm ổ đĩa vĩnh viễn:
1. **Chỉ gọi API đúng 1 lần duy nhất trong đời** cho mỗi câu/từ vựng mới.
2. File âm thanh WAV 24kHz của Aoede được lưu trực tiếp vào thư mục:
   `D:\Claude\readup-ielts\public\audio\cache\aoede/<sha256>.wav`
3. Từ lần thứ 2 trở đi, hệ thống phát ngay lập tức từ ổ đĩa (chỉ mất **0.024 giây** / 24 mili-giây), **0 API calls**, hoạt động cả khi máy mất mạng Internet.

### Sinh sẵn hàng loạt (Batch Pre-generate)
Khi bạn có một danh sách bài đọc, câu luyện nói hoặc từ vựng muốn chuẩn bị sẵn:
```bash
python scripts/batch_pregenerate_aoede.py danh_sach_cau.txt
```
Script sẽ tự động quét, tải và lưu toàn bộ file âm thanh vào ổ đĩa. Khi vào app học, âm thanh phát tức thì mà không cần mạng.

---

## Giải Pháp 2: Clone Giọng Aoede Bằng AI Chạy Cục Bộ (Local Voice Cloning trên RTX 3050)

Máy tính của bạn có card đồ họa rời **NVIDIA GeForce RTX 3050 Laptop GPU (4GB VRAM)**. Bạn có thể sử dụng mô hình AI Voice Cloning mã nguồn mở như **F5-TTS** hoặc **XTTS-v2** để clone giọng Aoede chạy 100% offline.

### 1. File mẫu âm thanh tham chiếu của Aoede (Reference Audio)
Đã được chuẩn bị sẵn tại thư mục:
`public/audio/aoede_reference/`
- `sample_1_short.mp3`: 14.2 KB — *"what is the weather like where you live at this time of year?"*
- `sample_2_medium.mp3`: 16.2 KB — *"which room in your home do you spend the most time in, and why?"*
- `sample_3_long.mp3`: 37.3 KB — *"do you prefer having a few close friends or lots of friends?"*

### 2. Cách chạy Voice Clone Offline với F5-TTS
F5-TTS là mô hình Non-autoregressive Voice Cloning hàng đầu hiện nay, chỉ cần 5-10 giây audio mẫu là có thể clone giọng chính xác:

1. Cài đặt môi trường:
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu124
pip install f5-tts
```

2. Lệnh sinh âm thanh giọng Aoede offline:
```bash
f5-tts_infer-cli \
  --model "F5-TTS" \
  --ref_audio "public/audio/aoede_reference/sample_3_long.mp3" \
  --ref_text "do you prefer having a few close friends or lots of friends?" \
  --gen_text "Your English sentence to generate here" \
  --output_dir "output_audio"
```

3. Giao diện trực quan (WebUI):
```bash
f5-tts_infer-gradio
```
Mở trình duyệt tại `http://localhost:7860`, tải file `sample_3_long.mp3` lên và gõ bất kỳ văn bản nào để nghe giọng Aoede sinh trực tiếp trên máy của bạn.
