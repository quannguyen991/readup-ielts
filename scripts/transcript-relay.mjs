#!/usr/bin/env node
/**
 * Cầu lấy phụ đề YouTube — CHẠY Ở MÁY NHÀ, không chạy trên Vercel.
 *
 * VÌ SAO PHẢI CÓ. YouTube chặn theo địa chỉ IP chứ không theo cách gọi. Đo lại
 * ngày 12/09/2026, từ máy chủ Vercel mọi đường đều tắc: InnerTube trả 0 bảng
 * phụ đề, Piped trả 525 và 403, Invidious liệt kê được 6 bản nhưng tải nội dung
 * về 0 byte. Cùng lúc đó `yt-dlp` chạy trên máy ở nhà lấy về 14,5 KB phụ đề của
 * đúng video ấy trong khoảng một giây. Khác nhau nằm ở IP dân cư.
 *
 * Nên đường tự động là: app hỏi cầu này, cầu chạy yt-dlp rồi trả phụ đề về.
 * Cầu tắt thì app rơi về cách dán phụ đề tay như trước — không hỏng gì, chỉ
 * chậm hơn một phút.
 *
 * KHÔNG LƯU PHỤ ĐỀ. Lấy xong trả về rồi xoá thư mục tạm: đây là nội dung của
 * chủ kênh, app chỉ mượn trong đúng một phiên luyện.
 *
 * Chạy:
 *   node scripts/transcript-relay.mjs --key <chuỗi bí mật> [--port 8787]
 *
 * Rồi mở ra ngoài (dự án đã có sẵn cloudflared):
 *   npx cloudflared tunnel --url http://localhost:8787
 *
 * Lấy địa chỉ https://… nó in ra, khai lên Vercel:
 *   YT_RELAY_URL = https://…            (địa chỉ cầu)
 *   YT_RELAY_KEY = <đúng chuỗi bí mật>  (phải trùng --key)
 *
 * KHOÁ LÀ BẮT BUỘC. Không có khoá thì bất kỳ ai tìm ra địa chỉ tunnel đều sai
 * được máy ở nhà tải phụ đề hộ họ — tức là biến máy của bạn thành máy chủ công
 * cộng, và IP nhà bạn thành thứ YouTube sẽ chặn tiếp.
 */
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

function arg(name, fallback = null) {
  const at = process.argv.indexOf(`--${name}`);
  return at > -1 ? process.argv[at + 1] : fallback;
}

const PORT = Number(arg('port', '8787'));
const KEY = arg('key');
/** Windows thường không có lệnh `yt-dlp` trên PATH nhưng có `python -m yt_dlp`. */
const PYTHON = arg('python', 'python');
const TIMEOUT_MS = 45_000;

if (!KEY || KEY.length < 16) {
  console.error('Thiếu --key, hoặc khoá ngắn hơn 16 ký tự. Đặt một chuỗi ngẫu nhiên dài.');
  process.exit(1);
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

async function fetchVtt(videoId) {
  const dir = await mkdtemp(join(tmpdir(), 'readup-cap-'));
  try {
    await run(
      PYTHON,
      [
        '-m',
        'yt_dlp',
        '--skip-download',
        // Ưu tiên phụ đề người làm; không có thì lấy bản máy nghe tự sinh.
        '--write-sub',
        '--write-auto-sub',
        /*
          Liệt kê thẳng vài mã tiếng Anh, KHÔNG dùng 'en.*'.

          'en.*' khớp cả những bản YouTube tự dịch máy sang tiếng Anh từ ngôn
          ngữ khác ('en-de-DE', 'en-fr-FR'…). yt-dlp sẽ tải lần lượt hàng chục
          bản như thế, và YouTube trả 429 Too Many Requests giữa chừng — đo được
          ngay lần chạy thử đầu tiên.
        */
        '--sub-langs',
        'en,en-US,en-GB,en-orig',
        '--sub-format',
        'vtt',
        '--no-playlist',
        '--no-warnings',
        '-o',
        join(dir, 'cap.%(ext)s'),
        `https://www.youtube.com/watch?v=${videoId}`,
      ],
      { timeout: TIMEOUT_MS, windowsHide: true },
    );

    const files = (await readdir(dir)).filter((f) => f.endsWith('.vtt'));
    if (files.length === 0) return null;
    // Bản do người làm (cap.en.vtt) đứng trước bản tự sinh nếu có cả hai.
    files.sort();
    return await readFile(join(dir, files[0]), 'utf8');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  const json = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === '/health') {
    json(200, { ok: true });
    return;
  }

  if (url.pathname !== '/transcript') {
    json(404, { error: 'Không có đường này.' });
    return;
  }

  if (req.headers['x-relay-key'] !== KEY) {
    json(401, { error: 'Sai khoá.' });
    return;
  }

  const videoId = url.searchParams.get('v') ?? '';
  if (!VIDEO_ID.test(videoId)) {
    json(400, { error: 'Mã video không hợp lệ.' });
    return;
  }

  try {
    const vtt = await fetchVtt(videoId);
    if (!vtt) {
      json(404, { error: 'Video này không có phụ đề tiếng Anh.' });
      return;
    }
    console.log(new Date().toISOString(), videoId, `${vtt.length} byte`);
    json(200, { vtt });
  } catch (err) {
    console.error(new Date().toISOString(), videoId, err?.message ?? err);
    json(502, { error: 'Không lấy được phụ đề.' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Cầu phụ đề đang chạy ở http://127.0.0.1:${PORT}`);
  console.log('Mở ra ngoài:  npx cloudflared tunnel --url http://localhost:' + PORT);
});
