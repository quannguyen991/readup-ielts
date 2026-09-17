import glossary from '@/data/seed/bilingual/glossary.json';

/**
 * Từ điển dựng sẵn cho kho đọc song ngữ — rê vào từ nào cũng có nghĩa NGAY.
 *
 * VÌ SAO KHÔNG TRA MẠNG. Bản trước chỉ có nghĩa sẵn cho vài từ mỗi đoạn; mọi từ
 * còn lại đi ba vòng mạng (từ điển tiếng Anh, MyMemory, AI) rồi mới hiện, nên
 * người đọc rê vào và phải nhìn "đang tra…" trong lúc mắt đã sang từ khác. Kho
 * song ngữ là văn bản ĐÓNG — 34 bài, biết trước từng chữ — nên soạn sẵn nghĩa
 * cho toàn bộ ~3.350 dạng từ xuất hiện trong đó là làm được một lần cho xong.
 *
 * Khoá là dạng từ ĐÚNG NHƯ TRONG BÀI (đã hạ chữ thường): "buildings" có nghĩa
 * "các toà nhà" chứ không quy về "building". Người đọc đang nhìn đúng dạng ấy.
 *
 * Soạn lại khi thêm bài: chạy `scripts/bilingual-glossary-words.mjs` để lấy danh
 * sách từ còn thiếu, soạn nghĩa, gộp vào `glossary.json`. Test
 * `offline-glossary.test.ts` sẽ đỏ nếu còn từ nào trong bài chưa có nghĩa.
 */

export type OfflineGloss = { word: string; meaningVi: string; pos: string };

const TABLE = glossary as unknown as Record<string, [string, string]>;

/** Các biến thể thử lần lượt: nguyên dạng, bỏ sở hữu cách, bỏ dấu nháy/gạch ở hai đầu. */
function candidates(word: string): string[] {
  const lower = word.toLowerCase();
  const trimmed = lower.replace(/^['-]+|['-]+$/g, '');
  return [lower, trimmed, trimmed.replace(/'s$/, ''), trimmed.replace(/s'$/, 's')];
}

export function offlineGloss(word: string): OfflineGloss | null {
  for (const key of candidates(word)) {
    const hit = TABLE[key];
    if (hit) return { word: key, meaningVi: hit[0], pos: hit[1] };
  }
  return null;
}

/**
 * Thường hoá MỘT token đúng như màn đọc làm trước khi tra — một chỗ duy nhất.
 *
 * Bài viết có dấu nháy cong (Vietnam’s), chữ có dấu (cafés, Māori) và gạch
 * nối dài (rice–shrimp). Bỏ thẳng mọi ký tự ngoài a-z thì ba kiểu ấy thành
 * "vietnams", "cafs", "riceshrimp" — không khoá nào khớp. Gập dấu và đổi dấu
 * câu cong về dạng thẳng TRƯỚC khi lọc.
 */
export function normaliseToken(raw: string): string {
  return raw
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/–/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9'-]/g, '');
}

/** Token có đáng tra không: phải có ít nhất một chữ cái và dài hơn một ký tự. */
export function isGlossable(token: string): boolean {
  return token.length > 1 && /[a-z]/.test(token);
}

/** Tách từ đúng như bộ dựng glossary — dùng chung cho test độ phủ. */
export function glossaryWordsOf(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/[A-Za-z][A-Za-z'-]*/g)) {
    const w = m[0].toLowerCase().replace(/'s$/, '').replace(/['-]+$/, '');
    if (w) out.push(w);
  }
  return out;
}
