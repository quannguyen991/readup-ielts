#!/bin/sh
cd /d/Claude/readup-ielts
while [ ! -f .queue-done ]; do sleep 30; done
/d/Claude/stickman-pipeline/tts-venv/Scripts/python.exe scripts/audio/gen_kokoro_clips.py --voice adam --kind words > .q-adam-words.log 2>&1
