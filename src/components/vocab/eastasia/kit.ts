import type { EaLang } from '@/data/learning-path/east-asian';

import { JA_UI, ZH_UI } from './ui';

/**
 * Bộ họa tiết giao diện theo tiếng. Gọi qua `KIT[lang].xxx` (có thể `undefined` nếu tấm ảnh
 * tương ứng chưa được sinh) để màn hình vẫn dựng được với phần còn lại.
 */
export type Kit = Partial<Record<string, number>>;

export const KIT: Record<EaLang, Kit> = { ja: JA_UI as Kit, zh: ZH_UI as Kit };

/** Bìa sách đi kèm theo slug sách. */
export const BOOK_COVER: Record<string, { lang: EaLang; key: string }> = {
  'book-irodori-starter': { lang: 'ja', key: 'bookStarter' },
  'book-irodori-elementary-1': { lang: 'ja', key: 'bookWave' },
  'book-irodori-elementary-2': { lang: 'ja', key: 'bookGreen' },
  'book-irodori-pre-intermediate': { lang: 'ja', key: 'bookWisteria' },
  'book-jlpt-open-vocabulary': { lang: 'ja', key: 'bookTorii' },
  'book-hsk-3-0': { lang: 'zh', key: 'bookHsk' },
  'book-hsk-2-0-community': { lang: 'zh', key: 'bookDragon' },
  'book-zh-tocfl-linzi': { lang: 'zh', key: 'bookLotus' },
  'book-zh-frequency-doudou-10k': { lang: 'zh', key: 'bookMoon' },
};

export const coverOf = (slug: string): number | undefined => {
  const c = BOOK_COVER[slug];
  return c ? KIT[c.lang][c.key] : undefined;
};

/** Huy hiệu của từng cấp theo thứ tự cấp (HSK 1…6, N5…N1). */
export const SEALS: Record<EaLang, readonly string[]> = {
  zh: ['sealCoin', 'sealIngot', 'sealKnot', 'sealFan', 'sealPagoda', 'sealPeony'],
  ja: ['sealTorii', 'sealFan', 'sealWave', 'sealSakura', 'sealFuji'],
};
