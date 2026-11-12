"""Sinh clip phát âm cho bộ từ vựng tiếng Trung (HSK) và tiếng Nhật (Irodori) bằng edge-tts (giọng neural, miễn phí).

Đầu ra: public/audio/east-asian/{ja,zh}/<sha1[:10]>.mp3 + index.json (khoá = chữ hiển thị `w`, giá trị = tên tệp).
Chạy lại được: bỏ qua tệp đã có. Dùng:  PYTHONUTF8=1 python scripts/audio/gen_east_asian_clips.py [--limit N] [--only ja|zh]
"""
import asyncio, hashlib, json, re, subprocess, sys
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'src/data/east-asian-vocab.json'
OUT = ROOT / 'public/audio/east-asian'
VOICE = {'ja': 'ja-JP-NanamiNeural', 'zh': 'zh-CN-XiaoxiaoNeural'}
CONC = 8


def key(text: str) -> str:
    # trùng với clipKey() ở pronounce-core.ts
    return re.sub(r'\s+', ' ', text.strip()).replace('’', "'").replace('‘', "'").lower()


def speak_text(lang: str, row: dict) -> str:
    # Nhật: đọc theo kana (p) để khỏi đọc sai chữ Hán; Trung: đọc chữ Hán.
    t = (row.get('p') or row['w']) if lang == 'ja' else row['w']
    t = re.sub(r'[（(][^）)]*[）)]', '', t)          # bỏ chú thích trong ngoặc
    t = re.sub(r'[／/・～〜~…]+', ' ', t).strip()
    return t or row['w']


async def one(sem, lang, w, text, path):
    if path.exists() and path.stat().st_size > 500:
        return True
    async with sem:
        for attempt in range(4):
            try:
                tmp = path.with_suffix('.raw.mp3')
                await edge_tts.Communicate(text, VOICE[lang], rate='-10%').save(str(tmp))
                # nén xuống 32 kbps mono cho nhẹ (từ ngắn ~3 KB)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(tmp), '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ac', '1', '-b:a', '32k', str(path)], check=True)
                tmp.unlink(missing_ok=True)
                return path.stat().st_size > 500
            except Exception as e:  # noqa
                await asyncio.sleep(1.5 * (attempt + 1))
        print('FAIL', lang, w, flush=True)
        return False


async def main():
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    books = json.loads(SRC.read_text(encoding='utf8'))
    items = {'ja': {}, 'zh': {}}
    for b in books:
        for t in b['topics']:
            for l in t['lessons']:
                for r in l['rows']:
                    items[b['language']].setdefault(key(r['w']), (r['w'], speak_text(b['language'], r)))
    sem = asyncio.Semaphore(CONC)
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    for lang, d in items.items():
        if only and lang != only:
            continue
        folder = OUT / lang
        folder.mkdir(parents=True, exist_ok=True)
        todo = list(d.items())[:limit]
        index = {}
        tasks = []
        for k, (w, text) in todo:
            name = hashlib.sha1(f'{lang}|{k}'.encode()).hexdigest()[:10] + '.mp3'
            index[k] = name
            tasks.append(one(sem, lang, w, text, folder / name))
        done = 0
        for i in range(0, len(tasks), 400):
            res = await asyncio.gather(*tasks[i:i + 400])
            done += sum(res)
            print(lang, i + len(res), '/', len(tasks), 'ok', done, flush=True)
            ok = {k: n for k, n in index.items() if (folder / n).exists()}
            (folder / 'index.json').write_text(json.dumps(ok, ensure_ascii=False, indent=0), encoding='utf8')


asyncio.run(main())
