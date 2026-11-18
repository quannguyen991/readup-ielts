#!/usr/bin/env bash
# Sinh tấm họa tiết nền magenta bằng Codex CLI. Codex CHỈ sinh ảnh; script tự lấy file
# từ ~/.codex/generated_images/<session id>/ (agent trong sandbox không tìm được đường dẫn
# nên từng nhồi cả base64 vào lệnh và lỗi "filename too long").
# Chạy: bash gen_motifs.sh [tên ...]   →   raw/motifs/<tên>.png   (concept: raw/<tên>.png)
RAW="$(cd "$(dirname "$0")/../raw" && pwd)"
mkdir -p "$RAW/motifs"
GEN="$HOME/.codex/generated_images"

STYLE="Style: rich Japanese/Chinese illustration with fine gold-leaf outlines, saturated jewel colors, subtle paper grain, consistent lighting. Each element is a separate isolated sticker-like cut-out, fully surrounded by solid pure magenta #FF00FF background with generous gaps; elements never touch each other or the image edges; no ground shadows; do not use magenta inside the elements. Square 1:1 image. No text, no letters, no calligraphy, no watermark."

# run <đích.png> <prompt>
run() {
  local dest="$1" prompt="$2" log="run.log"
  [ -f "$dest" ] && { echo "skip $dest"; return; }
  local tmp; tmp="$(mktemp -d)"
  ( cd "$tmp" && timeout 420 codex exec --skip-git-repo-check -s workspace-write -C "$tmp" \
      "Use your built-in image generation tool to generate the image described below. Do NOT copy, move, save, read or list any files and do not run shell commands; when the image is generated just reply 'done'. Image: $prompt" > "$log" 2>&1 )
  local sid; sid="$(grep -m1 'session id' "$tmp/$log" | awk '{print $3}')"
  local img; img="$(ls -t "$GEN/$sid"/*.png 2>/dev/null | head -1)"
  if [ -n "$img" ]; then cp "$img" "$dest"; echo "ok $dest"; else echo "FAIL $dest"; fi
  rm -rf "$tmp"
}

sheet() { # sheet <tên> <danh sách 9 ô>
  run "$RAW/motifs/$1.png" "A sprite sheet: a 3 by 3 grid of nine separate decorative elements on a solid pure magenta #FF00FF background. Reading order left to right, top to bottom: $2. $STYLE"
}

want() { [ $# -eq 0 ] && return 0; local n="$NAME"; for a in "${ARGS[@]}"; do [ "$a" = "$n" ] && return 0; done; return 1; }
ARGS=("$@")
w() { NAME="$1"; [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }

lane1() {
  w ja-flora && sheet ja-flora "1 left-facing sakura branch full of blossoms, 2 right-facing sakura branch full of blossoms, 3 small cluster of falling sakura petals, 4 cascading wisteria blossoms, 5 red maple leaf branch, 6 pine branch with gold needles, 7 plum blossom twig, 8 chrysanthemum medallion, 9 gold-outlined swirling kasumi cloud"
  w ja-objects && sheet ja-objects "1 vermilion torii gate, 2 five-storey pagoda, 3 paper chochin lantern glowing, 4 open folding fan with painted scene, 5 wagasa oil-paper umbrella, 6 small teahouse with tiled roof, 7 kanzashi hair ornament, 8 origami crane, 9 Japanese arched bridge over water"
  w ja-patterns && sheet ja-patterns "1 horizontal strip of seigaiha wave pattern, 2 horizontal strip of asanoha geometric pattern, 3 large Hokusai-style wave crest with foam, 4 horizontal band of gold-edged clouds, 5 ornate corner frame ornament, 6 circular kikko hexagon medallion, 7 full moon disc with gold texture, 8 red sun disc with gold rim, 9 Mount Fuji snow-capped silhouette"
  w ja-c-fuji-mong && run "$RAW/ja-c-fuji-mong.png" "ONE wide 16:9 illustration. Concept 'Wisteria dream Kyoto': dreamy violet and lavender fantasy illustration, a Kyoto five-storey pagoda and temple roofs rising from glowing mist, flowing ribbons of purple waves with gold edge lines, cascading wisteria and paper lanterns, crescent moon and small stars, floating butterflies, soft gradients, ethereal, high detail, modern Japanese game key-art quality. No text, no letters, no watermark."
}
lane2() {
  sleep 4
  w zh-flora && sheet zh-flora "1 plum blossom branch in red, 2 peony flower with leaves, 3 pink lotus with lotus leaf, 4 orchid spray, 5 bamboo stalks with leaves, 6 chrysanthemum bloom, 7 osmanthus branch with golden flowers, 8 peach blossom branch, 9 ruyi auspicious cloud"
  w zh-objects && sheet zh-objects "1 Chinese pavilion with upturned eaves, 2 multi-tier pagoda, 3 round moon gate, 4 palace roof with glazed tiles, 5 red paper lantern with tassels, 6 painted folding fan, 7 oil-paper umbrella, 8 unrolled silk scroll painting with tassel, 9 Chinese knot with tassels"
  w zh-patterns && sheet zh-patterns "1 horizontal xiangyun auspicious cloud strip, 2 horizontal wave pattern strip with gold lines, 3 ornate ruyi corner frame ornament, 4 circular cloud-pattern medallion, 5 full moon disc with gold texture, 6 red sun disc with gold rim, 7 layered gold mountain range, 8 horizontal band of mist and gold dust, 9 swirling cloud scroll flourish"
}
lane1 &
lane2 &
wait
echo ALLDONE
