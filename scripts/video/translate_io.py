"""Xuất / nhập bản dịch tiếng Việt cho phụ đề video (public/video-subs/<id>.json).

  python scripts/video/translate_io.py export [--dir tmp-art/translate]   # mỗi video chưa có bản dịch -> <id>.en.txt (mỗi dòng một câu)
  python scripts/video/translate_io.py import [--dir tmp-art/translate]   # <id>.vi.txt (cùng số dòng) -> thêm trường "vi" vào <id>.json
  python scripts/video/translate_io.py status [--dir ...]

Người dịch (subagent Claude) đọc <id>.en.txt rồi ghi <id>.vi.txt: ĐÚNG số dòng, dòng i là bản dịch của câu i.
Nhập có kiểm: lệch số dòng hoặc có dòng rỗng thì bỏ video đó và in ra để dịch lại.
Không nhập `vi` đè lên video đã có `vi`.
"""
import argparse
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SUBS = os.path.join(ROOT, 'public', 'video-subs')


def video_ids():
    return sorted(f[:-5] for f in os.listdir(SUBS) if f.endswith('.json') and not f.startswith('_') and not f.endswith('.vi.json'))


def load(vid):
    with open(os.path.join(SUBS, f'{vid}.json'), encoding='utf-8') as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['export', 'import', 'status'])
    ap.add_argument('--dir', default=os.path.join(ROOT, 'tmp-art', 'translate'))
    a = ap.parse_args()
    os.makedirs(a.dir, exist_ok=True)

    if a.cmd == 'export':
        n = total = 0
        for vid in video_ids():
            j = load(vid)
            if j.get('vi'):
                continue
            path = os.path.join(a.dir, f'{vid}.en.txt')
            lines = [s['text'].replace('\n', ' ').strip() for s in j['sentences']]
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write('\n'.join(lines) + '\n')
            n += 1
            total += len(lines)
        print(f'xuất {n} video, {total} câu -> {a.dir}')
        return 0

    if a.cmd == 'status':
        have = sum(1 for v in video_ids() if load(v).get('vi'))
        print(f'{have}/{len(video_ids())} video đã có bản dịch')
        return 0

    ok = bad = 0
    for vid in video_ids():
        vi_path = os.path.join(a.dir, f'{vid}.vi.txt')
        if not os.path.exists(vi_path):
            continue
        j = load(vid)
        if j.get('vi'):
            continue
        with open(vi_path, encoding='utf-8') as f:
            vi = f.read().rstrip('\n').split('\n')
        if len(vi) != len(j['sentences']) or any(not x.strip() for x in vi):
            print(f'  LỆCH {vid}: {len(vi)} dòng dịch / {len(j["sentences"])} câu (hoặc có dòng rỗng)')
            bad += 1
            continue
        j['vi'] = [x.strip() for x in vi]
        with open(os.path.join(SUBS, f'{vid}.json'), 'w', encoding='utf-8') as f:
            json.dump(j, f, ensure_ascii=False, separators=(',', ':'))
        ok += 1
    print(f'nhập {ok} video, {bad} video lệch')
    return 0


if __name__ == '__main__':
    sys.exit(main())
