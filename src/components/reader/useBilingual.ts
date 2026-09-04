import { useCallback, useState } from 'react';

import { useAuthStore } from '@/store/useAuthStore';

/**
 * Bật/tắt bản dịch tiếng Việt cho một bài đọc.
 *
 * HAI BƯỚC, và tách hai bước là cả điểm của thiết kế này:
 *
 *   GET  — lấy bản dịch đã có trong bộ nhớ đệm dùng chung. Không cần đăng nhập,
 *          trả về gần như tức thì, và đây là đường mà GẦN NHƯ MỌI lượt xem đi qua
 *          sau lần đầu tiên.
 *   POST — dịch bài chưa ai dịch. Cần đăng nhập vì nó gọi AI, tức là tiền thật.
 *
 * Nhờ bộ nhớ đệm dùng chung, người thứ hai đọc cùng một bài không phải chờ và
 * không tốn gì. Chi phí có trần cứng bằng số bài trong kho, không nhân theo số
 * người dùng.
 *
 * Trạng thái bật/tắt KHÔNG lưu lại giữa các bài: mỗi bài là một quyết định
 * riêng. Người học thường bật song ngữ ở bài khó và tắt ở bài dễ, nên nhớ lựa
 * chọn cũ là đoán sai nhiều hơn đoán đúng.
 */
export type Bilingual = {
  on: boolean;
  loading: boolean;
  error: string | null;
  paragraphs: string[] | null;
  toggle: () => Promise<void>;
};

type Res = {
  paragraphs?: string[] | null;
  done?: boolean;
  translated?: number;
  error?: string;
};

export function useBilingual(articleId: string): Bilingual {
  const token = useAuthStore((s) => s.session?.access_token ?? null);

  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);

  const toggle = useCallback(async () => {
    if (on) {
      setOn(false);
      return;
    }
    if (paragraphs && paragraphs.every(Boolean)) {
      setOn(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cached = await fetch(`/api/translate?articleId=${encodeURIComponent(articleId)}`);
      const first = (await cached.json()) as Res;
      if (!cached.ok) throw new Error(first.error ?? `Lỗi ${cached.status}`);

      // Có phần nào rồi thì hiện ngay phần đó — người đọc bắt đầu đọc được
      // trong lúc phần còn lại đang dịch.
      if (first.paragraphs) {
        setParagraphs(first.paragraphs);
        setOn(true);
      }
      if (first.done) return;

      if (!token) {
        setOn(!!first.paragraphs);
        setError('Bài này chưa dịch xong. Đăng nhập để dịch tiếp — dịch xong thì ai đọc cũng thấy.');
        return;
      }

      /*
        Gọi lại từng lát cho tới khi xong.

        Trần vòng lặp là bắt buộc: nếu máy chủ vì lý do nào đó luôn trả `done:
        false` mà không tiến thêm, vòng lặp không trần sẽ nã request mãi mãi và
        đốt tiền AI. `guard` chặn đúng chuyện đó, còn `translated === 0` bắt
        trường hợp một lượt không dịch được đoạn nào.
      */
      const MAX_ROUNDS = 12;
      for (let round = 0; round < MAX_ROUNDS; round += 1) {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId }),
        });
        const body = (await res.json()) as Res;
        if (!res.ok || !body.paragraphs) throw new Error(body.error ?? `Lỗi ${res.status}`);

        setParagraphs(body.paragraphs);
        setOn(true);
        if (body.done) return;
        if (!body.translated) {
          setError('Còn vài đoạn chưa dịch được. Bấm lại để thử tiếp.');
          return;
        }
      }
      setError('Bài này dài hơn dự kiến — bấm lại để dịch nốt phần còn lại.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không dịch được bài này.');
    } finally {
      setLoading(false);
    }
  }, [articleId, on, paragraphs, token]);

  return { on, loading, error, paragraphs, toggle };
}
