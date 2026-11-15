/**
 * Bảng màu và tranh của sách tiếng Nhật: xanh rừng đậm, vàng kim, kem. Tranh thumbnail cắt từ bản thiết kế
 * (assets/chinese/v4/ja/thumb-01..08.jpg), khớp theo tên bộ tiếng Việt. Bộ nào chưa có tranh thì dùng ô quạt.
 */
export const JA = {
  green: '#17392B',
  green2: '#2A5E44',
  greenSoft: '#E6F1E0',
  gold: '#D9B45A',
  goldLine: '#E8D3A0',
  goldSoft: '#F5E8C2',
  cream: '#FFF9EC',
  card: '#FFFDF7',
  heroTitle: '#FFF6E0',
  heroEyebrow: '#EFD38A',
  ink: '#1F2D25',
  ink2: '#5B6B60',
} as const;

/** Màu nền các ô cách luyện của bài Nhật: xanh rừng, vàng, đỏ son, xoay vòng. */
export const JA_TILE_TONES = ['#2A5E44', '#B8862B', '#A4232F', '#17392B', '#3F7A57', '#C49A3C'] as const;

/** Bài "từ riêng lẻ" có đuôi `-tu-NN` (xem east-asian-vocab.ts); còn lại là bài hội thoại. */
export const isVocabLesson = (slug: string): boolean => slug.includes('-tu-');

/** Bài hội thoại Irodori: slug có `irodori`, không phải bài từ riêng lẻ. Sách JLPT là bài từ, không tính là hội thoại. */
export const isDialogueLesson = (slug: string): boolean => slug.includes('irodori') && !isVocabLesson(slug);

export const JA_THUMB: Record<string, number> = {
  'Tiếng Nhật đầu tiên': require('../../../../assets/chinese/v4/ja/thumb-01.webp') as number,
  'Về bản thân': require('../../../../assets/chinese/v4/ja/thumb-02.webp') as number,
  'Món ăn yêu thích': require('../../../../assets/chinese/v4/ja/thumb-03.webp') as number,
  'Nhà ở và nơi làm việc': require('../../../../assets/chinese/v4/ja/thumb-04.webp') as number,
  'Sinh hoạt hằng ngày': require('../../../../assets/chinese/v4/ja/thumb-05.webp') as number,
  'Sở thích của tôi': require('../../../../assets/chinese/v4/ja/thumb-06.webp') as number,
  'Đi quanh thành phố': require('../../../../assets/chinese/v4/ja/thumb-07.webp') as number,
  'Ở cửa hàng': require('../../../../assets/chinese/v4/ja/thumb-08.webp') as number,
  'Ngày nghỉ': require('../../../../assets/chinese/v4/ja/thumb-09.webp') as number,
};

/** Sticker vẽ bằng ChatGPT (bộ v2): trang trí đầu trang và góc bài. */
export const JA_STICKER = {
  daruma: require('../../../../assets/chinese/v4/ja/ja-st-daruma.webp') as number,
  maneki: require('../../../../assets/chinese/v4/ja/ja-st-maneki.webp') as number,
  crane: require('../../../../assets/chinese/v4/ja/ja-st-crane.webp') as number,
  ema: require('../../../../assets/chinese/v4/ja/ja-st-ema.webp') as number,
  sakura: require('../../../../assets/chinese/v4/ja/ja-st-sakura.webp') as number,
  hanko: require('../../../../assets/chinese/v4/ja/ja-st-hanko.webp') as number,
} as const;

/** Tranh mỗi cách luyện (bộ icon v1). Các chế độ phụ dùng chung tranh với chế độ gần nhất. */
export const JA_MODE_ART: Record<string, number> = {
  learn: require('../../../../assets/chinese/v4/ja/ja-md-learn.webp') as number,
  dictation: require('../../../../assets/chinese/v4/ja/ja-md-dictation.webp') as number,
  cloze: require('../../../../assets/chinese/v4/ja/ja-md-cloze.webp') as number,
  speak: require('../../../../assets/chinese/v4/ja/ja-md-speak.webp') as number,
  test: require('../../../../assets/chinese/v4/ja/ja-md-test.webp') as number,
  game: require('../../../../assets/chinese/v4/ja/ja-md-game.webp') as number,
  pairs: require('../../../../assets/chinese/v4/ja/ja-md-pairs.webp') as number,
  hangman: require('../../../../assets/chinese/v4/ja/ja-md-hangman.webp') as number,
  abcd: require('../../../../assets/chinese/v4/ja/ja-md-abcd.webp') as number,
  listen: require('../../../../assets/chinese/v4/ja/ja-md-dictation.webp') as number,
  sentence: require('../../../../assets/chinese/v4/ja/ja-md-cloze.webp') as number,
  quiz: require('../../../../assets/chinese/v4/ja/ja-md-test.webp') as number,
  advert: require('../../../../assets/chinese/v4/ja/ja-md-test.webp') as number,
  flyer: require('../../../../assets/chinese/v4/ja/ja-md-test.webp') as number,
};

/** Cảnh minh hoạ của từng Bài hội thoại (1..18), vẽ bằng ChatGPT (bộ cảnh A và B). Phần 2/3 dùng chung cảnh của Bài. */
export const JA_SCENE: Record<number, number> = {
  1: require('../../../../assets/chinese/v4/ja/ja-scene-b01.webp') as number,
  2: require('../../../../assets/chinese/v4/ja/ja-scene-b02.webp') as number,
  3: require('../../../../assets/chinese/v4/ja/ja-scene-b03.webp') as number,
  4: require('../../../../assets/chinese/v4/ja/ja-scene-b04.webp') as number,
  5: require('../../../../assets/chinese/v4/ja/ja-scene-b05.webp') as number,
  6: require('../../../../assets/chinese/v4/ja/ja-scene-b06.webp') as number,
  7: require('../../../../assets/chinese/v4/ja/ja-scene-b07.webp') as number,
  8: require('../../../../assets/chinese/v4/ja/ja-scene-b08.webp') as number,
  9: require('../../../../assets/chinese/v4/ja/ja-scene-b09.webp') as number,
  10: require('../../../../assets/chinese/v4/ja/ja-scene-b10.webp') as number,
  11: require('../../../../assets/chinese/v4/ja/ja-scene-b11.webp') as number,
  12: require('../../../../assets/chinese/v4/ja/ja-scene-b12.webp') as number,
  13: require('../../../../assets/chinese/v4/ja/ja-scene-b13.webp') as number,
  14: require('../../../../assets/chinese/v4/ja/ja-scene-b14.webp') as number,
  15: require('../../../../assets/chinese/v4/ja/ja-scene-b15.webp') as number,
  16: require('../../../../assets/chinese/v4/ja/ja-scene-b16.webp') as number,
  17: require('../../../../assets/chinese/v4/ja/ja-scene-b17.webp') as number,
  18: require('../../../../assets/chinese/v4/ja/ja-scene-b18.webp') as number,
};

/** Lấy cảnh theo số Bài trong tên bài ("Bài 7 · Phần 2 · ..."); bài từ riêng lẻ không có cảnh. */
export function sceneOf(nameVi: string): number | undefined {
  const m = nameVi.match(/Bài (\d+)/);
  return m ? JA_SCENE[Number(m[1])] : undefined;
}

/** Tranh riêng của từng bài từ riêng lẻ (50 bài, khoá theo slug bài). Vẽ bằng ChatGPT, bộ tranh A–F (xem docs/design/chinese-vocab/raw/v5/ja). */
export const JA_SET_ART: Record<string, number> = {
  'book-irodori-starter-topic-01-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-01.webp') as number,
  'book-irodori-starter-topic-01-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-02.webp') as number,
  'book-irodori-starter-topic-01-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-03.webp') as number,
  'book-irodori-starter-topic-02-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-04.webp') as number,
  'book-irodori-starter-topic-02-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-05.webp') as number,
  'book-irodori-starter-topic-02-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-06.webp') as number,
  'book-irodori-starter-topic-02-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-07.webp') as number,
  'book-irodori-starter-topic-03-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-08.webp') as number,
  'book-irodori-starter-topic-03-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-09.webp') as number,
  'book-irodori-starter-topic-03-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-10.webp') as number,
  'book-irodori-starter-topic-03-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-11.webp') as number,
  'book-irodori-starter-topic-03-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-12.webp') as number,
  'book-irodori-starter-topic-03-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-13.webp') as number,
  'book-irodori-starter-topic-04-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-14.webp') as number,
  'book-irodori-starter-topic-04-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-15.webp') as number,
  'book-irodori-starter-topic-04-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-16.webp') as number,
  'book-irodori-starter-topic-04-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-17.webp') as number,
  'book-irodori-starter-topic-04-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-18.webp') as number,
  'book-irodori-starter-topic-04-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-19.webp') as number,
  'book-irodori-starter-topic-05-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-20.webp') as number,
  'book-irodori-starter-topic-05-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-21.webp') as number,
  'book-irodori-starter-topic-05-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-22.webp') as number,
  'book-irodori-starter-topic-05-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-23.webp') as number,
  'book-irodori-starter-topic-05-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-24.webp') as number,
  'book-irodori-starter-topic-05-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-25.webp') as number,
  'book-irodori-starter-topic-06-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-26.webp') as number,
  'book-irodori-starter-topic-06-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-27.webp') as number,
  'book-irodori-starter-topic-06-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-28.webp') as number,
  'book-irodori-starter-topic-06-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-29.webp') as number,
  'book-irodori-starter-topic-06-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-30.webp') as number,
  'book-irodori-starter-topic-06-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-31.webp') as number,
  'book-irodori-starter-topic-07-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-32.webp') as number,
  'book-irodori-starter-topic-07-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-33.webp') as number,
  'book-irodori-starter-topic-07-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-34.webp') as number,
  'book-irodori-starter-topic-07-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-35.webp') as number,
  'book-irodori-starter-topic-07-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-36.webp') as number,
  'book-irodori-starter-topic-07-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-37.webp') as number,
  'book-irodori-starter-topic-08-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-38.webp') as number,
  'book-irodori-starter-topic-08-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-39.webp') as number,
  'book-irodori-starter-topic-08-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-40.webp') as number,
  'book-irodori-starter-topic-08-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-41.webp') as number,
  'book-irodori-starter-topic-08-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-42.webp') as number,
  'book-irodori-starter-topic-08-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-43.webp') as number,
  'book-irodori-starter-topic-08-tu-07': require('../../../../assets/chinese/v4/ja/ja-set-44.webp') as number,
  'book-irodori-starter-topic-09-tu-01': require('../../../../assets/chinese/v4/ja/ja-set-45.webp') as number,
  'book-irodori-starter-topic-09-tu-02': require('../../../../assets/chinese/v4/ja/ja-set-46.webp') as number,
  'book-irodori-starter-topic-09-tu-03': require('../../../../assets/chinese/v4/ja/ja-set-47.webp') as number,
  'book-irodori-starter-topic-09-tu-04': require('../../../../assets/chinese/v4/ja/ja-set-48.webp') as number,
  'book-irodori-starter-topic-09-tu-05': require('../../../../assets/chinese/v4/ja/ja-set-49.webp') as number,
  'book-irodori-starter-topic-09-tu-06': require('../../../../assets/chinese/v4/ja/ja-set-50.webp') as number,
};

/** Tranh ba nhóm trạng thái (đã nhớ, chưa nhớ, cần ôn). */
export const JA_STATUS_ART: Record<string, number> = {
  mastered: JA_STICKER.sakura,
  new: JA_STICKER.crane,
  review: JA_STICKER.daruma,
};
