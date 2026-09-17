import { useEffect, useState } from 'react';

/**
 * Từ điển CHI TIẾT của từng bài song ngữ: phiên âm, định nghĩa tiếng Anh, câu
 * ví dụ, từ đồng nghĩa.
 *
 * VÌ SAO TÁCH KHỎI TỪ ĐIỂN RÊ CHUỘT. Bảng rê chuột (nghĩa + từ loại) nhỏ, đi kèm
 * gói JS, nên hiện tức thì. Bản chi tiết cho vài nghìn dạng từ nặng hơn cả
 * megabyte — nhét vào gói JS là bắt MỌI người dùng, kể cả người chỉ vào làm
 * toán, tải về. Nên mỗi bài có một tệp riêng trong `public/bilingual-dict/`,
 * tải MỘT lần lúc mở bài (vài chục KB, trình duyệt giữ bộ đệm). Tới lúc người
 * đọc bấm vào từ thì dữ liệu đã nằm sẵn — không có lời gọi mạng nào lúc bấm.
 *
 * Dựng tệp: `node scripts/build-bilingual-dict.mjs`.
 */
export type RichEntry = {
  ipa: string;
  pos: string;
  /** Định nghĩa tiếng Anh ngắn, theo nghĩa dùng trong bài. */
  defEn: string;
  meaningVi: string;
  example: string;
  synonyms: string[];
};

/** Dạng lưu trong tệp: mảng thay cho object để tệp nhỏ hơn gần một nửa. */
type Packed = [ipa: string, pos: string, defEn: string, meaningVi: string, example: string, synonyms: string[]];

const CACHE = new Map<string, Record<string, RichEntry>>();
const PENDING = new Map<string, Promise<Record<string, RichEntry>>>();

function unpack(raw: Record<string, Packed>): Record<string, RichEntry> {
  const out: Record<string, RichEntry> = {};
  for (const [word, p] of Object.entries(raw)) {
    out[word] = { ipa: p[0], pos: p[1], defEn: p[2], meaningVi: p[3], example: p[4], synonyms: p[5] ?? [] };
  }
  return out;
}

export function loadArticleDictionary(articleId: string): Promise<Record<string, RichEntry>> {
  const hit = CACHE.get(articleId);
  if (hit) return Promise.resolve(hit);
  const pending = PENDING.get(articleId);
  if (pending) return pending;

  const job = fetch(`/bilingual-dict/${encodeURIComponent(articleId)}.json`)
    .then((res) => (res.ok ? (res.json() as Promise<Record<string, Packed>>) : {}))
    .then((raw) => {
      const table = unpack(raw as Record<string, Packed>);
      CACHE.set(articleId, table);
      return table;
    })
    // Không có tệp (bài mới chưa dựng từ điển) thì thẻ chi tiết vẫn mở với nghĩa rê chuột.
    .catch(() => ({}) as Record<string, RichEntry>)
    .finally(() => PENDING.delete(articleId));

  PENDING.set(articleId, job);
  return job;
}

/** Tra một dạng từ trong bảng đã tải, thử bỏ sở hữu cách và dấu nháy hai đầu. */
export function findRich(table: Record<string, RichEntry>, word: string): RichEntry | null {
  const lower = word.toLowerCase();
  const trimmed = lower.replace(/^['-]+|['-]+$/g, '');
  for (const key of [lower, trimmed, trimmed.replace(/'s$/, ''), trimmed.replace(/s'$/, 's')]) {
    if (table[key]) return table[key]!;
  }
  return null;
}

export function useArticleDictionary(articleId: string | null): Record<string, RichEntry> {
  const [table, setTable] = useState<Record<string, RichEntry>>(
    () => (articleId ? CACHE.get(articleId) : undefined) ?? {},
  );

  useEffect(() => {
    if (!articleId) return;
    let alive = true;
    void loadArticleDictionary(articleId).then((t) => {
      if (alive) setTable(t);
    });
    return () => {
      alive = false;
    };
  }, [articleId]);

  return table;
}
