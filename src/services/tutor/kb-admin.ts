/**
 * CHỈ DÙNG TỪ SCRIPT. Gọi phần quản trị của LightRAG: nạp tài liệu và hỏi trạng thái.
 *
 * TÁCH KHỎI `knowledge-base.ts` CÓ CHỦ ĐÍCH. Tệp kia là đường chạy của người
 * dùng: chỉ có `/query`, và được `/api/tutor/kb` gọi sau khi đã kiểm đăng nhập
 * và trừ lượt. Tệp này gọi những thứ ĐỔI ĐƯỢC CẢ KHO. Để chung một tệp là sớm
 * muộn cũng có ngày một đường HTTP công khai nhập khẩu nhầm hàm nạp tài liệu.
 *
 * Không có tệp nào trong `app/api/**` được phép nhập khẩu tệp này.
 */
import 'dotenv/config';

export type KbAdminConfig = { url: string; key: string };

export type StatusCounts = {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  all: number;
};

/**
 * Đọc cấu hình từ env, và nói rõ thiếu khoá nào.
 *
 * Ném lỗi thay vì trả giá trị mặc định: một script nạp kho chạy với URL rỗng sẽ
 * im lặng không làm gì, và người chạy tưởng là đã nạp xong.
 */
export function docCauHinh(env: NodeJS.ProcessEnv = process.env): KbAdminConfig {
  const url = (env.KB_RAG_URL ?? '').trim().replace(/\/$/, '');
  const key = (env.KB_RAG_API_KEY ?? '').trim();
  const thieu = [!url && 'KB_RAG_URL', !key && 'KB_RAG_API_KEY'].filter(Boolean);
  if (thieu.length) {
    throw new Error(
      `Thiếu ${thieu.join(' và ')} trong .env — xem mô tả trong .env.example. ` +
        'Kho tri thức chạy ở máy HoaiDuc, phơi ra ngoài bằng cloudflared.',
    );
  }
  return { url, key };
}

async function goi(
  cfg: KbAdminConfig,
  duong: string,
  init: { method?: string; body?: unknown; timeoutMs?: number } = {},
): Promise<unknown> {
  const res = await fetch(`${cfg.url}${duong}`, {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.key },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(init.timeoutMs ?? 180_000),
  });
  const van = await res.text();
  if (!res.ok) throw new Error(`${duong} trả HTTP ${res.status}: ${van.slice(0, 200)}`);
  return van ? JSON.parse(van) : null;
}

/**
 * Nạp một mẻ tài liệu. LightRAG nhận xong trả về ngay — việc index chạy nền
 * trong hàng đợi của nó, nên trả về `true` KHÔNG có nghĩa là đã index xong.
 */
export async function napMe(
  cfg: KbAdminConfig,
  docs: ReadonlyArray<{ text: string; fileSource: string }>,
): Promise<void> {
  if (docs.length === 0) return;
  await goi(cfg, '/documents/texts', {
    method: 'POST',
    body: {
      texts: docs.map((d) => d.text),
      file_sources: docs.map((d) => d.fileSource),
    },
  });
}

export async function demTrangThai(cfg: KbAdminConfig): Promise<StatusCounts> {
  const body = (await goi(cfg, '/documents/status_counts', { timeoutMs: 30_000 })) as {
    status_counts?: Partial<StatusCounts>;
  };
  const c = body?.status_counts ?? {};
  return {
    pending: c.pending ?? 0,
    processing: c.processing ?? 0,
    processed: c.processed ?? 0,
    failed: c.failed ?? 0,
    all: c.all ?? 0,
  };
}

export async function trangThaiDuongOng(
  cfg: KbAdminConfig,
): Promise<{ busy: boolean; job: string; message: string }> {
  const p = (await goi(cfg, '/documents/pipeline_status', { timeoutMs: 30_000 })) as {
    busy?: boolean;
    job_name?: string;
    latest_message?: string;
  };
  return {
    busy: Boolean(p?.busy),
    job: p?.job_name ?? '-',
    message: (p?.latest_message ?? '').trim(),
  };
}
