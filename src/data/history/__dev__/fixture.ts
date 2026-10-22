/**
 * DỮ LIỆU MẪU CHỈ ĐỂ DỰNG GIAO DIỆN — KHÔNG PHẢI NỘI DUNG LỊCH SỬ.
 *
 * Chỉ nạp khi `__DEV__` và đường dẫn có `?dev=1` (xem `data/history/index.ts`); bản production không
 * đi tới tệp này. Ảnh là SVG pixel sinh tại chỗ, audio là WAV sinh tại chỗ (vài tiếng "tích" nhỏ ở đầu
 * mỗi câu) — không tệp nào nằm trong `public/`. Văn bản cố ý vô nghĩa về mặt sử học.
 *
 * Bốn cảnh để thử các nhánh giao diện:
 *   s01  có mốc câu THẬT (tô sáng theo đoạn), có cả audio tiếng Việt;
 *   s02  chỉ audio theo cảnh (không mốc câu), khẳng định `single-source` → hiện "Nguồn đơn";
 *   s03  audio 404 + ảnh 404 → thử trạng thái lỗi và đọc bằng giọng thiết bị;
 *   s04  khẳng định `disputed` → bị cổng chặn, người dùng không thấy.
 */
import {
  IMAGE_CREDIT,
  type AudioSentence,
  type Claim,
  type Scene,
  type Source,
  type TopicBundle,
} from '@/services/history/types';

export const DEV_TOPIC_ID = 'dev-fixture';

/* ---------------------------------------------------------------- ảnh pixel SVG */

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Phong cảnh pixel 80×45: trời, mặt trời, dãy nhà, mặt nước. Mỗi cảnh một bảng màu. */
function pixelSvg(seed: number, palette: { sky: string; sun: string; walls: string[]; ground: string }): string {
  const W = 80;
  const H = 45;
  const rand = rng(seed);
  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(palette.sky) as string[]);
  const sx = 12 + Math.floor(rand() * 56);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x - sx) ** 2 + (y - 11) ** 2 < 28) grid[y]![x] = palette.sun;
  let x = 0;
  while (x < W) {
    const w = 5 + Math.floor(rand() * 8);
    const h = 8 + Math.floor(rand() * 14);
    const c = palette.walls[Math.floor(rand() * palette.walls.length)]!;
    for (let yy = 32 - h; yy < 32; yy++) for (let xx = x; xx < Math.min(W, x + w); xx++) grid[yy]![xx] = (xx + yy) % 5 === 0 && yy < 30 && yy > 32 - h + 1 ? palette.sun : c;
    x += w;
  }
  for (let y = 32; y < H; y++) for (let xx = 0; xx < W; xx++) grid[y]![xx] = (y + Math.floor(xx / 3)) % 4 === 0 ? palette.walls[0]! : palette.ground;
  let rects = '';
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let xx = 1; xx <= W; xx++) {
      if (xx === W || grid[y]![xx] !== grid[y]![xx - 1]) {
        rects += `<rect x="${xx - 1 - run}" y="${y}" width="${run + 1}" height="1" fill="${grid[y]![xx - 1]}"/>`;
        run = 0;
      } else run++;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ------------------------------------------------------------------ audio WAV */

/** WAV 8 kHz mono 8-bit: im lặng, kèm tiếng "tích" nhỏ (440 Hz, 70 ms) tại các mốc `ticks` (giây). */
export function wavDataUri(durationSec: number, ticks: number[]): string {
  const rate = 8000;
  const n = Math.round(durationSec * rate);
  const bytes = new Uint8Array(44 + n);
  const dv = new DataView(bytes.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => (bytes[o + i] = c.charCodeAt(0)));
  str(0, 'RIFF');
  dv.setUint32(4, 36 + n, true);
  str(8, 'WAVEfmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate, true);
  dv.setUint16(32, 1, true);
  dv.setUint16(34, 8, true);
  str(36, 'data');
  dv.setUint32(40, n, true);
  bytes.fill(128, 44);
  for (const t of ticks) {
    const start = Math.round(t * rate);
    for (let i = 0; i < 560 && start + i < n; i++) bytes[44 + start + i] = 128 + Math.round(Math.sin((i / rate) * 2 * Math.PI * 440) * 14 * (1 - i / 560));
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x2000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x2000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

/* --------------------------------------------------------------------- cảnh */

const sent = (parts: [number, number, string, string?][]): AudioSentence[] => parts.map(([start, end, text, paragraphId]) => ({ start, end, text, paragraphId }));

const S01_SENTENCES = sent([
  [0, 4, 'The harbour was quiet at dawn.', 's01-p1'],
  [4, 8, 'A small boat crossed the river.', 's01-p1'],
  [8, 12, 'This text exists only to test the reader.', 's01-p2'],
]);

const credit = IMAGE_CREDIT;

const SCENES: Scene[] = [
  {
    id: 's01',
    n: 1,
    titleVi: '[DEV] Cảnh mẫu 1 — bến cảng lúc bình minh',
    titleEn: '[DEV] Sample scene 1 — a harbour at dawn',
    dateLabel: { vi: 'Ngày giả định', en: 'Placeholder date' },
    periodNote: { vi: 'Bối cảnh trước giai đoạn chính', en: 'Background before the main period' },
    place: { vi: 'Bến cảng giả định', en: 'An imaginary harbour', modernNote: { vi: 'Không phải địa danh thật.', en: 'Not a real place.' } },
    paragraphs: [
      {
        id: 's01-p1',
        vi: 'Bến cảng yên tĩnh lúc bình minh. Một chiếc thuyền nhỏ băng qua sông.',
        en: 'The harbour was quiet at dawn. A small boat crossed the river.',
      },
      {
        id: 's01-p2',
        vi: 'Đoạn văn này chỉ để thử giao diện đọc, không phải nội dung lịch sử.',
        en: 'This text exists only to test the reader.',
      },
    ],
    image: {
      file: pixelSvg(11, { sky: '#f4d9a8', sun: '#e8743b', walls: ['#7a5c3e', '#9c7a52', '#2B2350'], ground: '#4a7a8c' }),
      altVi: 'Minh hoạ pixel giả định: dãy nhà thấp bên mặt nước lúc bình minh.',
      altEn: 'Placeholder pixel art: low houses by the water at dawn.',
      captionVi: 'Ảnh mẫu dựng giao diện (dev).',
      captionEn: 'Placeholder image for interface work (dev).',
      isGeneralIllustration: false,
      credit,
    },
    audio: {
      en: { file: wavDataUri(12, [0, 4, 8]), durationSec: 12, sentences: S01_SENTENCES },
      vi: { file: wavDataUri(10, [0, 5]), durationSec: 10 },
    },
    claimIds: ['c01-1'],
    sourceIds: ['src-dev-a', 'src-dev-b'],
    vocab: [
      { word: 'harbour', pos: 'n.', meaningVi: 'bến cảng', ipa: '/ˈhɑːbə/' },
      { word: 'dawn', pos: 'n.', meaningVi: 'bình minh', ipa: '/dɔːn/' },
    ],
    questions: [
      {
        id: 's01-q1',
        type: 'mcq',
        promptVi: 'Bến cảng như thế nào lúc bình minh?',
        promptEn: 'What was the harbour like at dawn?',
        options: [
          { vi: 'Ồn ào', en: 'Noisy' },
          { vi: 'Yên tĩnh', en: 'Quiet' },
          { vi: 'Đang cháy', en: 'On fire' },
        ],
        answerIndex: 1,
        evidenceParagraphId: 's01-p1',
        explainVi: 'Câu đầu của đoạn 1 nói bến cảng yên tĩnh.',
        explainEn: 'The first sentence of paragraph 1 says the harbour was quiet.',
      },
    ],
    status: 'published',
  },
  {
    id: 's02',
    n: 2,
    titleVi: '[DEV] Cảnh mẫu 2 — chợ buổi sáng (đời sống khái quát)',
    titleEn: '[DEV] Sample scene 2 — a morning market (general life)',
    dateLabel: { vi: 'Một giai đoạn giả định', en: 'A placeholder period' },
    place: { vi: 'Chợ giả định', en: 'An imaginary market' },
    paragraphs: [
      {
        id: 's02-p1',
        vi: 'Chợ thức dậy từ từ. Người bán xếp rau và trái cây lên quầy.',
        en: 'The market woke up slowly. Sellers arranged vegetables and fruit on their stalls.',
      },
      {
        id: 's02-p2',
        vi: 'Cảnh này chỉ có audio theo cảnh, không có mốc từng câu.',
        en: 'This scene only has scene-level audio, with no sentence timestamps.',
      },
    ],
    image: {
      file: pixelSvg(23, { sky: '#bfe0e8', sun: '#f6e27a', walls: ['#a44a3f', '#c9a14a', '#6d8f5a'], ground: '#8a7a64' }),
      altVi: 'Minh hoạ pixel giả định: dãy quầy hàng dưới nắng sớm.',
      altEn: 'Placeholder pixel art: a row of stalls in early sunshine.',
      captionVi: 'Minh hoạ khái quát một giai đoạn, không phải một ngày cụ thể.',
      captionEn: 'A general illustration of a period, not one specific day.',
      isGeneralIllustration: true,
      credit,
    },
    audio: { en: { file: wavDataUri(10, [0]), durationSec: 10 } },
    claimIds: ['c02-1'],
    sourceIds: ['src-dev-a'],
    vocab: [{ word: 'stall', pos: 'n.', meaningVi: 'quầy hàng', ipa: '/stɔːl/' }],
    questions: [
      {
        id: 's02-q1',
        type: 'mcq',
        promptVi: 'Người bán làm gì?',
        promptEn: 'What did the sellers do?',
        options: [
          { vi: 'Xếp hàng lên quầy', en: 'Arranged goods on their stalls' },
          { vi: 'Đóng cửa chợ', en: 'Closed the market' },
        ],
        answerIndex: 0,
        evidenceParagraphId: 's02-p1',
        explainVi: 'Đoạn 1: người bán xếp rau và trái cây lên quầy.',
        explainEn: 'Paragraph 1: sellers arranged vegetables and fruit on their stalls.',
      },
    ],
    status: 'published',
  },
  {
    id: 's03',
    n: 3,
    titleVi: '[DEV] Cảnh mẫu 3 — thử lỗi tải audio và ảnh',
    titleEn: '[DEV] Sample scene 3 — audio and image load errors',
    dateLabel: { vi: 'Ngày giả định', en: 'Placeholder date' },
    place: { vi: 'Nơi giả định', en: 'An imaginary place' },
    paragraphs: [
      {
        id: 's03-p1',
        vi: 'Tệp audio và ảnh của cảnh này cố ý không tồn tại (404).',
        en: 'The audio and image files for this scene deliberately do not exist.',
      },
    ],
    image: {
      file: '/history/dev-fixture/images/khong-co.png',
      altVi: 'Ảnh không tải được.',
      altEn: 'Image that fails to load.',
      captionVi: 'Thử trạng thái lỗi ảnh.',
      captionEn: 'Testing the image error state.',
      isGeneralIllustration: false,
      credit,
    },
    audio: { en: { file: '/history/dev-fixture/audio/en/s03.mp3', durationSec: 8 } },
    claimIds: ['c03-1'],
    sourceIds: ['src-dev-a'],
    vocab: [],
    questions: [],
    status: 'published',
  },
  {
    id: 's04',
    n: 4,
    titleVi: '[DEV] Cảnh mẫu 4 — bị cổng xuất bản chặn',
    titleEn: '[DEV] Sample scene 4 — blocked by the publish gate',
    dateLabel: { vi: 'Ngày giả định', en: 'Placeholder date' },
    place: { vi: 'Nơi giả định', en: 'An imaginary place' },
    paragraphs: [{ id: 's04-p1', vi: 'Cảnh này có khẳng định còn tranh luận nên người dùng không thấy.', en: 'This scene has a disputed claim, so users never see it.' }],
    claimIds: ['c04-1'],
    sourceIds: ['src-dev-a'],
    vocab: [],
    questions: [],
    imagePending: true,
    audioPending: true,
    status: 'draft',
  },
];

const SOURCES: Source[] = [
  { id: 'src-dev-a', title: 'Tài liệu mẫu A (dev)', publisher: 'Band 9 — dữ liệu thử', url: 'https://example.com/dev-a', kind: 'other', locator: 'mục 1', accessed: '2026-10-02' },
  { id: 'src-dev-b', title: 'Tài liệu mẫu B (dev)', publisher: 'Band 9 — dữ liệu thử', url: 'https://example.com/dev-b', kind: 'other', locator: 'trang 2', accessed: '2026-10-02' },
];

const claim = (id: string, sceneId: string, paragraphId: string, status: Claim['status'], n: number): Claim => ({
  id,
  sceneId,
  paragraphId,
  textEn: `Placeholder claim ${id}.`,
  textVi: `Khẳng định giả định ${id}.`,
  date: '—',
  places: [],
  people: [],
  sources: [
    { sourceId: 'src-dev-a', locator: 'mục 1', supports: 'full' },
    ...(n > 1 ? [{ sourceId: 'src-dev-b', locator: 'trang 2', supports: 'full' as const }] : []),
  ],
  independentSources: n,
  status,
  notes: status === 'disputed' ? 'Giả định: hai nguồn mâu thuẫn.' : '',
});

export const DEV_FIXTURE: TopicBundle = {
  topic: {
    id: DEV_TOPIC_ID,
    titleVi: '[DEV] Chủ đề mẫu dựng giao diện',
    titleEn: '[DEV] Interface fixture topic',
    periodLabel: 'Không có',
    summary: { vi: 'Dữ liệu giả để thử bố cục, audio và cổng xuất bản. Không phải nội dung lịch sử.', en: 'Fake data for testing layout, audio and the publish gate. Not historical content.' },
    objectives: [{ vi: 'Thử giao diện.', en: 'Test the interface.' }],
    mainPeriod: { from: 1900, to: 2000 },
    status: 'published',
    sceneIds: ['s01', 's02', 's03', 's04'],
    // Liên kết bản đồ chỉ của bản dev — để thử luồng Du ngoạn → người hướng dẫn → trang đọc.
    mapLinks: [
      { cityId: 'hanoi', poiId: 'hanoi-vanmieu', sceneIds: ['s01', 's02'], label: { vi: '[DEV] Cảnh mẫu 1–2', en: '[DEV] Sample scenes 1–2' }, guideLineEn: 'Would you like to hear a sample story about this place?' },
      { cityId: 'hanoi', poiId: 'hanoi-motcot', sceneIds: ['s03'], otherPlaces: true, label: { vi: 'Những địa điểm khác ở Việt Nam', en: 'Other places in Vietnam' }, guideLineEn: 'This sample story happens somewhere else in Vietnam, not here.' },
    ],
  },
  scenes: SCENES,
  sources: SOURCES,
  claims: [claim('c01-1', 's01', 's01-p1', 'verified', 2), claim('c02-1', 's02', 's02-p1', 'single-source', 1), claim('c03-1', 's03', 's03-p1', 'verified', 2), claim('c04-1', 's04', 's04-p1', 'disputed', 1)],
  images: [],
  audio: [],
};
