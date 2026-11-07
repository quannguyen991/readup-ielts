#!/bin/sh
cd /d/Claude/readup-ielts
PY="/d/Claude/stickman-pipeline/tts-venv/Scripts/python.exe"
while tasklist /FI "PID eq 34160" 2>/dev/null | grep -q "34160"; do sleep 20; done
$PY scripts/audio/gen_kokoro_clips.py --voice sarah --kind words > .q-sarah-words.log 2>&1
$PY scripts/audio/gen_kokoro_clips.py --voice sarah --kind lines > .q-sarah-lines.log 2>&1
$PY scripts/audio/gen_kokoro_clips.py --voice sarah --kind listening > .q-sarah-listening.log 2>&1
$PY scripts/audio/gen_kokoro_clips.py --voice sarah --kind examples > .q-sarah-examples.log 2>&1
$PY scripts/audio/gen_kokoro_clips.py --voice adam --kind listening > .q-adam-listening.log 2>&1
$PY scripts/audio/gen_kokoro_clips.py --voice adam --kind examples > .q-adam-examples.log 2>&1
echo done > .queue-done
