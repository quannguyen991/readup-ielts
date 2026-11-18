#!/usr/bin/env bash
RAW="$(cd "$(dirname "$0")/../raw" && pwd)"; cd "$RAW" || exit 1
gen() { timeout 420 codex exec --skip-git-repo-check -s workspace-write -C "$RAW" "Use your built-in image generation tool to create ONE wide 16:9 illustration. $2 No text, no letters, no calligraphy, no watermark, no signature. Copy the generated image file into the current directory as $1.png (use Copy-Item) and print its filename." > "log-$1.txt" 2>&1; }
gen ja-c-fuji-mong "Concept 'Wisteria dream Kyoto': dreamy violet and lavender fantasy illustration, a Kyoto five-storey pagoda and temple roofs rising from glowing mist, flowing ribbons of purple waves with gold edge lines, cascading wisteria and paper lanterns, crescent moon and small stars, floating butterflies, soft gradients, ethereal, high detail, modern Japanese game key-art quality."
sleep 5
gen zh-a-hongkim "Concept 'Crimson gold embroidery': deep crimson red background with raised gold-thread embroidery texture, golden mountains and mist ranges, a large pale gold moon, a flock of cranes and one large crane flying, red plum-blossom trees with gold beads on both sides, rocks with gold veins, a calm gold river reflecting the moon. Opulent Chinese new-year guochao style, tactile silk-embroidery feel."
echo DONE
