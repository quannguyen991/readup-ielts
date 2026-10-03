"""Create local auditions using the project's existing Gemini credentials."""
import argparse
import base64
import io
import json
import pathlib
import subprocess
import urllib.error
import urllib.request
import wave


def load_keys():
    folder = pathlib.Path("D:/Claude/.secrets")
    keys = []
    for name in ("google-api-keys.txt", "google-api-2.key", "google-api.key"):
        path = folder / name
        if path.exists():
            keys.extend(x.strip() for x in path.read_text().splitlines() if x.strip())
    return list(dict.fromkeys(keys))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--voices", default="Aoede,Sulafat")
    parser.add_argument("--model", default="gemini-2.5-flash-preview-tts")
    args = parser.parse_args()
    root = pathlib.Path(__file__).resolve().parents[2]
    output = root / "tmp-art/voice-samples"
    output.mkdir(parents=True, exist_ok=True)
    text = ("Read in a natural, clear English voice at a comfortable learning pace. "
            "Say only: Pollution. Emission. Biodiversity. Sustainable development. "
            "Small changes can make a big difference to our environment.")
    for voice in args.voices.split(","):
        payload = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
        generated = False
        for number, key in enumerate(load_keys(), 1):
            request = urllib.request.Request(
                f"https://generativelanguage.googleapis.com/v1beta/models/{args.model}:generateContent",
                json.dumps(payload).encode(), {"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                result = json.load(urllib.request.urlopen(request, timeout=120))
            except urllib.error.HTTPError as error:
                # Do not print response bodies or credential-bearing request URLs.
                print(f"{voice}: key #{number}, HTTP {error.code}", flush=True)
                if error.code in (400, 403, 429):
                    continue
                raise SystemExit("Speech provider failed") from None
            except Exception:
                raise SystemExit("Speech provider connection failed") from None
            parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            audio = next((p["inlineData"]["data"] for p in parts if "inlineData" in p), None)
            if not audio:
                print(f"{voice}: provider returned no audio", flush=True)
                continue
            raw = base64.b64decode(audio)
            if not raw.startswith(b"RIFF"):
                buffer = io.BytesIO()
                with wave.open(buffer, "wb") as wav:
                    wav.setnchannels(1)
                    wav.setsampwidth(2)
                    wav.setframerate(24000)
                    wav.writeframes(raw)
                raw = buffer.getvalue()
            wav = output / (voice.lower() + ".wav")
            wav.write_bytes(raw)
            mp3 = output / (voice.lower() + ".mp3")
            subprocess.run(["ffmpeg", "-v", "error", "-threads", "1", "-filter_threads", "1",
                "-y", "-i", str(wav), "-af", "loudnorm=I=-18:TP=-2:LRA=7", str(mp3)], check=True)
            print(f"{voice}: {mp3}", flush=True)
            generated = True
            break
        if not generated:
            print(f"{voice}: no quota available for this model", flush=True)


if __name__ == "__main__":
    main()
