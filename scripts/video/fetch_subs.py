"""Lấy phụ đề tiếng Anh cho các video trong thư viện (src/data/seed/video-library/index.json) bằng yt-dlp.

Ra:   public/video-subs/<id>.json   {"videoId","source":"manual|auto","lang","sentences":[{start,end,text}]}
      public/video-subs/_state.json {id: "ok" | "none" | "err"}  -> chạy lại thì bỏ qua id đã xử lý (trừ "err")
      src/data/seed/video-subs-index.json  danh sách id đã có phụ đề (nhỏ, để giao diện đánh dấu "có phụ đề")

Chạy:  PYTHONUTF8=1 <venv có yt_dlp>\\python scripts/video/fetch_subs.py [--limit 50] [--sleep 1.5]

Ưu tiên phụ đề do người làm (có dấu câu); không có thì dùng phụ đề tự động và cắt dòng theo quãng nghỉ.
Chỉ lấy tiếng Anh: bản dịch tự động của YouTube bị giới hạn tốc độ (429) nên bỏ — bản dịch Việt làm theo yêu cầu trong app.
Thứ tự: xoay vòng giữa các kênh để dừng giữa chừng vẫn phủ đều các kênh và trình độ.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request
from collections import defaultdict

import yt_dlp

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SEED = os.path.join(ROOT, 'src', 'data', 'seed', 'video-library', 'index.json')
BIL = os.path.join(ROOT, 'src', 'data', 'seed', 'bilingual-videos.json')
OUT = os.path.join(ROOT, 'public', 'video-subs')
INDEX = os.path.join(ROOT, 'src', 'data', 'seed', 'video-subs-index.json')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'


def clean(t: str) -> str:
    t = re.sub(r'\[[^\]]*\]|\([^)]*\)', ' ', t)  # [Music], (applause)
    t = t.replace('​', '').replace('\n', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def cues_from_json3(data: dict):
    """-> list[(start_s, end_s, text)] mỗi cue của phụ đề."""
    out = []
    for ev in data.get('events', []):
        segs = ev.get('segs')
        if not segs or 'tStartMs' not in ev:
            continue
        text = clean(''.join(s.get('utf8', '') for s in segs))
        if not text:
            continue
        start = ev['tStartMs'] / 1000.0
        end = start + ev.get('dDurationMs', 0) / 1000.0
        out.append((start, end, text))
    return out


def words_from_json3(data: dict):
    """Phụ đề tự động: từng từ kèm mốc giờ tuyệt đối."""
    words = []
    for ev in data.get('events', []):
        segs = ev.get('segs')
        if not segs or 'tStartMs' not in ev:
            continue
        for s in segs:
            w = clean(s.get('utf8', ''))
            if not w:
                continue
            words.append((ev['tStartMs'] / 1000.0 + s.get('tOffsetMs', 0) / 1000.0, w))
    return words


def sentences_manual(cues):
    """Gộp cue thành câu: dừng ở dấu . ? ! hoặc khi quá dài."""
    out, buf, start, end = [], [], None, 0.0
    for s, e, t in cues:
        if start is None:
            start = s
        buf.append(t)
        end = max(end, e)
        joined = ' '.join(buf)
        if re.search(r'[.?!…]["”’)]*$', t) or len(joined) > 230:
            out.append({'start': round(start, 2), 'end': round(end, 2), 'text': joined})
            buf, start = [], None
    if buf and start is not None:
        out.append({'start': round(start, 2), 'end': round(end, 2), 'text': ' '.join(buf)})
    return out


def sentences_auto(words):
    """Cắt dòng theo quãng nghỉ > 0,7 giây hoặc đủ ~16 từ; phụ đề tự động không có dấu câu đáng tin."""
    out, line, t0, last = [], [], None, 0.0
    for t, w in words:
        if line and (t - last > 0.7 or len(line) >= 16):
            out.append({'start': round(t0, 2), 'end': round(t, 2), 'text': ' '.join(line)})
            line, t0 = [], None
        if t0 is None:
            t0 = t
        line.append(w)
        last = t
    if line:
        out.append({'start': round(t0, 2), 'end': round(last + 0.8, 2), 'text': ' '.join(line)})
    return out


def pick_track(info: dict):
    subs = info.get('subtitles') or {}
    auto = info.get('automatic_captions') or {}
    for table, kind in ((subs, 'manual'), (auto, 'auto')):
        keys = [k for k in table if k == 'en' or k.startswith('en-') or k == 'en-orig']
        # ưu tiên en, en-US, en-GB, rồi cái còn lại; bỏ bản tự dịch (en-xx từ ngôn ngữ khác thường có dạng "xx-en")
        keys.sort(key=lambda k: (0 if k == 'en' else 1 if k == 'en-orig' else 2, k))
        for k in keys:
            for f in table[k]:
                if f.get('ext') == 'json3' and f.get('url'):
                    return kind, k, f['url']
    return None


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))


def order(videos):
    by = defaultdict(list)
    for v in videos:
        by[v['channel']].append(v)
    chans = sorted(by, key=lambda c: -len(by[c]))
    out = []
    i = 0
    while any(by[c] for c in chans):
        for c in chans:
            if by[c]:
                out.append(by[c].pop(0))
        i += 1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--sleep', type=float, default=1.5)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    state_path = os.path.join(OUT, '_state.json')
    state = json.load(open(state_path, encoding='utf-8')) if os.path.exists(state_path) else {}
    videos = json.load(open(SEED, encoding='utf-8'))
    bil = json.load(open(BIL, encoding='utf-8'))
    prepared = set((bil.get('prepared') or {}).keys())
    todo = [v for v in order(videos) if v['id'] not in prepared and state.get(v['id']) in (None, 'err')]
    if a.limit:
        todo = todo[: a.limit]
    print(f'cần xử lý {len(todo)} video (đã có {sum(1 for x in state.values() if x == "ok")} phụ đề)', flush=True)

    opts = {'quiet': True, 'no_warnings': True, 'skip_download': True, 'extract_flat': False, 'socket_timeout': 30, 'ignoreerrors': False}
    done = 0
    with yt_dlp.YoutubeDL(opts) as ydl:
        for v in todo:
            vid = v['id']
            try:
                info = ydl.extract_info(f'https://www.youtube.com/watch?v={vid}', download=False)
                pick = pick_track(info)
                if not pick:
                    state[vid] = 'none'
                else:
                    kind, lang, url = pick
                    data = fetch_json(url)
                    sents = sentences_manual(cues_from_json3(data)) if kind == 'manual' else sentences_auto(words_from_json3(data))
                    if len(sents) < 5:
                        state[vid] = 'none'
                    else:
                        with open(os.path.join(OUT, f'{vid}.json'), 'w', encoding='utf-8') as f:
                            json.dump({'videoId': vid, 'source': kind, 'lang': lang, 'sentences': sents}, f, ensure_ascii=False, separators=(',', ':'))
                        state[vid] = 'ok'
            except Exception as e:  # noqa: BLE001
                msg = str(e)
                if any(k in msg for k in ('confirm your age', 'private video', 'Video unavailable', 'removed', 'members-only', 'not available')):
                    state[vid] = 'none'  # khoá theo tuổi / riêng tư / bị gỡ: lỗi của riêng video, không phải bị giới hạn tốc độ
                    time.sleep(a.sleep)
                    continue
                state[vid] = 'err'
                if '429' in msg or 'Too Many' in msg or 'not a bot' in msg:
                    print(f'  {vid}: bị giới hạn ({msg[:60]}) — nghỉ 90 giây', flush=True)
                    time.sleep(90)
            done += 1
            if done % 20 == 0:
                json.dump(state, open(state_path, 'w', encoding='utf-8'))
                ok = [k for k, x in state.items() if x == 'ok']
                json.dump(sorted(ok), open(INDEX, 'w', encoding='utf-8'))
                print(f'  {done}/{len(todo)} — có phụ đề {len(ok)}', flush=True)
            time.sleep(a.sleep)
    json.dump(state, open(state_path, 'w', encoding='utf-8'))
    ok = [k for k, x in state.items() if x == 'ok']
    json.dump(sorted(ok), open(INDEX, 'w', encoding='utf-8'))
    print(f'xong: {len(ok)} video có phụ đề, {sum(1 for x in state.values() if x == "none")} không có, {sum(1 for x in state.values() if x == "err")} lỗi', flush=True)


if __name__ == '__main__':
    sys.exit(main())
