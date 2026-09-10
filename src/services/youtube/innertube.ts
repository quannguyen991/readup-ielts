import type { CaptionTrack } from './transcript';

/**
 * Lấy bảng phụ đề qua InnerTube — API mà chính trình phát YouTube gọi.
 *
 * VÌ SAO PHẢI ĐỔI ĐƯỜNG. Cách cũ tải trang `youtube.com/watch` rồi moi
 * `captionTracks` ra khỏi mã HTML. Cách ấy VẪN tìm thấy bảng phụ đề — đo được
 * 28 và 50 bản trên hai video thử — nhưng mọi `baseUrl` trong bảng đó giờ trả
 * về **200 kèm 0 byte**. Thêm `&fmt=json3`, `&fmt=srv3`, `&fmt=vtt`, thêm cả
 * `Referer` và `Origin`: vẫn 0 byte. Đường ấy chết, không phải hỏng tạm.
 *
 * Gọi InnerTube với client ANDROID thì cùng video ấy trả về 28 bản phụ đề và
 * `baseUrl` tải được 8.256 byte XML thật. Client IOS còn cho thêm `fmt=json3`.
 * Hai client WEB và TVHTML5 trả `UNPLAYABLE` / `ERROR`, nên không dùng.
 *
 * KHOÁ API NÀY LÀ HẰNG SỐ CÔNG KHAI, không phải bí mật của ai: nó nằm ngay
 * trong mã nguồn mọi trang YouTube và giống nhau với mọi người. Không có gì để
 * lộ, và cũng không có gì phải đặt vào biến môi trường.
 *
 * THỬ LẦN LƯỢT HAI CLIENT rồi mới chịu thua: YouTube đổi luật thường xuyên, và
 * hai đường độc lập thì hỏng một cái vẫn còn cái kia. Thứ tự đặt ANDROID trước
 * vì nó nhẹ hơn và trả đúng định dạng XML mà bộ đọc hiện có đã hiểu.
 */

const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const ENDPOINT = `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}&prettyPrint=false`;

type ClientSpec = {
  label: string;
  clientName: string;
  clientVersion: string;
  extra?: Record<string, unknown>;
};

const CLIENTS: readonly ClientSpec[] = [
  { label: 'android', clientName: 'ANDROID', clientVersion: '20.10.38', extra: { androidSdkVersion: 30 } },
  { label: 'ios', clientName: 'IOS', clientVersion: '20.10.4', extra: { deviceModel: 'iPhone16,2' } },
];

type PlayerResponse = {
  playabilityStatus?: { status?: string; reason?: string };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: Array<{
        baseUrl?: string;
        languageCode?: string;
        kind?: string;
        name?: { simpleText?: string; runs?: Array<{ text?: string }> };
      }>;
    };
  };
};

export type InnertubeResult =
  | { ok: true; via: string; tracks: CaptionTrack[] }
  | { ok: false; reason: 'blocked' | 'no_captions' | 'unreachable'; detail: string };

function toTracks(res: PlayerResponse): CaptionTrack[] {
  const raw = res.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  return raw
    .filter((t): t is { baseUrl: string; languageCode: string } & typeof t =>
      typeof t.baseUrl === 'string' && typeof t.languageCode === 'string',
    )
    .map((t) => ({
      baseUrl: t.baseUrl,
      languageCode: t.languageCode,
      kind: t.kind,
      name: t.name?.simpleText ?? t.name?.runs?.map((r) => r.text ?? '').join('') ?? '',
    }));
}

/** Hỏi một client. Ném thì coi như client ấy hỏng, không làm chết cả hàm. */
async function askClient(videoId: string, spec: ClientSpec): Promise<InnertubeResult> {
  const body = {
    videoId,
    context: {
      client: {
        clientName: spec.clientName,
        clientVersion: spec.clientVersion,
        hl: 'en',
        gl: 'US',
        ...(spec.extra ?? {}),
      },
    },
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) return { ok: false, reason: 'unreachable', detail: `HTTP ${res.status}` };

  const json = (await res.json()) as PlayerResponse;
  const status = json.playabilityStatus?.status ?? 'UNKNOWN';

  if (status !== 'OK') {
    return {
      ok: false,
      reason: 'blocked',
      detail: json.playabilityStatus?.reason ?? status,
    };
  }

  const tracks = toTracks(json);
  if (tracks.length === 0) return { ok: false, reason: 'no_captions', detail: 'không có bảng phụ đề' };

  return { ok: true, via: spec.label, tracks };
}

export async function fetchCaptionTracks(videoId: string): Promise<InnertubeResult> {
  let last: InnertubeResult = { ok: false, reason: 'unreachable', detail: 'chưa thử client nào' };

  for (const spec of CLIENTS) {
    try {
      const out = await askClient(videoId, spec);
      if (out.ok) return out;
      last = out;
      /*
        "Không có phụ đề" là câu trả lời THẬT của video, không phải client hỏng
        — hỏi client khác cũng ra thế. Dừng luôn để khỏi tốn một vòng mạng.
      */
      if (out.reason === 'no_captions') return out;
    } catch (err) {
      last = { ok: false, reason: 'unreachable', detail: (err as Error).message };
    }
  }

  return last;
}
