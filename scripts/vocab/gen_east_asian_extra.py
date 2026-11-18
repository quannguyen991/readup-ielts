"""Bổ sung nghĩa tiếng Việt, câu ví dụ, đồng nghĩa, cụm đi kèm cho bộ từ HSK 3.0 và Irodori.

Chạy bằng `claude -p` (dùng quota gói Claude đang đăng nhập, không gọi API trả phí).
Đầu ra: src/data/east-asian-extra-{zh,ja}.json  { "<từ>": {vi, ex:{t,py?,vi}, syn:[], coll} }
Chạy lại được (bỏ qua từ đã có). Dùng: PYTHONUTF8=1 python gen_east_asian_extra.py [zh|ja] [--limit N] [--conc 2] [--engine claude|codex] [--suffix .codex] [--reverse]
"""
import json, re, subprocess, sys, tempfile, concurrent.futures as cf
from pathlib import Path
from pypinyin import pinyin, Style

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'src/data/east-asian-vocab.json'
BATCH = 40
HSK_POS = {'名': 'danh từ', '动': 'động từ', '形': 'tính từ', '副': 'phó từ', '介': 'giới từ', '连': 'liên từ', '代': 'đại từ', '数': 'số từ', '量': 'lượng từ', '助': 'trợ từ', '叹': 'thán từ'}
SYS = 'Bạn là biên tập viên từ điển Trung-Việt và Nhật-Việt. Chỉ in JSON hợp lệ theo yêu cầu, không giải thích, không khối mã.'

PROMPT_ZH = """Soạn dữ liệu từ vựng tiếng Trung (HSK 3.0) cho người Việt. Với MỖI từ dưới đây trả về một đối tượng JSON, đúng thứ tự, đủ số lượng:
{"w":từ gốc,"vi":"nghĩa tiếng Việt ngắn gọn (1-3 nghĩa chính, cách nhau dấu ;, không lặp ý)","ex":{"t":"một câu ví dụ tự nhiên, ngắn, đúng cấp độ HSK, CHỨA ĐÚNG từ đó","vi":"bản dịch tiếng Việt tự nhiên"},"syn":["0-2 từ đồng nghĩa tiếng Trung thật sự đồng nghĩa; không có thì []"],"coll":"một cụm hay đi kèm kèm nghĩa Việt, dạng 爱好 · sở thích; không có thì rỗng"}
Chỉ in một mảng JSON. Từ:
"""
PROMPT_JA = """Soạn dữ liệu từ vựng tiếng Nhật (giáo trình Irodori) cho người Việt. Với MỖI từ/mẫu câu dưới đây (kèm cách đọc kana và nghĩa tiếng Anh) trả về một đối tượng JSON, đúng thứ tự, đủ số lượng:
{"w":từ gốc,"vi":"nghĩa tiếng Việt ngắn gọn dịch từ nghĩa tiếng Anh (1-3 nghĩa, cách nhau dấu ;)","ex":{"t":"một câu ví dụ tự nhiên, ngắn, đúng trình độ sơ cấp, CHỨA từ đó (dùng kanji nếu từ có kanji)","vi":"bản dịch tiếng Việt tự nhiên"},"syn":["0-2 từ đồng nghĩa tiếng Nhật; không có thì []"],"coll":"một cụm hay đi kèm kèm nghĩa Việt, dạng 約束を守る · giữ lời hứa; không có thì rỗng"}
Nếu mục là một câu chào/cụm cố định thì ví dụ có thể là tình huống dùng nó, "syn" để []. Chỉ in một mảng JSON. Từ:
"""


def clean_ja(t: str) -> str:
    return re.sub(r'[（(][^）)]*[）)]', '', t).replace('／', '').replace('/', '').replace('～', '').replace('〜', '').strip()


def load(lang):
    books = json.loads(SRC.read_text(encoding='utf8'))
    seen = {}
    for b in books:
        if b['language'] != lang:
            continue
        for t in b['topics']:
            for l in t['lessons']:
                for r in l['rows']:
                    seen.setdefault(r['w'], r)
    return seen


ENGINE = 'claude'


def ask_codex(prompt):
    with tempfile.TemporaryDirectory() as cwd:
        outf = Path(cwd) / 'out.txt'
        subprocess.run(['codex', 'exec', '--skip-git-repo-check', '-s', 'read-only', '-c', 'model_reasoning_effort="low"',
                        '--output-last-message', str(outf), '-'],
                       input=SYS + '\n\n' + prompt, capture_output=True, text=True, encoding='utf8', cwd=cwd, shell=True, timeout=900)
        return outf.read_text(encoding='utf8') if outf.exists() else ''


def ask(prompt):
    if ENGINE == 'codex':
        return ask_codex(prompt)
    with tempfile.TemporaryDirectory() as cwd:
        p = subprocess.run(
            ['claude', '-p', '--model', 'haiku', '--effort', 'low', '--tools', '', '--strict-mcp-config',
             '--disable-slash-commands', '--system-prompt', SYS, '--output-format', 'text'],
            input=prompt, capture_output=True, text=True, encoding='utf8', cwd=cwd, shell=True, timeout=600)
    return p.stdout


def parse(out):
    m = re.search(r'\[.*\]', out, re.S)
    return json.loads(m.group(0)) if m else None


def base_zh(w):
    # từ đồng âm đánh số (本1, 点2) -> bỏ số cuối
    return re.sub(r'\d+$', '', w)


def stems(k):
    # từ nguyên dạng -> các gốc có thể gặp khi chia động từ (勉強する -> 勉強します)
    out = [k, k[:-1], k[:-2]]
    return [x for x in out if x and (x == k or len(x) >= 2)]


def valid(lang, row, rec):
    if not isinstance(rec, dict):
        return False
    vi, ex = (rec.get('vi') or '').strip(), rec.get('ex') or {}
    t, tv = (ex.get('t') or '').strip(), (ex.get('vi') or '').strip()
    if not vi or not t or not tv or len(t) > 60 or len(vi) > 80:
        return False
    if lang == 'zh':
        key = base_zh(row['w'])
        return bool(key and key in t)
    t = t.replace(' ', '')
    for form in re.split(r'[／/]', row['w']):
        key = clean_ja(form).replace(' ', '')
        if key and any(st in t for st in stems(key)):
            return True
    for form in re.split(r'[／/]', row.get('p') or ''):
        reading = clean_ja(form).replace(' ', '')
        if reading and any(st in t for st in stems(reading)):
            return True
    return False


def finish(lang, rec):
    ex = rec['ex']
    out = {'vi': rec['vi'].strip(), 'ex': {'t': ex['t'].strip(), 'vi': ex['vi'].strip()},
           'syn': [s.strip() for s in (rec.get('syn') or []) if isinstance(s, str) and s.strip()][:2],
           'coll': (rec.get('coll') or '').strip()}
    if lang == 'zh':
        out['ex']['py'] = ' '.join(x[0] for x in pinyin(ex['t'], style=Style.TONE, errors='default') if re.search(r'[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]', x[0]))
    return out


def run_batch(lang, rows):
    items = []
    for r in rows:
        if lang == 'zh':
            items.append({'w': base_zh(r['w']), 'pinyin': r.get('p', ''), 'loai': ' '.join(HSK_POS.get(c, c) for c in re.split(r'[、/]', r.get('o', '')) if c)})
        else:
            items.append({'w': r['w'], 'kana': r.get('p', ''), 'en': r.get('g', '')})
    prompt = (PROMPT_ZH if lang == 'zh' else PROMPT_JA) + json.dumps(items, ensure_ascii=False)
    try:
        arr = parse(ask(prompt))
    except Exception:
        arr = None
    got = {}
    if isinstance(arr, list):
        aligned = len(arr) == len(rows)
        for i, r in enumerate(rows):
            a = arr[i] if aligned and isinstance(arr[i], dict) else next((x for x in arr if isinstance(x, dict) and x.get('w') in (r['w'], base_zh(r['w']))), None)
            if a and valid(lang, r, a):
                got[r['w']] = finish(lang, a)
    return got


def main():
    lang = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('zh', 'ja') else 'zh'
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    conc = int(sys.argv[sys.argv.index('--conc') + 1]) if '--conc' in sys.argv else 2
    global ENGINE
    ENGINE = sys.argv[sys.argv.index('--engine') + 1] if '--engine' in sys.argv else 'claude'
    suffix = sys.argv[sys.argv.index('--suffix') + 1] if '--suffix' in sys.argv else ''
    out = ROOT / f'src/data/east-asian-extra-{lang}{suffix}.json'
    data = json.loads(out.read_text(encoding='utf8')) if out.exists() else {}
    have = set(data)
    for f in (ROOT / 'src/data').glob(f'east-asian-extra-{lang}*.json'):
        if f != out:
            have |= set(json.loads(f.read_text(encoding='utf8')))
    rows = [r for w, r in load(lang).items() if w not in have and w not in data]
    if '--reverse' in sys.argv:
        rows.reverse()
    rows = rows[:limit]
    batches = [rows[i:i + BATCH] for i in range(0, len(rows), BATCH)]
    print(lang, 'còn', len(rows), 'từ,', len(batches), 'lượt', flush=True)
    done = bad = 0
    with cf.ThreadPoolExecutor(conc) as ex:
        for got, b in zip(ex.map(lambda b: run_batch(lang, b), batches), batches):
            data.update(got)
            done += len(got); bad += len(b) - len(got)
            out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
            print(lang, 'ok', done, 'lỗi', bad, flush=True)


main()
