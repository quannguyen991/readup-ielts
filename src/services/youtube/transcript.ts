/**
 * Đọc phụ đề của một video YouTube để làm bài chép chính tả.
 *
 * RANH GIỚI ĐÃ CHỌN, ghi ra đây để lần sau không ai nới ra:
 *
 *   - Lấy ĐÚNG LÚC người học mở video đó, không quét sẵn hàng loạt.
 *   - KHÔNG lưu phụ đề thành nội dung của app. Nó sống trong một phiên luyện
 *     rồi thôi; kho bài của app vẫn là 50 bộ đề do dự án tự viết.
 *   - Video phát bằng trình nhúng chính thức của YouTube, nên chủ kênh vẫn
 *     nhận lượt xem và quảng cáo.
 *
 * Ba việc trong file này đều là XỬ LÝ CHUỖI THUẦN, tách khỏi phần gọi mạng để
 * kiểm được bằng test: rút id video từ đủ kiểu URL, tìm đường dẫn phụ đề trong
 * HTML trang xem, và đổi phụ đề thành danh sách câu có mốc thời gian.
 */

export type TranscriptCue = {
  /** Giây, tính từ đầu video. */
  start: number;
  duration: number;
  text: string;
};

export type TranscriptSentence = {
  start: number;
  end: number;
  text: string;
};

/**
 * Rút id video từ mọi kiểu liên kết người dùng hay dán.
 *
 * Nhận cả id trần: người ta hay chép mỗi đoạn 11 ký tự từ thanh địa chỉ.
 */
export function parseVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string; name?: string };

/**
 * Tìm bảng phụ đề trong HTML trang xem.
 *
 * YouTube nhúng cả cấu hình trình phát vào một khối JSON trong HTML. Không dò
 * bằng regex trên toàn bộ khối ấy — nó lồng nhau nhiều tầng và regex sẽ bắt
 * nhầm. Cắt đúng mảng `captionTracks` rồi parse mảng đó thôi.
 */
export function findCaptionTracks(html: string): CaptionTrack[] {
  const marker = '"captionTracks":';
  const at = html.indexOf(marker);
  if (at < 0) return [];

  const start = html.indexOf('[', at);
  if (start < 0) return [];

  let depth = 0;
  let end = -1;
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) return [];

  try {
    const parsed = JSON.parse(html.slice(start, end)) as Array<Record<string, unknown>>;
    return parsed
      .filter((track) => typeof track.baseUrl === 'string')
      .map((track) => ({
        baseUrl: String(track.baseUrl).replace(/\\u0026/g, '&'),
        languageCode: String(track.languageCode ?? ''),
        kind: typeof track.kind === 'string' ? track.kind : undefined,
        name:
          typeof track.name === 'object' && track.name !== null
            ? String((track.name as Record<string, unknown>).simpleText ?? '')
            : undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Chọn bản phụ đề tiếng Anh tốt nhất.
 *
 * Ưu tiên bản do người soạn hơn bản máy tự sinh (`kind === 'asr'`): bản máy sai
 * chính tả và thiếu dấu câu, mà bài chép chính tả thì chấm từng chữ — một bản
 * phụ đề sai sẽ báo người học sai trong khi họ nghe đúng.
 */
export function pickEnglishTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  const english = tracks.filter((t) => t.languageCode.toLowerCase().startsWith('en'));
  if (english.length === 0) return null;
  return english.find((t) => t.kind !== 'asr') ?? english[0]!;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

/**
 * Giải mã thực thể HAI LƯỢT.
 *
 * YouTube mã hoá phụ đề hai lần: dấu nháy đơn tới nơi dưới dạng `&amp;#39;`,
 * tức `&#39;` đã bị mã hoá thêm một lần nữa. Giải một lượt sẽ để lại `&#39;`
 * hiện nguyên si giữa câu, và bài chép chính tả sẽ bắt người học gõ nó.
 */
function decodeOnce(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);
}

function decode(text: string): string {
  const once = decodeOnce(text);
  return once === text ? once : decodeOnce(once);
}

/** Đổi XML phụ đề của YouTube thành các mẩu có mốc thời gian. */
export function parseTranscriptXml(xml: string): TranscriptCue[] {
  const legacy = matchCues(xml, LEGACY_PATTERN, 1);
  if (legacy.length > 0) return legacy;
  /*
    HAI KHUÔN XML, và đây là chỗ tính năng đã chết âm thầm.

    Khuôn cũ:  <text start="19.514" dur="1.712">…</text>   — giây
    Khuôn mới: <p t="19514" d="1712">…</p>                 — MILI giây

    InnerTube trả khuôn mới (`<timedtext format="3">`). Bộ đọc chỉ biết khuôn cũ
    nên nó nhận về 8.256 byte phụ đề hợp lệ rồi trả ra không cue nào, và người
    dùng thấy đúng một dòng "phụ đề quá rời rạc để cắt thành câu" — một câu lỗi
    nói sai hẳn nguyên nhân.

    Đơn vị thời gian khác nhau nên phải chia 1000, nếu không mọi mốc tua đều
    lệch đi một nghìn lần và bài nghe nhảy thẳng tới cuối video.
  */
  return matchCues(xml, MODERN_PATTERN, 1000);
}

const LEGACY_PATTERN = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
const MODERN_PATTERN = /<p t="(\d+)"(?: d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;

/** `divisor` đưa mốc thời gian về GIÂY — phần còn lại của app tính bằng giây. */
function matchCues(xml: string, pattern: RegExp, divisor: number): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  pattern.lastIndex = 0;

  for (const match of xml.matchAll(pattern)) {
    const text = decode(match[3] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    cues.push({
      start: Number(match[1]) / divisor,
      duration: Number(match[2] ?? 0) / divisor,
      text,
    });
  }
  return cues;
}

/**
 * Đọc phụ đề WebVTT — định dạng `yt-dlp` trả về.
 *
 * Khác khuôn XML ở hai chỗ, và bỏ qua chỗ nào cũng làm hỏng bài chép chính tả:
 *
 * 1. Phụ đề TỰ ĐỘNG của YouTube cuộn từng chữ: mỗi mẩu lặp lại nguyên phần đã
 *    hiện rồi thêm vài chữ mới, kèm mốc giờ cho từng chữ
 *    (`<00:00:19.039><c> no</c>`). Lấy nguyên thì một câu bị đọc lại năm lần.
 * 2. Mốc giờ viết HH:MM:SS.mmm chứ không phải số giây.
 *
 * Nên ở đây: bỏ mọi thẻ, rồi gộp mẩu nào trùng hoặc chỉ là phần đầu của mẩu
 * trước — giữ bản DÀI NHẤT, tức lúc câu đã hiện đủ chữ.
 */
export function parseVtt(vtt: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];

  for (const block of vtt.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block.split('\n');
    const at = lines.findIndex((line) => line.includes('-->'));
    if (at < 0) continue;

    const stamps = /(\d{1,2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{3})/.exec(
      lines[at] ?? '',
    );
    if (!stamps) continue;

    const start = vttSeconds(stamps[1] ?? '');
    const end = vttSeconds(stamps[2] ?? '');
    const text = decode(lines.slice(at + 1).join(' '))
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    const previous = cues[cues.length - 1];
    if (previous && (previous.text === text || text.startsWith(previous.text))) {
      previous.text = text;
      previous.duration = Math.max(previous.duration, end - previous.start);
      continue;
    }
    cues.push({ start, duration: Math.max(0, end - start), text });
  }

  return cues;
}

function vttSeconds(stamp: string): number {
  const [h = '0', m = '0', s = '0'] = stamp.replace(',', '.').split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * Gộp các mẩu phụ đề thành CÂU TRỌN VẸN.
 *
 * Phụ đề YouTube cắt theo dòng hiển thị, không theo câu — một câu hay bị chẻ
 * làm ba mẩu, và một mẩu có khi chứa cuối câu này lẫn đầu câu sau. Bài chép
 * chính tả cần đơn vị là CÂU: nghe nửa câu rồi phải gõ lại thì không ai làm
 * được, và cũng không rèn được gì.
 *
 * Ghép tới khi gặp dấu kết câu. Mẩu quá dài mà mãi không có dấu kết (phụ đề
 * máy sinh thường không có dấu câu nào) thì cắt theo ngưỡng số từ, vì thà một
 * câu cắt hơi sớm còn hơn một "câu" dài bốn mươi từ.
 */
export function groupIntoSentences(cues: TranscriptCue[], maxWords = 22): TranscriptSentence[] {
  const out: TranscriptSentence[] = [];
  let buffer: string[] = [];
  let start = 0;
  let end = 0;

  const flush = () => {
    const text = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (text) out.push({ start, end, text });
    buffer = [];
  };

  for (const cue of cues) {
    if (buffer.length === 0) start = cue.start;
    end = cue.start + (cue.duration || 0);
    buffer.push(cue.text);

    const joined = buffer.join(' ');
    const endsSentence = /[.!?]["')\]]?\s*$/.test(joined);
    const tooLong = joined.split(/\s+/).length >= maxWords;

    if (endsSentence || tooLong) flush();
  }
  flush();

  return out;
}

/**
 * Bỏ những câu không dùng được cho bài chép chính tả.
 *
 * Ba loại: quá ngắn (một hai từ, thường là "Okay." hay tên kênh), không có chữ
 * cái nào (chỉ nhạc hoặc tiếng động), và chú thích trong ngoặc vuông kiểu
 * `[Music]` mà YouTube chèn vào.
 */
const CREDIT_LINE = /^\s*(translator|reviewer|transcriber|translated by|subtitles? by|captions? by)\s*:/i;

/**
 * Bỏ những mẩu KHÔNG PHẢI LỜI NÓI trước khi gộp câu.
 *
 * Phụ đề TED và nhiều kênh mở đầu bằng một mẩu ghi công người dịch — "Translator:
 * … Reviewer: …". Nó không được nói ra trong video, nên để lại là bắt người học
 * gõ một cái tên riêng họ chưa từng nghe thấy, ngay ở câu ĐẦU TIÊN của bài.
 *
 * Lọc ở mức MẨU chứ không ở mức câu: mẩu ghi công thường dính liền với câu nói
 * thật đầu tiên khi gộp, nên lọc sau thì hoặc mất luôn câu thật, hoặc phải cắt
 * chuỗi bằng tay.
 */
export function speechCues(cues: TranscriptCue[]): TranscriptCue[] {
  return cues.filter((c) => !CREDIT_LINE.test(c.text));
}

/**
 * Độ dài tối đa của MỘT câu chép chính tả, tính bằng từ. Câu dài hơn thì tách ở dấu phẩy
 * (hoặc chấm phẩy, hai chấm, gạch ngang) gần giữa nhất, để người học không phải gõ một mạch quá dài.
 */
export const MAX_DICTATION_WORDS = 18;

/**
 * Tách một mẩu thành các CÂU RIÊNG, mỗi câu một đoạn chép chính tả.
 *
 * Gộp theo dấu kết câu vẫn có thể dồn hai ba câu vào một mẩu (phụ đề thường xuống dòng
 * giữa câu, và một dòng có khi chứa cả câu trước lẫn câu sau). Mốc thời gian được rải
 * theo độ dài ký tự của từng câu, đủ để tua đúng đoạn; không có mốc chính xác từng câu.
 */
export function splitIntoSentences(s: TranscriptSentence, maxWords = MAX_DICTATION_WORDS): TranscriptSentence[] {
  const pieces = s.text.match(/[^.!?]+[.!?]+["')\]]?|[^.!?]+$/g) ?? [s.text];
  const parts: string[] = [];
  for (const raw of pieces) {
    const piece = raw.trim();
    if (piece) parts.push(...breakLongSentence(piece, maxWords));
  }
  if (parts.length <= 1) return [s];

  const span = s.end - s.start;
  const total = parts.reduce((n, p) => n + p.length, 0) || 1;
  let acc = 0;
  return parts.map((text) => {
    const from = acc / total;
    acc += text.length;
    const to = acc / total;
    return { start: s.start + span * from, end: s.start + span * to, text };
  });
}

/** Cắt một câu quá dài ở dấu ngắt gần giữa nhất; cả hai vế đều phải đủ ý (≥ 4 từ). */
function breakLongSentence(sentence: string, maxWords: number): string[] {
  if (sentence.split(/\s+/).length <= maxWords) return [sentence];

  const mid = sentence.length / 2;
  let best: { at: number; gap: number } | null = null;
  // Dấu ngắt phải đứng trước khoảng trắng, nên không cắt giữa một từ (anti-government có gạch nối thì bỏ qua).
  for (const m of sentence.matchAll(/[,;:](?=\s)|\s[–—-](?=\s)/g)) {
    const at = (m.index ?? 0) + m[0].length;
    const left = sentence.slice(0, at).trim();
    const right = sentence.slice(at).trim();
    if (left.split(/\s+/).length < 4 || right.split(/\s+/).length < 4) continue;
    const gap = Math.abs(at - mid);
    if (!best || gap < best.gap) best = { at, gap };
  }
  if (!best) return [sentence];

  const left = sentence.slice(0, best.at).trim();
  const right = sentence.slice(best.at).trim();
  return [...breakLongSentence(left, maxWords), ...breakLongSentence(right, maxWords)];
}

export function usableSentences(sentences: TranscriptSentence[], minWords = 4): TranscriptSentence[] {
  return sentences
    .map((s) => ({ ...s, text: s.text.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim() }))
    .flatMap((s) => splitIntoSentences(s))
    .filter((s) => /[a-zA-Z]/.test(s.text) && s.text.split(/\s+/).length >= minWords);
}
