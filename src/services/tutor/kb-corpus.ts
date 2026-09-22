import type { ArticleBody, SeedIndexEntry } from '@/services/ingest/seed-writer';

/**
 * Dựng kho tài liệu để nạp vào LightRAG, từ chính seed bài đọc của app.
 *
 * VÌ SAO PHẢI CÓ TỆP NÀY. Lần nạp đầu tiên chạy bằng một script rời đặt thẳng
 * trên máy HoaiDuc (`readup-rag/ingest.py` + `corpus-full.jsonl`). Cách đó nạp
 * được, nhưng kho trong LightRAG KHÔNG dựng lại được từ repo: thêm bài mới thì
 * không ai biết phải nạp lại bằng gì, và không có gì kiểm được rằng thứ nằm
 * trong chỉ mục đúng là thứ app đang phát cho người học. Ở đây định nghĩa lại
 * đúng phép biến đổi đó, bằng mã có kiểm thử.
 *
 * RÀNG BUỘC PHẢI GIỮ NGUYÊN, vì chỉ mục cũ đã nạp theo nó:
 *   - `fileSource` = "Tên bài [chủ đề]". LightRAG trả chuỗi này lại ở
 *     `references[].file_path`, và `knowledge-base.parseReferences` đọc đúng chỗ
 *     đó để hiện nguồn. Đổi cách ghép ở đây là cắt đường dẫn nguồn của câu trả lời.
 *   - `text` = NGUYÊN VĂN thân bài, không kèm tiêu đề, không kèm dòng mô tả.
 *     Nhét thêm siêu dữ liệu vào thân làm trích hồi kéo nhầm: một câu hỏi về
 *     "chủ đề môi trường" sẽ khớp mọi bài có chữ environment trong đầu tài liệu.
 */

export type KbDoc = {
  /** Định danh bài trong seed — dùng để nạp tiếp chỗ dở, không gửi cho LightRAG. */
  id: string;
  /** Tên hiện cho người đọc khi dẫn nguồn. */
  fileSource: string;
  /** Thân bài, nguyên văn. */
  text: string;
};

/**
 * Ghép tên nguồn. Giữ đúng dạng "Tên bài [chủ đề]" của lần nạp đầu.
 *
 * Bài không có chủ đề thì chỉ còn tên — KHÔNG để lại cặp ngoặc rỗng, vì chuỗi
 * này hiện thẳng cho người học đọc.
 */
export function buildFileSource(title: string, topic?: string | null): string {
  const ten = (title ?? '').trim() || 'untitled';
  const chuDe = (topic ?? '').trim();
  return chuDe ? `${ten} [${chuDe}]` : ten;
}

/**
 * Một bài trong seed -> một tài liệu của kho. Trả `null` nghĩa là BỎ QUA bài đó.
 *
 * Bỏ qua khi không có thân bài. Đó không phải lỗi: trong kho có những bài chỉ
 * giữ phần mô tả và dẫn link ra nguồn gốc vì lý do bản quyền. Nạp phần mô tả
 * vào chỉ mục sẽ khiến kho trả lời như thể đã đọc cả bài — đúng kiểu bịa mà
 * `/api/tutor/kb` được dựng ra để chặn.
 */
export function buildKbDoc(
  meta: Pick<SeedIndexEntry, 'id' | 'title' | 'topic'>,
  body: Pick<ArticleBody, 'bodyText'> | null | undefined,
): KbDoc | null {
  const text = (body?.bodyText ?? '').trim();
  if (!text) return null;

  return {
    id: meta.id,
    fileSource: buildFileSource(meta.title, meta.topic),
    text,
  };
}

/**
 * Cắt danh sách thành từng mẻ.
 *
 * Nạp cả nghìn tài liệu trong một lượt POST thì máy chủ nhận xong mới trả lời,
 * và mất mạng giữa chừng là không biết đã vào được bao nhiêu. Mẻ nhỏ cho phép
 * ghi lại tiến độ sau mỗi mẻ và chạy tiếp đúng chỗ dở.
 */
export function batches<T>(items: readonly T[], size: number): T[][] {
  const buoc = Math.max(1, Math.floor(size));
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += buoc) out.push(items.slice(i, i + buoc));
  return out;
}

/**
 * Bỏ những bài đã nạp ở lần chạy trước.
 *
 * So theo `id` của seed chứ không theo `fileSource`: hai bài khác nhau có thể
 * trùng tên (bản gốc và bản rút gọn cùng tựa), còn `id` thì không.
 */
export function conLai(docs: readonly KbDoc[], daNap: ReadonlySet<string>): KbDoc[] {
  return docs.filter((d) => !daNap.has(d.id));
}
