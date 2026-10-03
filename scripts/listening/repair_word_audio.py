"""Recover faded MP3s from saved WAVs, without an API call or guessed labels.

An old segment must reproduce an indexed MP3 byte for byte before replacement.
Run --apply to replace verified matches; otherwise only write an audit report.
"""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor

from word_audio import render_word, split_words, validate_word

ROOT = pathlib.Path(__file__).resolve().parents[2]
OLD_FILTER = (
    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
    "afade=t=in:d=0.01,afade=t=out:d=0.04"
)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    out = ROOT / "public/audio/words/kore"
    backup = ROOT / "tmp-art/word-audio-backup"
    index = json.loads((out / "index.json").read_text(encoding="utf-8"))
    by_hash = {}
    for word, name in index.items():
        path = backup / name if (backup / name).exists() else out / name
        if path.exists():
            by_hash.setdefault(digest(path), []).append((word, name))
    batches = [json.loads(x) for x in (out / "_batches.log").read_text().splitlines() if x]
    report = {"applied": args.apply, "repaired": [], "unmatched_raw": []}
    saved_report = ROOT / "tmp-art/word-audio-repair.json"
    if args.apply and saved_report.exists():
        previous = json.loads(saved_report.read_text(encoding="utf-8"))
        if previous.get("applied"):
            report = previous
    repaired = {x["file"] for x in report["repaired"]}
    for raw in sorted((ROOT / "tmp-art/raw-words").glob("Kore-*.wav")):
        with tempfile.TemporaryDirectory() as temp:
            temp = pathlib.Path(temp)
            wav = temp / "normalized.wav"
            subprocess.run([
                "ffmpeg", "-v", "error", "-threads", "1", "-filter_threads", "1", "-y", "-i", str(raw), "-af",
                "loudnorm=I=-18:TP=-2:LRA=7", "-ar", "24000", "-ac", "1", str(wav),
            ], check=True)
            duration = float(subprocess.run([
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "csv=p=0", str(wav),
            ], capture_output=True, text=True, check=True).stdout)
            sizes = {b["n"] for b in batches if abs(b["dur"] - duration) <= 0.06}
            # A crashed generator may have saved raw/MP3s without its batch log.
            if not sizes:
                sizes = {60}
            found = 0
            for n in sizes:
                segments, _, _ = split_words(wav, n)
                if not segments:
                    continue

                def recover(item):
                    i, (start, end) = item
                    old = temp / f"old-{n}-{i}.mp3"
                    render_word(wav, start, end, old, OLD_FILTER)
                    matches = by_hash.get(digest(old), [])
                    # Identical clips under different labels are ambiguous: skip.
                    if len(matches) != 1:
                        return None
                    word, name = matches[0]
                    if name in repaired:
                        return None
                    fixed = temp / f"fixed-{n}-{i}.mp3"
                    render_word(wav, start, end, fixed)
                    stats = validate_word(fixed)
                    return word, name, fixed, stats, start, end

                with ThreadPoolExecutor(max_workers=6) as pool:
                    for match in pool.map(recover, enumerate(segments)):
                        if not match:
                            continue
                        word, name, fixed, stats, start, end = match
                        if name in repaired:
                            continue
                        if args.apply:
                            backup.mkdir(parents=True, exist_ok=True)
                            if not (backup / name).exists():
                                shutil.copy2(out / name, backup / name)
                            # Replace atomically; dev-server readers may hold the old file.
                            staged = out / (name + ".repair")
                            shutil.copyfile(fixed, staged)
                            for attempt in range(5):
                                try:
                                    staged.replace(out / name)
                                    break
                                except OSError:
                                    if attempt == 4:
                                        raise
                                    time.sleep(0.2)
                        repaired.add(name)
                        found += 1
                        report["repaired"].append({"word": word, "file": name,
                            "raw": raw.name, "start": start, "end": end, **stats})
                        saved_report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            if not found:
                report["unmatched_raw"].append(raw.name)
            print(f"{raw.name}: {found} verified matches; total {len(repaired)}", flush=True)
            report["not_recovered"] = [w for w, f in index.items() if f not in repaired]
            (ROOT / "tmp-art/word-audio-repair.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Recovered {len(repaired)}/{len(index)}; report: tmp-art/word-audio-repair.json")


if __name__ == "__main__":
    main()
