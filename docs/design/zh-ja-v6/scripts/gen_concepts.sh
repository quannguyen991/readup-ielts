#!/usr/bin/env bash
# Sinh ảnh concept bằng Codex CLI (công cụ tạo ảnh có sẵn). Chạy: bash gen_concepts.sh
# Mỗi concept một tiến trình, ghi vào raw/<tên>.png
RAW="$(cd "$(dirname "$0")/../raw" && pwd)"
cd "$RAW" || exit 1

gen() {
  local name="$1"; shift
  local prompt="$1"
  timeout 420 codex exec --skip-git-repo-check -s workspace-write -C "$RAW" \
    "Use your built-in image generation tool to create ONE wide 16:9 illustration. $prompt No text, no letters, no calligraphy, no watermark, no signature. Save the final image into the current directory as ${name}.png and print its filename." \
    > "log-${name}.txt" 2>&1
}

gen ja-a-dagetsu "Concept 'Midnight cranes': Japanese ukiyo-e fused with modern gold-leaf linework. Midnight indigo sky, huge pale gold moon, three white red-crowned cranes in flight, layered gold-outlined seigaiha and asanoha wave patterns, Mount Fuji, vermilion torii on a small island, cherry blossom branches framing the corner, drifting petals. Luminous, dreamy, very rich detail." &
gen ja-b-ukiyoe "Concept 'Fuji dawn woodblock': vintage Japanese woodblock print on warm cream washi paper, limited palette of teal, faded vermilion, soft pink and mustard. Large Mount Fuji with a red sun, a big red torii gate in the centre foreground, rolling hills with seigaiha wave textures, plum and sakura branches on both sides, tall grasses and small flowers, flat graphic shapes with subtle print grain, charming and refined." &
gen ja-c-fuji-mong "Concept 'Wisteria dream Kyoto': dreamy violet and lavender fantasy illustration, a Kyoto five-storey pagoda and temple roofs rising from glowing mist, flowing ribbons of purple waves with gold edge lines, cascading wisteria and paper lanterns, crescent moon and small stars, floating butterflies, soft gradients, ethereal, high detail, modern Japanese game key-art quality." &
gen zh-a-hongkim "Concept 'Crimson gold embroidery': deep crimson red background with raised gold-thread embroidery texture, golden mountains and mist ranges, a large pale gold moon, a flock of cranes and one large crane flying, red plum-blossom trees with gold beads on both sides, rocks with gold veins, a calm gold river reflecting the moon. Opulent Chinese new-year / guochao style, tactile silk-embroidery feel." &
gen zh-b-lien-hoa "Concept 'Lotus dream scroll': Chinese gongbi watercolour in misty violet, indigo and teal, big pink lotus flowers and lotus leaves in the foreground, a golden koi fish swimming through water ripples, a long unrolled painted silk scroll with tassels floating across the scene, crescent moon, tiny gold stars, soft washes and bokeh, romantic and ethereal guofeng style." &
gen zh-c-da-cung "Concept 'Starry celestial palace': midnight blue and violet starry sky, a golden Chinese palace with pagodas and a glowing crystal mountain peak emerging from sculpted xiangyun auspicious clouds with gold dotted outlines, big stylised teal-and-blue waves with gold line details in the foreground, swirling night clouds at the top corners, layered paper-cut depth, magical and majestic guochao style." &
wait
echo DONE
