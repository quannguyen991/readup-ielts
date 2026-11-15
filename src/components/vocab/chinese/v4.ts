/**
 * Tài sản v4 (ChatGPT vẽ, đã tách nền magenta bằng scripts ở scratchpad): icon cách luyện, khung kiểu thẻ
 * “Cách luyện”, nhãn dán trang trí và nền phố cổ. Đặt tên theo nội dung hình, không theo chỗ dùng.
 * Nguồn: assets/chinese/v4 (mode-icons, frames, stickers, backgrounds).
 */
export const ZH_V4 = {
  /** Icon từng cách luyện, khớp khoá trong ZhPracticeGrid. */
  icon: {
    learn: require('../../../../assets/chinese/v4/mode-icons/learn.png') as number,
    abcd: require('../../../../assets/chinese/v4/mode-icons/abcd.png') as number,
    listen: require('../../../../assets/chinese/v4/mode-icons/listen.png') as number,
    speak: require('../../../../assets/chinese/v4/mode-icons/speak.png') as number,
    dictation: require('../../../../assets/chinese/v4/mode-icons/dictation.png') as number,
    cloze: require('../../../../assets/chinese/v4/mode-icons/cloze.png') as number,
    pairs: require('../../../../assets/chinese/v4/mode-icons/pairs.png') as number,
    test: require('../../../../assets/chinese/v4/mode-icons/test.png') as number,
    game: require('../../../../assets/chinese/v4/mode-icons/game.png') as number,
  } as Record<string, number>,
  /** Khung: thẻ kem, medallion đám mây, con dấu tròn, vạch ngang, nút đỏ viền vàng. */
  frame: {
    card: require('../../../../assets/chinese/v4/frames/card.png') as number,
    cloud: require('../../../../assets/chinese/v4/frames/cloud.png') as number,
    seal: require('../../../../assets/chinese/v4/frames/seal.png') as number,
    divider: require('../../../../assets/chinese/v4/frames/divider.png') as number,
    pill: require('../../../../assets/chinese/v4/frames/pill.png') as number,
  },
  /** Nhãn dán và chi tiết trang trí (a-xx: tấm 1; b-xx: tấm 2). */
  sticker: {
    lanternPair: require('../../../../assets/chinese/v4/stickers/a-02.png') as number,
    goldCloud: require('../../../../assets/chinese/v4/stickers/a-03.png') as number,
    knot: require('../../../../assets/chinese/v4/stickers/a-04.png') as number,
    peony: require('../../../../assets/chinese/v4/stickers/a-05.png') as number,
    swallow: require('../../../../assets/chinese/v4/stickers/a-08.png') as number,
    cherryBanner: require('../../../../assets/chinese/v4/stickers/a-12.png') as number,
    cloudBadge: require('../../../../assets/chinese/v4/stickers/b-02.png') as number,
    medallion: require('../../../../assets/chinese/v4/stickers/b-03.png') as number,
    cornerCherry: require('../../../../assets/chinese/v4/stickers/b-04.png') as number,
    bell: require('../../../../assets/chinese/v4/stickers/b-05.png') as number,
    lotus: require('../../../../assets/chinese/v4/stickers/b-07.png') as number,
    bamboo: require('../../../../assets/chinese/v4/stickers/b-08.png') as number,
    cornerScroll: require('../../../../assets/chinese/v4/stickers/b-10.png') as number,
  },
  /** Nền: phố cổ có cổng và đèn lồng (không chữ), banner đầu bài (không chữ). */
  bg: {
    street: require('../../../../assets/chinese/v4/backgrounds/page-bg-street.jpg') as number,
    banner: require('../../../../assets/chinese/v4/backgrounds/banner-hero.jpg') as number,
    /** Banner theo cấp HSK 2..7 (cấp 1 dùng `banner`). */
    level: {
      2: require('../../../../assets/chinese/v4/backgrounds/banner-hsk2.jpg') as number,
      3: require('../../../../assets/chinese/v4/backgrounds/banner-hsk3.jpg') as number,
      4: require('../../../../assets/chinese/v4/backgrounds/banner-hsk4.jpg') as number,
      5: require('../../../../assets/chinese/v4/backgrounds/banner-hsk5.jpg') as number,
      6: require('../../../../assets/chinese/v4/backgrounds/banner-hsk6.jpg') as number,
      7: require('../../../../assets/chinese/v4/backgrounds/banner-hsk7.jpg') as number,
    },
  },
  /** Bộ Nhật Bản (ChatGPT vẽ, nền magenta đã tách): banner đầu sách, nền trang, sáu hoạ tiết rời. */
  ja: {
    banner: require('../../../../assets/chinese/v4/ja/banner-ja.jpg') as number,
    bg: require('../../../../assets/chinese/v4/ja/page-bg-ja.jpg') as number,
    /** Góc khung v2 (vẽ đúng hướng góc trên-trái, `ZhLevelCorners` lật ra bốn góc). */
    corner: require('../../../../assets/chinese/v4/ja/ja-frame-corner-v2.png') as number,
    /** Thanh ngang và thanh dọc v2: seigaiha vàng–xanh, hoa anh đào, dùng làm vạch trang trí. */
    frameH: require('../../../../assets/chinese/v4/ja/ja-frame-hbar-v2.png') as number,
    frameV: require('../../../../assets/chinese/v4/ja/ja-frame-vbar-v2.png') as number,
    torii: require('../../../../assets/chinese/v4/ja/ja-torii.png') as number,
    fan: require('../../../../assets/chinese/v4/ja/ja-fan.png') as number,
    lantern: require('../../../../assets/chinese/v4/ja/ja-lantern.png') as number,
    koi: require('../../../../assets/chinese/v4/ja/ja-koi.png') as number,
    fuji: require('../../../../assets/chinese/v4/ja/ja-fuji.png') as number,
    sakura: require('../../../../assets/chinese/v4/ja/ja-sakura.png') as number,
  },
} as const;
