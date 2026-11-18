/**
 * Tài sản vẽ cho màn tiếng Trung (assets/chinese/*.webp, đã tách nền).
 * Đặt tên theo nội dung hình, không theo chỗ dùng, để đổi bố cục không phải đổi tên file.
 */
export const ZH_ART = {
  panda: require('../../../../assets/chinese/panda.webp') as number,
  pagoda: require('../../../../assets/chinese/pagoda.webp') as number,
  plum: require('../../../../assets/chinese/plum.webp') as number,
  lantern: require('../../../../assets/chinese/lantern.webp') as number,
  seal: require('../../../../assets/chinese/seal.webp') as number,
  bamboo: require('../../../../assets/chinese/bamboo.webp') as number,
  lotus: require('../../../../assets/chinese/lotus.webp') as number,
  bridge: require('../../../../assets/chinese/bridge.webp') as number,
  cloud: require('../../../../assets/chinese/cloud.webp') as number,
  crane: require('../../../../assets/chinese/crane.webp') as number,
  knot: require('../../../../assets/chinese/knot.webp') as number,
  mountain: require('../../../../assets/chinese/mountain.webp') as number,
} as const;

/** Ảnh cảnh cho từng chủ đề (theo thứ tự chủ đề 1..4); vượt quá thì quay vòng. */
export const ZH_SCENES = [
  require('../../../../assets/chinese/topic-1-family.webp') as number,
  require('../../../../assets/chinese/topic-2-tea.webp') as number,
  require('../../../../assets/chinese/topic-3-school.webp') as number,
  require('../../../../assets/chinese/topic-4-time.webp') as number,
] as const;

/**
 * Viền khung trang trí (assets/chinese/frames, vẽ bằng ChatGPT rồi tách nền magenta):
 * `hero` là khung ngang cho đầu bài (máy tính), `card` là khung góc vuông (điện thoại, thẻ).
 */
export const ZH_FRAME = {
  hero: require('../../../../assets/chinese/frames/hero-frame.webp') as number,
  card: require('../../../../assets/chinese/frames/card-frame.webp') as number,
  /** Một góc khung (140×140, đã tách nền) để gắn vào bốn góc của sân khấu từng thẻ. */
  cardCorner: require('../../../../assets/chinese/frames/card-corner.webp') as number,
  /** Ba mảnh của khung ngang để ghép 9 ô: góc (150×150), cạnh trên (ngang), cạnh trái (dọc). */
  parts: {
    corner: require('../../../../assets/chinese/frames/hero-corner.webp') as number,
    top: require('../../../../assets/chinese/frames/hero-top.webp') as number,
    left: require('../../../../assets/chinese/frames/hero-left.webp') as number,
  },
} as const;

export function sceneFor(index: number): number {
  return ZH_SCENES[((index % ZH_SCENES.length) + ZH_SCENES.length) % ZH_SCENES.length]!;
}

/**
 * Bìa các bộ HSK, phong cách công bút (assets/chinese/covers/gongbi/hsk-1..7.webp), vẽ bằng ChatGPT, KHÔNG có chữ.
 * Chữ và nhãn đè lên bằng code. Thứ tự: HSK 1, 2, 3, 4, 5, 6, và 7 (= HSK 7–9).
 */
export const ZH_COVERS: readonly number[] = [
  require('../../../../assets/chinese/covers/gongbi/hsk-1.webp') as number,
  require('../../../../assets/chinese/covers/gongbi/hsk-2.webp') as number,
  require('../../../../assets/chinese/covers/gongbi/hsk-3.webp') as number,
  require('../../../../assets/chinese/covers/gongbi/hsk-4.webp') as number,
  require('../../../../assets/chinese/covers/gongbi/hsk-5.webp') as number,
  require('../../../../assets/chinese/covers/gongbi/hsk-6.webp') as number,
  require('../../../../assets/chinese/covers/gongbi/hsk-7.webp') as number,
];
