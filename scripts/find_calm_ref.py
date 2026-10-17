import pathlib
import json
import soundfile as sf

lines = pathlib.Path('public/audio/lines/aoede')
idx = json.loads((lines / 'index.json').read_text(encoding='utf-8'))

results = []
for text, fname in idx.items():
    fpath = lines / fname
    if fpath.exists():
        info = sf.info(str(fpath))
        words = len(text.split())
        if words >= 8:
            wps = words / info.duration
            results.append((wps, info.duration, text, fname))

results.sort(key=lambda x: x[0])
print('Top 8 slowest / calmest Aoede sentences:')
for wps, dur, text, fname in results[:8]:
    print(f'{wps:.2f} wps ({dur:.2f}s) [{fname}]: "{text}"')
