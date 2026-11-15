#!/usr/bin/env bash
# Sinh bộ họa tiết giao diện theo ảnh mẫu của người dùng (refs/target-zh.png, refs/target-ja.png).
# Codex CHỈ sinh ảnh; script lấy file từ ~/.codex/generated_images/<session id>/.
# Chạy: bash gen_ui.sh [tên ...]  →  raw/ui/<tên>.png
HERE="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$HERE/raw/ui"; REFS="$HERE/refs"
mkdir -p "$RAW"
GEN="$HOME/.codex/generated_images"

REFNOTE="The attached reference image is a UI mockup used ONLY as a style guide for art style, palette and ornament language; do not copy its text, buttons or layout."
MAG="Elements are separate isolated cut-outs fully surrounded by solid pure magenta #FF00FF background with generous gaps, never touching each other or the edges, no ground shadows, no magenta inside the elements. Square 1:1 image. No text, no letters, no numerals, no watermark."

# run <đích.png> <ref.png> <prompt>
run() {
  local dest="$1" ref="$2" prompt="$3"
  [ -f "$dest" ] && { echo "skip $dest"; return; }
  local tmp; tmp="$(mktemp -d)"
  ( cd "$tmp" && timeout 480 codex exec --skip-git-repo-check -s workspace-write -C "$tmp" \
      "Use your built-in image generation tool to generate the image described below. $REFNOTE Do NOT copy, move, save, read or list any files and do not run shell commands; when the image is generated just reply 'done'. Image: $prompt" \
      -i "$ref" > run.log 2>&1 )
  local sid; sid="$(grep -m1 'session id' "$tmp/run.log" | awk '{print $3}')"
  local img; img="$(ls -t "$GEN/$sid"/*.png 2>/dev/null | head -1)"
  if [ -n "$img" ]; then cp "$img" "$dest"; echo "ok $dest"; else echo "FAIL $dest"; fi
  rm -rf "$tmp"
}
w() { [ $# -ge 1 ] || return 0; [ ${#ARGS[@]} -eq 0 ] && return 0; for a in "${ARGS[@]}"; do [ "$a" = "$1" ] && return 0; done; return 1; }
ARGS=("$@")

lane1() {
  w ja-seals && run "$RAW/ja-seals.png" "$REFS/target-ja.png" "A sprite sheet, 3 by 3 grid of nine separate decorative UI elements, reading order left to right, top to bottom: 1 round red medallion icon with a vermilion torii gate inside, gold rim; 2 round red medallion with a folding fan inside, gold rim; 3 round red medallion with seigaiha wave pattern inside, gold rim; 4 round red medallion with a sakura flower inside, gold rim; 5 round red medallion with snow-capped Mount Fuji inside, gold rim; 6 flat vermilion-red badge shaped like a five-petal sakura flower with a blank center and thin gold outline; 7 small pink and red sakura flower icon with gold outline; 8 horizontal gold line-art auspicious cloud flourish ornament; 9 red brush-stroke ribbon banner, blank, with rough brush ends and thin gold edge. $MAG"
  w ja-hero2 && run "$RAW/ja-hero2.png" "$REFS/target-ja.png" "ONE wide 16:9 illustration in the same ukiyo-e style as the mockup hero: Mount Fuji snow-capped with a large red sun behind it, a big vermilion torii gate in the foreground center standing in water, deep blue Hokusai-style waves with gold seigaiha clouds along the bottom, pale gold clouds, two white cranes flying at the right, cherry blossom branches framing the right edge, deep indigo-blue sky. Left third calm and uncluttered. No text, no letters, no watermark."
  w sidebar-ja && run "$RAW/sidebar-ja.png" "$REFS/target-ja.png" "ONE tall portrait 2:3 illustration for a navigation sidebar background: deep navy-blue background with very faint gold seigaiha pattern; the top two thirds almost plain navy with a few faint gold clouds so white text can sit on it; at the bottom a blooming sakura tree on the left, a red five-storey pagoda on a blue hill, blue rocks, layered blue and gold waves along the very bottom edge. No text, no watermark."
  w footer-ja && run "$RAW/footer-ja.png" "$REFS/target-ja.png" "ONE wide 16:9 illustration of only a decorative footer: layered deep-blue Hokusai-style waves with gold seigaiha ripple bands and foam, pink sakura branches entering from the bottom-left and bottom-right corners, the upper half plain flat deep navy blue (easy to blend into a page), no sky detail. No text, no watermark."
}
lane2() {
  sleep 4
  w footer-zh && run "$RAW/footer-zh.png" "$REFS/target-zh.png" "ONE wide 16:9 illustration of only a decorative footer: layered gold-embroidered mountains and golden mist with xiangyun auspicious clouds in gold line art, a calm golden river at the very bottom, red plum blossom branches entering from the bottom-left and bottom-right corners, the upper half plain flat deep crimson red (#4A0A12) so it blends into a page background, no sky detail, no moon. No text, no watermark."
  w zh-seals && run "$RAW/zh-seals.png" "$REFS/target-zh.png" "A sprite sheet, 3 by 3 grid of nine separate decorative UI elements, reading order left to right, top to bottom: 1 round deep-red medallion with gold rim and a gold ancient coin icon inside; 2 round deep-red medallion with gold rim and a gold yuanbao ingot inside; 3 round deep-red medallion with gold rim and a gold Chinese knot inside; 4 round deep-red medallion with gold rim and a gold folding fan inside; 5 round deep-red medallion with gold rim and a gold pagoda inside; 6 round deep-red medallion with gold rim and a gold peony inside; 7 gold huiwen lattice window-frame corner ornament shaped like an L for a top-left corner, fine gold lines; 8 gold huiwen lattice frame corner ornament L-shaped for a bottom-left corner with a small cloud scroll; 9 horizontal gold line-art xiangyun cloud flourish ornament. $MAG"
  w books && run "$RAW/books.png" "$REFS/target-zh.png" "A sprite sheet, 3 by 3 grid of nine separate closed hardcover books shown front cover slightly turned so the spine is visible, no text on any cover, reading order left to right, top to bottom: 1 crimson cover with gold sakura pattern; 2 navy-blue cover with a large white Hokusai wave; 3 forest-green cover with gold cranes; 4 purple cover with wisteria; 5 vermilion cover with a gold torii; 6 red cover with a gold pagoda and clouds; 7 crimson cover with a gold dragon among clouds; 8 teal cover with a pink lotus; 9 black cover with a gold moon. $MAG"
  w zh-hero2 && run "$RAW/zh-hero2.png" "$REFS/target-zh.png" "ONE wide 16:9 illustration in the same gold-embroidery guochao style as the mockup hero: crimson-red sky, a huge pale gold moon, layered gold-embroidered mountains with a thin waterfall, a gold-roofed Chinese pavilion on a rocky island at the right, a calm golden river reflecting the moon, small red plum trees at the bottom edges, golden clouds. No cranes, no lanterns. Left third calm and uncluttered. No text, no letters, no watermark."
  w sidebar-zh && run "$RAW/sidebar-zh.png" "$REFS/target-zh.png" "ONE tall portrait 2:3 illustration for a navigation sidebar background: warm cream parchment paper background; the top 60% almost plain cream with faint cloud lines so dark text can sit on it; at the bottom ink-wash and gold-outlined misty mountains, a small red pagoda on a cliff, red plum blossom branches coming from the left edge. No text, no watermark."
}
lane1 &
lane2 &
wait
echo ALLDONE
