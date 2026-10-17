import urllib.request
import urllib.parse
import json
import re
import time
import sys
from youtube_transcript_api import YouTubeTranscriptApi

sys.stdout.reconfigure(encoding="utf-8")

yt = YouTubeTranscriptApi()

# Target video IDs to harvest across categories
TARGETS = [
    # --- CNN ---
    {"id": "LaC3IbvbHDQ", "channel": "CNN", "topic": "Thời sự và xã hội", "level": "B2"},
    {"id": "T2tjt2Dk3ng", "channel": "CNN", "topic": "Thời sự và xã hội", "level": "B2"},
    {"id": "O9uWX7BOV8E", "channel": "CNN", "topic": "Thời sự và xã hội", "level": "B2"},
    {"id": "RMdhIekKaiM", "channel": "CNN", "topic": "Thời sự và xã hội", "level": "B2"},

    # --- BBC News ---
    {"id": "eRRiAEdHtDY", "channel": "BBC News", "topic": "Khoa học & Công nghệ", "level": "B2"},
    {"id": "pOm0__wzIJM", "channel": "BBC News", "topic": "Thời sự và xã hội", "level": "B2"},
    {"id": "YANXLDxMh8c", "channel": "BBC News", "topic": "Thời sự và xã hội", "level": "B2"},
    {"id": "KqRMgUN6aIg", "channel": "BBC News", "topic": "Thời sự và xã hội", "level": "B2"},

    # --- Vietnam Today (VTV4) ---
    {"id": "DgxKv5AQuzU", "channel": "Vietnam Today", "topic": "Kinh tế và xã hội", "level": "B1"},
    {"id": "jeDwSHPIqDc", "channel": "Vietnam Today", "topic": "Kinh tế và xã hội", "level": "B1"},
    {"id": "3Bsqs6UnyPA", "channel": "Vietnam Today", "topic": "Việt Nam và thế giới", "level": "B1"},
    {"id": "8e9lQsPRM78", "channel": "Vietnam Today", "topic": "Kinh tế và xã hội", "level": "B1"},

    # --- Podcasts / TED-Ed ---
    {"id": "TeVE4TQPEwM", "channel": "TED-Ed", "topic": "Kiến thức phổ thông", "level": "B1"},
    {"id": "av3zdxYvCp8", "channel": "TED-Ed", "topic": "Kiến thức phổ thông", "level": "B1"},
    {"id": "1uTRlM6MbMo", "channel": "TED-Ed", "topic": "Khoa học", "level": "B2"},

    # --- BBC 6 Minute English (Podcasts) ---
    {"id": "pEO9-iPZQWA", "channel": "BBC Learning English", "topic": "Tiếng Anh hằng ngày", "level": "A2"},
    {"id": "xwseWCSXD3Y", "channel": "BBC Learning English", "topic": "Tiếng Anh hằng ngày", "level": "A2"},
    {"id": "SC_opiKLohg", "channel": "BBC Learning English", "topic": "Khoa học", "level": "B1"},
    {"id": "zl0dwwKhmuM", "channel": "BBC Learning English", "topic": "Công nghệ", "level": "B1"},
]

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

def get_video_metadata(vid, default_channel):
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            return {
                "title": data.get("title", f"Video {vid}").strip(),
                "channel": data.get("author_name", default_channel).strip()
            }
    except Exception as e:
        print(f"oEmbed failed for {vid}: {e}")
        return {"title": f"Video {vid}", "channel": default_channel}

def translate_text(text):
    clean = text.strip()
    if not clean:
        return ""
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=" + urllib.parse.quote(clean)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode("utf-8"))
            parts = [p[0] for p in data[0] if p and p[0]]
            return "".join(parts).strip()
    except Exception as e:
        print(f"Translation failed for '{text[:30]}': {e}")
        return clean

def group_cues(cues, max_words=22, min_words=3, max_sentences=45):
    sentences = []
    buf = []
    start = 0.0
    end = 0.0

    for c in cues:
        c_start = c["start"] if isinstance(c, dict) else c.start
        c_dur = c["duration"] if isinstance(c, dict) else c.duration
        c_text = c["text"] if isinstance(c, dict) else c.text

        # Clean annotations like [Music], [Applause], etc.
        c_text = re.sub(r"\[[^\]]*\]", "", c_text).replace("\n", " ").strip()
        if not c_text:
            continue
        # Skip credit lines
        if re.search(r"^\s*(translator|reviewer|transcriber|subtitles? by|captions? by)\s*:", c_text, re.IGNORECASE):
            continue

        if not buf:
            start = round(c_start, 2)
        end = round(c_start + c_dur, 2)
        buf.append(c_text)

        joined = " ".join(buf)
        ends_punct = bool(re.search(r"[.!?][\"'\)\]]?\s*$", joined))
        too_long = len(joined.split()) >= max_words

        if ends_punct or too_long:
            cleaned = re.sub(r"\s+", " ", joined).strip()
            if len(cleaned.split()) >= min_words:
                sentences.append({"start": start, "end": end, "text": cleaned})
                if len(sentences) >= max_sentences:
                    buf = []
                    break
            buf = []

    if buf and len(sentences) < max_sentences:
        cleaned = re.sub(r"\s+", " ", " ".join(buf)).strip()
        if len(cleaned.split()) >= min_words:
            sentences.append({"start": start, "end": end, "text": cleaned})

    return sentences

def main():
    bilingual_bundle = {
        "videos": [],       # LibraryVideo format
        "prepared": {},     # PreparedVideo format for useVideoTranscriptStore
        "translations": {}  # Record<string, string[]>
    }

    print(f"Starting harvest of {len(TARGETS)} bilingual videos...")

    success_count = 0
    for idx, item in enumerate(TARGETS, 1):
        vid = item["id"]
        print(f"\n[{idx}/{len(TARGETS)}] Harvesting {item['channel']} - {vid}...")
        try:
            # 1. Fetch transcript cues
            cues = yt.fetch(vid)
            if not cues:
                print(f"  ✖ No cues found for {vid}")
                continue

            # 2. Group into sentences
            sentences = group_cues(cues, max_words=20, min_words=3, max_sentences=35)
            if not sentences:
                print(f"  ✖ No sentences after grouping for {vid}")
                continue

            # 3. Get metadata
            meta = get_video_metadata(vid, item["channel"])
            duration = int(sentences[-1]["end"]) if sentences else 180

            video_entry = {
                "id": vid,
                "title": meta["title"],
                "channel": meta["channel"] or item["channel"],
                "level": item["level"],
                "topic": item["topic"],
                "durationSeconds": duration
            }
            bilingual_bundle["videos"].append(video_entry)

            # 4. Translate all sentences
            print(f"  → Translating {len(sentences)} sentences for '{meta['title'][:40]}...'")
            trans_lines = []
            for s_idx, s in enumerate(sentences):
                vi = translate_text(s["text"])
                trans_lines.append(vi)
                time.sleep(0.05) # gentle pacing

            bilingual_bundle["prepared"][vid] = {
                "videoId": vid,
                "sentences": sentences,
                "autoGenerated": True,
                "preparedAt": "2026-10-17T09:00:00.000Z",
                "doneCount": 0
            }
            bilingual_bundle["translations"][vid] = trans_lines

            success_count += 1
            print(f"  ✔ Successfully harvested {vid}: {len(sentences)} bilingual sentences.")

        except Exception as e:
            print(f"  ✖ Error harvesting {vid}: {e}")

    out_path = "D:/Claude/readup-ielts/src/data/seed/bilingual-videos.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(bilingual_bundle, f, ensure_ascii=False, indent=2)

    print(f"\n==========================================")
    print(f"HARVEST FINISHED: {success_count}/{len(TARGETS)} videos saved to {out_path}!")
    print(f"==========================================")

if __name__ == "__main__":
    main()
