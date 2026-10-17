import os
import sys
import json
import time
import pathlib
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# Ensure huggingface models download to drive D to preserve drive C space
os.environ["HF_HOME"] = "D:/hf_cache"

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public/audio/comparison"
OUT_DIR.mkdir(parents=True, exist_ok=True)

REF_AUDIO = ROOT / "public/audio/aoede_reference/sample_3_long.mp3"
REF_TEXT = "do you prefer having a few close friends or lots of friends?"

TEST_TEXT = "Success in IELTS Speaking requires natural fluency, rich vocabulary, and confident pronunciation."

print("=" * 60)
print("BẮT ĐẦU TẠO BỘ SO SÁNH GIỌNG GỐC VÀ GIỌNG CLONE CỦA AOEDE")
print("=" * 60)
print(f"Câu thử nghiệm: \"{TEST_TEXT}\"\n")

# 1. TẠO GIỌNG GỐC AOEDE (Google Gemini TTS)
orig_wav_path = OUT_DIR / "aoede_original.wav"
print("[1/2] Đang tạo Giọng Gốc Aoede (Google Gemini TTS)...")
t0 = time.time()
try:
    req = urllib.request.Request(
        "http://localhost:8081/api/speaking/voice",
        data=json.dumps({"text": TEST_TEXT}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        orig_bytes = res.read()
        orig_wav_path.write_bytes(orig_bytes)
        print(f" -> Đã tạo Giọng Gốc: {orig_wav_path.name} ({len(orig_bytes)} bytes, {time.time() - t0:.2f}s)")
except Exception as e:
    print(f"Lỗi tạo giọng gốc: {e}")
    sys.exit(1)

# 2. TẠO GIỌNG CLONE AOEDE (F5-TTS trên GPU RTX 3050 Ti)
cloned_wav_path = OUT_DIR / "aoede_cloned.wav"
print("\n[2/2] Đang tải mô hình F5-TTS và Clone Giọng Aoede trên GPU...")
t1 = time.time()
try:
    import torch
    from f5_tts.api import F5TTS

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f" -> Thiết bị chạy mô hình: {device.upper()}")
    ckpt_file = r"D:\hf_cache\hub\models--SWivid--F5-TTS\snapshots\84e5a410d9cead4de2f847e7c9369a6440bdfaca\F5TTS_v1_Base\model_1250000.safetensors"
    vocoder_path = r"D:\hf_cache\hub\models--charactr--vocos-mel-24khz\snapshots\0feb3fdd929bcd6649e0e7c5a688cf7dd012ef21"
    f5tts = F5TTS(ckpt_file=ckpt_file, vocoder_local_path=vocoder_path, device=device)

    print(" -> Đang tiến hành suy luận (Inference Flow-matching)...")
    wav, sr, spect = f5tts.infer(
        ref_file=str(REF_AUDIO),
        ref_text=REF_TEXT,
        gen_text=TEST_TEXT,
        file_wave=str(cloned_wav_path)
    )
    print(f" -> Đã tạo Giọng Clone: {cloned_wav_path.name} ({cloned_wav_path.stat().st_size} bytes, {time.time() - t1:.2f}s)")
except Exception as e:
    print(f"Lỗi tạo giọng clone: {e}")
    sys.exit(1)

# 3. TẠO GIAO DIỆN WEB PLAYER SO SÁNH
html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>So Sánh Giọng Gốc Aoede vs Giọng Clone F5-TTS</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
    body {{ background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }}
    .card {{ background: #1e293b; border-radius: 24px; border: 1px solid #334155; max-width: 860px; width: 100%; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }}
    .badge {{ display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }}
    h1 {{ font-size: 28px; font-weight: 800; margin-bottom: 12px; background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
    p.desc {{ color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }}
    .test-box {{ background: #0f172a; border-radius: 16px; border: 1px solid #334155; padding: 20px; margin-bottom: 32px; }}
    .test-label {{ font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; margin-bottom: 8px; }}
    .test-sentence {{ font-size: 18px; color: #f1f5f9; font-weight: 600; font-style: italic; line-height: 1.5; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }}
    .voice-col {{ background: #0f172a; border-radius: 20px; padding: 24px; border: 2px solid transparent; transition: all 0.3s; position: relative; }}
    .voice-col.orig {{ border-color: rgba(56, 189, 248, 0.4); }}
    .voice-col.clone {{ border-color: rgba(168, 85, 247, 0.4); }}
    .tag {{ font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 12px; }}
    .orig .tag {{ background: #0284c7; color: #fff; }}
    .clone .tag {{ background: #9333ea; color: #fff; }}
    .voice-title {{ font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #fff; }}
    .voice-subtitle {{ font-size: 13px; color: #94a3b8; margin-bottom: 20px; }}
    audio {{ width: 100%; border-radius: 8px; margin-bottom: 16px; outline: none; }}
    .details {{ font-size: 13px; color: #64748b; line-height: 1.6; }}
    .details li {{ margin-bottom: 4px; list-style: none; display: flex; justify-content: space-between; }}
    .details strong {{ color: #cbd5e1; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🎙️ Band 9 IELTS Voice Evaluation</div>
    <h1>So Sánh Trực Tiếp: Giọng Gốc Aoede vs Giọng Clone</h1>
    <p class="desc">Cùng một câu tiếng Anh mẫu IELTS Speaking, được thu và tổng hợp bởi 2 công nghệ khác nhau để bạn thẩm định và đánh giá độ chân thật, ngữ điệu và sắc thái âm thanh.</p>

    <div class="test-box">
      <div class="test-label">Câu kiểm tra phát âm (Test Sentence):</div>
      <div class="test-sentence">“{TEST_TEXT}”</div>
    </div>

    <div class="grid">
      <!-- Voice Gốc -->
      <div class="voice-col orig">
        <span class="tag">Bản Gốc 100%</span>
        <h2 class="voice-title">Giọng Gốc Aoede</h2>
        <p class="voice-subtitle">Google DeepMind Gemini TTS (24.000 Hz Studio)</p>
        <audio controls src="/audio/comparison/aoede_original.wav"></audio>
        <ul class="details">
          <li><span>Nguồn phát:</span> <strong>Google Cloud AI</strong></li>
          <li><span>Đặc tính:</span> <strong>Tự nhiên, nhẹ nhàng, nguyên bản</strong></li>
          <li><span>Tần số lấy mẫu:</span> <strong>24.000 Hz Mono</strong></li>
        </ul>
      </div>

      <!-- Voice Clone -->
      <div class="voice-col clone">
        <span class="tag">AI Clone Cục Bộ</span>
        <h2 class="voice-title">Giọng Clone F5-TTS</h2>
        <p class="voice-subtitle">Mô hình F5-TTS Flow-Matching trên RTX 3050 Ti</p>
        <audio controls src="/audio/comparison/aoede_cloned.wav"></audio>
        <ul class="details">
          <li><span>Nguồn phát:</span> <strong>F5-TTS Offline (Zero-Shot)</strong></li>
          <li><span>Đặc tính:</span> <strong>Học âm sắc từ mẫu Aoede 10s</strong></li>
          <li><span>Tần số lấy mẫu:</span> <strong>24.000 Hz</strong></li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
"""
(OUT_DIR / "index.html").write_text(html_content, encoding="utf-8")
print("\n" + "=" * 60)
print("ĐÃ HOÀN TẤT VÀ TẠO TRANG SO SÁNH!")
print(f"1. Giọng gốc: {orig_wav_path}")
print(f"2. Giọng clone: {cloned_wav_path}")
print(f"3. Trang nghe thử: http://localhost:8081/audio/comparison/index.html")
print("=" * 60)
