import pathlib
import json
import shutil

src = pathlib.Path('public/audio/speaking/aoede')
idx = json.loads((src / 'index.json').read_text(encoding='utf-8'))
out_dir = pathlib.Path('public/audio/aoede_reference')
out_dir.mkdir(parents=True, exist_ok=True)

# Select top cleanest samples: short, medium, long
candidates = [
    ('what-is-the-weather-like-where-you-live--55e398.mp3', 'sample_1_short.mp3'),
    ('which-room-in-your-home-do-you-spend-the-86ccb7.mp3', 'sample_2_medium.mp3'),
    ('do-you-prefer-having-a-few-close-friends-c5a584.mp3', 'sample_3_long.mp3')
]

manifest = []
for orig_name, new_name in candidates:
    for text, fname in idx.items():
        if fname == orig_name:
            target = out_dir / new_name
            shutil.copy2(src / fname, target)
            manifest.append({
                'file': new_name,
                'path': str(target.as_posix()),
                'text': text,
                'size': (src / fname).stat().st_size
            })
            break

(out_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'Successfully prepared {len(manifest)} reference samples for Aoede voice cloning.')
for item in manifest:
    print(f' - {item["file"]}: "{item["text"]}" ({item["size"]} bytes)')
