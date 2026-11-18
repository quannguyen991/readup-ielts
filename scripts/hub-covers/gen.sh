#!/usr/bin/env bash
# Sinh bìa vuông cho gia sư / công cụ Speaking bằng Codex CLI (gói thuê bao, không tính tiền API).
# Mỗi tấm là lưới 3x3 chín ô vuông; cut.py cắt lại thành từng ảnh.
# Chạy: bash gen.sh [sheet-1 sheet-2 ...]   →   raw/<sheet>.png
RAW="$(cd "$(dirname "$0")" && pwd)/raw"
mkdir -p "$RAW"
GEN="$HOME/.codex/generated_images"

STYLE="Style: soft glossy 3D clay illustration, rounded friendly shapes, pastel purple, blue, pink and warm yellow palette, gentle studio lighting, one clear central object or small scene per tile, each tile has its own full-bleed pastel gradient background. The nine tiles are perfectly square, equal size, arranged in an exact 3 by 3 grid, separated by thin pure white gutters, with a thin white margin around the whole grid. No text, no letters, no numbers, no watermark, no people's faces in close-up."

run() {
  local dest="$1" prompt="$2" log="run.log"
  [ -f "$dest" ] && { echo "skip $dest"; return; }
  local tmp; tmp="$(mktemp -d)"
  ( cd "$tmp" && timeout 480 codex exec --skip-git-repo-check -s workspace-write -C "$tmp" \
      "Use your built-in image generation tool to generate the image described below. Do NOT copy, move, save, read or list any files and do not run shell commands; when the image is generated just reply 'done'. Image: $prompt" > "$log" 2>&1 )
  local sid; sid="$(grep -m1 'session id' "$tmp/$log" | awk '{print $3}')"
  local img; img="$(ls -t "$GEN/$sid"/*.png 2>/dev/null | head -1)"
  if [ -n "$img" ]; then cp "$img" "$dest"; echo "ok $dest"; else echo "FAIL $dest"; fi
  rm -rf "$tmp"
}

sheet() { run "$RAW/$1.png" "Square 1:1 sprite sheet of nine square app cover tiles in a 3 by 3 grid. Reading order left to right, top to bottom: $2. $STYLE"; }

ARGS=("$@")
w() { [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }

lane1() {
  w sheet-1 && sheet sheet-1 "1 a gold trophy with a speech bubble (IELTS examiner), 2 a glossy number one badge with a microphone (IELTS part 1), 3 a cue card note with a pencil and a clock (part 2 long turn), 4 a thinking brain made of purple clay with sparkles (part 3 discussion), 5 a green rising staircase with an upward arrow and a star (band upgrade), 6 a stack of books with a pencil (grammar tutor), 7 a microphone with sound waves (speech analysis), 8 a card deck of vocabulary flashcards, 9 a smiling mouth and tongue diagram with sound waves (pronunciation)"
  w sheet-3 && sheet sheet-3 "1 a calendar with a chat bubble (meeting), 2 two chairs facing each other across a small table (interview), 3 a CV document with a magnifying glass (profile review), 4 a podium with a microphone and a small audience (public speaking), 5 a presentation board with a bar chart (presentation), 6 a rising sales chart with a phone headset (sales), 7 two hands shaking over a table with coins (negotiation), 8 a white dove with an olive branch between two speech bubbles (conflict management), 9 a megaphone with a golden star (leader communication)"
}
lane2() {
  sleep 5
  w sheet-2 && sheet sheet-2 "1 a speech bubble with two quotation marks and a lightning bolt (idioms and collocations), 2 a stopwatch with a speech bubble and a lightning bolt (fluency), 3 an open diary with a pen and a smiling sun, 4 a paper coffee cup with a smiling speech bubble (daily English), 5 two friendly speech bubbles waving at each other (small talk), 6 a retro telephone handset with sound rings (phone call), 7 a suitcase with a paper plane and a globe (travel), 8 two phone screens connected by a heart (dating), 9 a story book opening with a rocket and a chart rising from it (business storytelling)"
  w sheet-4 && sheet sheet-4 "1 a compass over a mountain with a flag (leadership coach), 2 a microphone with a waveform and a magnifying glass (voice analysis tool), 3 headphones with a pitch curve (intonation tool), 4 a phone playing a short video with a play button (short video), 5 two overlapping speech bubbles chasing each other with a repeat arrow (shadowing), 6 a theatre mask pair on a stage curtain (roleplay scenarios), 7 a globe with a speech bubble and a question mark (topics), 8 a calendar with a headset and a notepad (meeting assistant), 9 a cozy cafe table with two cups and two speech bubbles (real conversations)"
}
lane1 &
lane2 &
wait
echo ALLDONE
