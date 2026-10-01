/**
 * Ảnh kết quả Đề của tuần (1080×1080) để khoe lên Facebook / Zalo — vẽ bằng
 * canvas ngay trên máy, không thư viện, không máy chủ. Chỉ chạy trên web.
 *
 * Ảnh là thứ lan đi được: một tấm thẻ đẹp kèm đường dẫn là lời mời tự nhiên
 * nhất cho bạn bè vào làm cùng đề.
 */
import { SITE_HOST } from '@/lib/site';

export type ShareCardData = {
  weekNumber: number;
  weekRange: string;
  score: number;
  total: number;
  time: string;
  /** null khi chưa có bảng xếp hạng (chưa ai khác làm, hoặc đang ngoại tuyến). */
  topPercent: number | null;
  participants: number;
};

const SITE = `${SITE_HOST}/weekly`;

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function drawShareCard(d: ShareCardData): HTMLCanvasElement {
  const S = 1080;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const font = (weight: number, size: number) => `${weight} ${size}px "Plus Jakarta Sans", system-ui, sans-serif`;

  // Nền loang chàm → tím → hồng, và vài khối tròn mờ tạo chiều sâu.
  const bg = g.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, '#4f46e5');
  bg.addColorStop(0.55, '#7c3aed');
  bg.addColorStop(1, '#db2777');
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);
  for (const [x, y, r, a] of [
    [900, 160, 260, 0.14],
    [120, 940, 300, 0.12],
    [980, 900, 140, 0.1],
  ] as const) {
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // Thẻ trắng ở giữa, có "bề dày" 3D phía dưới.
  g.fillStyle = 'rgba(30,27,75,0.35)';
  roundRect(g, 110, 250, 860, 600, 56);
  g.fill();
  g.fillStyle = '#ffffff';
  roundRect(g, 110, 230, 860, 600, 56);
  g.fill();

  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = font(800, 44);
  g.fillText('Band 9 · Đề của tuần', S / 2, 120);
  g.font = font(600, 34);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillText(`Tuần ${d.weekNumber} · ${d.weekRange}`, S / 2, 176);

  g.fillStyle = '#312e81';
  g.font = font(800, 210);
  g.fillText(`${d.score}/${d.total}`, S / 2, 490);
  g.font = font(600, 40);
  g.fillStyle = '#64748b';
  g.fillText(`câu đúng · ${d.time}`, S / 2, 560);

  if (d.topPercent !== null) {
    const label = `Top ${d.topPercent}% trong ${d.participants.toLocaleString('vi-VN')} người`;
    g.font = font(800, 48);
    const w = g.measureText(label).width + 80;
    g.fillStyle = '#fef3c7';
    roundRect(g, S / 2 - w / 2, 610, w, 92, 46);
    g.fill();
    g.fillStyle = '#b45309';
    g.fillText(label, S / 2, 672);
  }

  g.font = font(600, 34);
  g.fillStyle = '#475569';
  g.fillText('10 câu SAT · cả nước cùng một đề', S / 2, 780);

  g.fillStyle = '#ffffff';
  g.font = font(800, 40);
  g.fillText('Bạn làm được mấy câu?', S / 2, 930);
  g.font = font(600, 32);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillText(SITE, S / 2, 985);
  return c;
}

export function shareCardBlob(d: ShareCardData): Promise<Blob | null> {
  return new Promise((resolve) => drawShareCard(d).toBlob((b) => resolve(b), 'image/png'));
}

/** Tải ảnh về máy. */
export async function downloadShareCard(d: ShareCardData): Promise<void> {
  const blob = await shareCardBlob(d);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `readup-de-cua-tuan-${d.weekNumber}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Chia sẻ qua bảng chia sẻ của máy (điện thoại: Zalo, Messenger…). Máy không hỗ
 * trợ gửi ảnh thì gửi chữ + đường dẫn; không hỗ trợ chia sẻ thì chép đường dẫn.
 * Trả về cách đã dùng để màn hình báo lại cho người dùng.
 */
export async function shareResult(d: ShareCardData): Promise<'shared' | 'copied' | 'failed'> {
  const text = `Mình làm Đề của tuần ${d.weekNumber} trên Band 9 được ${d.score}/${d.total} câu${
    d.topPercent !== null ? ` — top ${d.topPercent}% cả nước` : ''
  }. Bạn thử xem được mấy câu?`;
  const url = `https://${SITE}`;
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  try {
    const blob = await shareCardBlob(d);
    const file = blob ? new File([blob], `readup-tuan-${d.weekNumber}.png`, { type: 'image/png' }) : null;
    if (file && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], text, url });
      return 'shared';
    }
    if (nav.share) {
      await nav.share({ text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
