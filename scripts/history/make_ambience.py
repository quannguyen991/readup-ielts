"""Create quiet, original loop beds for the optional history-scene ambience."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


RATE = 16_000
SECONDS = 8
OUTPUT = Path(__file__).resolve().parents[2] / "assets" / "history" / "ambience"


def make_track(kind: str, seed: int) -> list[float]:
    rng = random.Random(seed)
    samples: list[float] = []
    brown = 0.0
    soft = 0.0
    previous_white = 0.0
    for i in range(RATE * SECONDS):
        t = i / RATE
        white = rng.uniform(-1.0, 1.0)
        brown += (white - brown) * 0.025
        soft += (white - soft) * 0.11
        pink = 0.72 * brown + 0.28 * soft
        ripple = white - previous_white
        previous_white = white

        if kind == "water":
            swell = 0.78 + 0.16 * math.sin(2 * math.pi * 0.11 * t) + 0.06 * math.sin(2 * math.pi * 0.29 * t)
            value = (0.62 * soft + 0.25 * pink + 0.13 * ripple) * swell
        elif kind == "mountain":
            gust = 0.67 + 0.19 * math.sin(2 * math.pi * 0.075 * t) + 0.1 * math.sin(2 * math.pi * 0.17 * t + 1.2)
            value = (0.73 * brown + 0.27 * pink) * gust
        elif kind == "city":
            distant = 0.012 * math.sin(2 * math.pi * 58 * t) + 0.006 * math.sin(2 * math.pi * 91 * t)
            value = 0.69 * pink + 0.19 * brown + 0.12 * soft + distant
        else:  # quiet room tone
            value = 0.56 * pink + 0.31 * brown + 0.13 * soft
        samples.append(value)

    peak = max(abs(value) for value in samples) or 1.0
    target_peak = {"water": 0.20, "mountain": 0.17, "city": 0.14, "room": 0.08}[kind]
    scale = target_peak / peak
    samples = [max(-0.96, min(0.96, value * scale)) for value in samples]

    # Short matching fades make a repeat unobtrusive on hardware and browsers.
    fade = int(RATE * 0.06)
    for i in range(fade):
        level = i / max(1, fade - 1)
        samples[i] *= level
        samples[-fade + i] *= 1.0 - level
    return samples


def write_track(kind: str, seed: int) -> None:
    path = OUTPUT / f"{kind}.wav"
    values = make_track(kind, seed)
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(RATE)
        stream.writeframes(b"".join(struct.pack("<h", int(value * 32767)) for value in values))
    print(f"{path} ({path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for index, kind in enumerate(("water", "city", "mountain", "room"), start=1):
        write_track(kind, seed=1954 + index)
