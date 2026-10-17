import os
import sys
import time
import pathlib
import soundfile as sf

sys.stdout.reconfigure(encoding="utf-8")
os.environ["HF_HOME"] = "D:/hf_cache"

from f5_tts.api import F5TTS

ROOT = pathlib.Path(__file__).resolve().parents[1]
ref_audio = ROOT / "public/audio/lines/aoede/building-community-resilience-is-crucial-39182c.mp3"
ref_text = "building community resilience is crucial for coping with natural disasters."
test_text = "Success in IELTS Speaking, requires natural fluency, rich vocabulary, and confident pronunciation."
out_wav = ROOT / "public/audio/comparison/aoede_cloned_v3.wav"

ckpt_file = r"D:\hf_cache\hub\models--SWivid--F5-TTS\snapshots\84e5a410d9cead4de2f847e7c9369a6440bdfaca\F5TTS_v1_Base\model_1250000.safetensors"
vocoder_path = r"D:\hf_cache\hub\models--charactr--vocos-mel-24khz\snapshots\0feb3fdd929bcd6649e0e7c5a688cf7dd012ef21"

print(f"Loading F5-TTS with calm reference audio: {ref_audio.name}...")
f5tts = F5TTS(ckpt_file=ckpt_file, vocoder_local_path=vocoder_path, device="cuda")

print("Generating v3 (Calm, dictionary stress, deliberate pacing)...")
t0 = time.time()
wav, sr, spect = f5tts.infer(
    ref_file=str(ref_audio),
    ref_text=ref_text,
    gen_text=test_text,
    file_wave=str(out_wav),
    nfe_step=64,
    cfg_strength=1.8,
    speed=0.82
)

info = sf.info(str(out_wav))
print(f"Successfully generated v3 in {time.time() - t0:.2f}s!")
print(f"Duration: {info.duration:.2f} seconds (much calmer and steadier!)")
print(f"File size: {out_wav.stat().st_size} bytes")
