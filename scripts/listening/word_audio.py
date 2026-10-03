"""Local audio processing shared by generation, recovery, and regression tests."""
import math
import re
import subprocess
import time
from array import array


TRIM_FILTER = (
    "silenceremove=start_periods=1:start_threshold=-45dB,"
    "areverse,silenceremove=start_periods=1:start_threshold=-45dB,"
    # Fade IN while reversed: this fades the original END, whatever its duration.
    # afade=t=out:d=0.04 defaults to start_time=0 and silences the whole word.
    "afade=t=in:d=0.04,areverse,afade=t=in:d=0.01"
)


def align_words(expected, recognized, duration):
    """Map exact recognized text to time ranges; a missing word never shifts later clips.

    recognized is a list of {word, start, end} from Whisper word timestamps.
    Spaces and punctuation do not affect alignment of compounds/hyphenated words.
    Unmatched items return None and must be regenerated, never guessed.
    """
    def normalize(text):
        tokens = re.findall(r'[a-z]+', text.lower())
        # Same pronunciation, different orthography; do not allow fuzzy words.
        equivalents = {'prey': 'pray', 'heir': 'air', 'role': 'roll',
                       'rite': 'right', 'write': 'right', 'ageing': 'aging',
                       'neighbourhood': 'neighborhood', 'revolutionise': 'revolutionize',
                       'colour': 'color', 'honour': 'honor', 'labour': 'labor',
                       'centre': 'center', 'theatre': 'theater', 'metre': 'meter',
                       'defence': 'defense', 'offence': 'offense'}
        return ''.join(equivalents.get(token, token).replace('isation', 'ization') for token in tokens)
    wanted = [normalize(word) for word in expected]
    recognized = [word for word in recognized if normalize(word['word'])]
    heard = [normalize(word['word']) for word in recognized]
    n, m = len(wanted), len(heard)
    score = [[0] * (m + 1) for _ in range(n + 1)]
    matches = {}
    # Sequence alignment at whole-word boundaries, allowing one compound to
    # span several recognized tokens. Partial words never count as a match.
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            score[i][j] = max(score[i + 1][j], score[i][j + 1])
            text = ''
            for k in range(j, m):
                text += heard[k]
                if len(text) > len(wanted[i]):
                    break
                if text == wanted[i]:
                    matches[i, j] = k + 1
                    score[i][j] = max(score[i][j], 1 + score[i + 1][k + 1])
                    break
    result = [None] * n
    i = j = 0
    while i < n and j < m:
        after = matches.get((i, j))
        if after is not None and score[i][j] == 1 + score[i + 1][after]:
            first, last = recognized[j], recognized[after - 1]
            # Whisper sometimes gives zero-duration words. Midpoints between
            # neighboring words preserve the whole utterance in that case.
            start = 0 if j == 0 else (recognized[j - 1]['end'] + first['start']) / 2
            end = duration if after == m else (last['end'] + recognized[after]['start']) / 2
            if end > start:
                result[i] = (max(0, start), min(duration, end))
            i += 1
            j = after
        elif score[i + 1][j] > score[i][j + 1]:
            i += 1
        else:
            j += 1
    return result


def split_words(wav_path, n, silence_duration=0.16):
    """Keep the existing boundaries so recovery does not relabel words."""
    dur = float(subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(wav_path),
    ], capture_output=True, text=True, check=True).stdout)
    log = subprocess.run([
        "ffmpeg", "-hide_banner", "-threads", "1", "-filter_threads", "1", "-i", str(wav_path), "-af",
        f"silencedetect=noise=-38dB:d={silence_duration}", "-f", "null", "-",
    ], capture_output=True, text=True, check=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
    silences = [(e - s, s, e) for s, e in zip(starts, ends)
                if s > 0.15 and e < dur - 0.05]
    if len(silences) < n - 1:
        return None, dur, len(silences)
    cuts = sorted(sorted(silences, reverse=True)[:n - 1], key=lambda x: x[1])
    segments, prev = [], 0.0
    for _, start, end in cuts:
        segments.append((prev, start + 0.12))
        prev = end - 0.1
    segments.append((prev, dur))
    return segments, dur, len(silences)


def run_audio_command(command, **kwargs):
    for attempt in range(3):
        try:
            return subprocess.run(command, check=True, **kwargs)
        except subprocess.CalledProcessError:
            if attempt == 2:
                raise
            time.sleep(.2 * (attempt + 1))


def render_word(wav_path, start, end, output, audio_filter=TRIM_FILTER):
    run_audio_command([
        "ffmpeg", "-v", "error", "-threads", "1", "-filter_threads", "1", "-y", "-ss", f"{start:.3f}",
        "-to", f"{end:.3f}", "-i", str(wav_path), "-af", audio_filter,
        "-ac", "1", "-ar", "24000", "-b:a", "40k", str(output),
    ])


def audio_stats(path):
    """Measure decoded signal, including speech AFTER the first 80 ms."""
    pcm = run_audio_command([
        "ffmpeg", "-v", "error", "-threads", "1", "-filter_threads", "1", "-i", str(path), "-f", "s16le",
        "-ac", "1", "-ar", "24000", "-",
    ], capture_output=True).stdout
    samples = array("h", pcm)
    tail = samples[1920:]
    rms = math.sqrt(sum(x * x for x in tail) / max(1, len(tail))) / 32768
    return {"duration": len(samples) / 24000,
            "tail_db": 20 * math.log10(max(rms, 1e-10))}


def validate_word(path, max_duration=None, min_duration=.12):
    stats = audio_stats(path)
    if stats["duration"] < min_duration or stats["tail_db"] < -50:
        raise ValueError(f"Clip has no audible word after 80 ms: {path.name}: {stats}")
    if max_duration is not None and stats['duration'] > max_duration:
        raise ValueError(f'Clip includes too much audio for one entry: {path.name}: {stats}')
    return stats
