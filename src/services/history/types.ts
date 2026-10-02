/**
 * "KHÁM PHÁ LỊCH SỬ VIỆT NAM SONG NGỮ" — HỢP ĐỒNG DỮ LIỆU.
 *
 * Đây là NGUỒN SỰ THẬT của nội dung lịch sử, tách hẳn khỏi giao diện. Người soạn
 * nội dung chỉ sửa các tệp JSON trong `src/data/history/<topicId>/` và ảnh / audio
 * trong `public/history/<topicId>/`; component không chứa chữ lịch sử nào.
 *
 * MÃ ỔN ĐỊNH (không đổi sau khi đã xuất bản, vì tiến độ người học tham chiếu tới):
 *   chủ đề   `vn-khang-chien-chong-phap`
 *   cảnh     `s01` … `s12`
 *   đoạn     `s01-p1`, `s01-p2` …        (đoạn Việt và đoạn Anh CÙNG MÃ — ghép cặp)
 *   khẳng định `c01-1`, `c01-2` …        (cảnh 01, khẳng định thứ 1)
 *   nguồn    `src-<slug>`
 *   câu hỏi  `s01-q1` …
 *
 * CỔNG XUẤT BẢN: người dùng chỉ thấy một cảnh khi cảnh `published` VÀ mọi khẳng định
 * của nó là `verified` hoặc `single-source` VÀ ảnh + audio tiếng Anh có thật.
 * `disputed` / `unverified` chặn xuất bản. Xem `gating.ts`.
 */

export type Bi = { vi: string; en: string };

export type TopicStatus = 'draft' | 'published';
export type SceneStatus = 'draft' | 'verified' | 'published';
export type ClaimStatus = 'verified' | 'single-source' | 'disputed' | 'unverified';
export type NarrationLang = 'en' | 'vi';
export type DisplayLang = 'en' | 'vi' | 'both';
export type CityRef = 'hanoi' | 'danang' | 'hochiminh';

/** Dòng chữ ghi công dưới mọi ảnh (cố định, không đổi theo cảnh). */
export const IMAGE_CREDIT = 'Minh họa pixel tái dựng, không phải ảnh tư liệu';
export const IMAGE_CREDIT_EN = 'Pixel-art reconstruction, not an archival photograph';

/** Lời miễn trừ cuối trang — chỉ gỡ khi chủ dự án nói đã có chuyên gia sử học thẩm định. */
export const HISTORY_DISCLAIMER = {
  vi: 'Nội dung biên soạn từ các nguồn công khai; chưa qua thẩm định của chuyên gia sử học.',
  en: 'Compiled from public sources; not yet reviewed by a professional historian.',
} as const;

/* ------------------------------------------------------------------ chủ đề */

export type MapLink = {
  cityId: CityRef;
  /** Địa điểm (mã trong `data/travel/pois.ts`) mà người hướng dẫn đứng ở đó. */
  poiId?: string;
  /** Các cảnh được mở từ địa điểm này. */
  sceneIds: string[];
  /**
   * `true` = cảnh diễn ra Ở NƠI KHÁC (Việt Bắc, Điện Biên Phủ…); người hướng dẫn nói rõ
   * điều đó, không để ngụ ý chúng nằm trong thành phố của bản đồ.
   */
  otherPlaces?: boolean;
  /** Nhãn riêng cho nút / thẻ (mặc định lấy tên chủ đề). */
  label?: Bi;
  /** Lời người hướng dẫn — CHỈ TIẾNG ANH (luật: nhân vật trong game nói tiếng Anh). */
  guideLineEn?: string;
};

export type Topic = {
  id: string;
  titleVi: string;
  titleEn: string;
  /** Ví dụ "1945–1954". */
  periodLabel: string;
  summary: Bi;
  objectives: Bi[];
  /** Phạm vi chính, để UI nhãn "bối cảnh trước giai đoạn chính" cho cảnh nằm ngoài. */
  mainPeriod: { from: number; to: number };
  status: TopicStatus;
  /** Thứ tự cảnh. Chủ đề `draft` được phép liệt kê cảnh chưa soạn. */
  sceneIds: string[];
  mapLinks: MapLink[];
};

/* -------------------------------------------------------------------- cảnh */

export type Paragraph = { id: string; vi: string; en: string };

export type SceneImage = {
  /** Đường dẫn gốc site, ví dụ `/history/<topicId>/images/s01.png`. Tệp nằm ở `public/`. */
  file: string;
  altVi: string;
  altEn: string;
  captionVi: string;
  captionEn: string;
  /** `true` với cảnh khái quát (đời sống hậu phương…): minh hoạ một giai đoạn, không phải một ngày cụ thể. */
  isGeneralIllustration: boolean;
  /** Luôn là `IMAGE_CREDIT`. */
  credit: string;
};

/** Mốc thời gian THẬT của từng câu (giây). Chỉ khai khi có timestamp thực / audio cắt theo câu. */
export type AudioSentence = { start: number; end: number; paragraphId?: string; text: string };

export type SceneAudioTrack = { file: string; durationSec: number; sentences?: AudioSentence[] };

export type VocabItem = { word: string; pos: string; meaningVi: string; ipa: string };

export type SceneQuestion = {
  id: string;
  type: 'mcq';
  promptVi: string;
  promptEn: string;
  options: Bi[];
  answerIndex: number;
  /** Đoạn trong bài chứa bằng chứng — được tô sáng khi người dùng trả lời. */
  evidenceParagraphId: string;
  explainVi: string;
  explainEn: string;
};

/** Điểm mở rộng cho giai đoạn sau (chuyển động nhẹ, parallax, mô hình 3D). CHƯA dùng. */
export type FutureMedia = {
  parallaxLayers?: { file: string; depth: number }[];
  model3d?: { file: string; note?: string };
};

export type Scene = {
  id: string;
  /** Số thứ tự hiển thị 1…12. */
  n: number;
  titleVi: string;
  titleEn: string;
  dateLabel: Bi;
  /** Ví dụ { vi: 'Bối cảnh trước giai đoạn chính', en: 'Background before the main period' }. */
  periodNote?: Bi;
  place: { vi: string; en: string; modernNote?: Bi };
  paragraphs: Paragraph[];
  image?: SceneImage;
  audio?: { en?: SceneAudioTrack; vi?: SceneAudioTrack };
  /** Đánh dấu rõ thay vì để trống: cảnh `published` không được còn cờ nào trong hai cờ này. */
  imagePending?: boolean;
  audioPending?: boolean;
  claimIds: string[];
  sourceIds: string[];
  vocab: VocabItem[];
  questions: SceneQuestion[];
  status: SceneStatus;
  futureMedia?: FutureMedia;
};

/* ------------------------------------------------------- nguồn & khẳng định */

export type SourceKind = 'museum' | 'archive' | 'primary-document' | 'book' | 'academic' | 'government' | 'encyclopedia' | 'news' | 'other';

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  kind: SourceKind;
  /** Chỗ hỗ trợ trong nguồn: trang, mục, đoạn. */
  locator?: string;
  /** Ngày mở đọc, `YYYY-MM-DD`. */
  accessed: string;
};

export type ClaimSupport = 'full' | 'partial' | 'context';

export type Claim = {
  id: string;
  sceneId: string;
  paragraphId: string;
  textEn: string;
  textVi: string;
  date: string;
  places: string[];
  people: string[];
  sources: { sourceId: string; locator: string; supports: ClaimSupport }[];
  /** Số nguồn ĐỘC LẬP (hai trang chép cùng một bài chỉ tính một). */
  independentSources: number;
  status: ClaimStatus;
  notes: string;
};

/* ------------------------------------------------------ nguồn gốc ảnh / audio */

export type ImageMeta = {
  sceneId: string;
  file: string;
  prompt: string;
  referenceNotes: string;
  /** Chỉ ghi khi thực sự biết công cụ / model đã tạo ảnh. */
  createdWith?: string;
  promptVersion: string;
};

export type AudioMeta = {
  sceneId: string;
  lang: NarrationLang;
  file: string;
  /** Giọng / dịch vụ nếu biết. */
  voice?: string;
  engine?: string;
  /** SHA-256 của `narrationText(scene, lang)` lúc dựng audio — phát hiện bài đã sửa mà audio chưa dựng lại. */
  textSha256: string;
  generatedAt?: string;
};

/* --------------------------------------------------------------------- gói */

/** Toàn bộ dữ liệu một chủ đề, đúng bằng các tệp JSON trong thư mục chủ đề. */
export type TopicBundle = {
  topic: Topic;
  scenes: Scene[];
  sources: Source[];
  claims: Claim[];
  images: ImageMeta[];
  audio: AudioMeta[];
};

/** Văn bản mà audio PHẢI đọc đúng: các đoạn của cảnh, cách nhau một dòng trống. */
export function narrationText(scene: Pick<Scene, 'paragraphs'>, lang: NarrationLang): string {
  return scene.paragraphs.map((p) => p[lang]).join('\n\n');
}

/** Số từ tiếng Anh của cảnh (định hướng 80–130). */
export function englishWordCount(scene: Pick<Scene, 'paragraphs'>): number {
  return scene.paragraphs
    .map((p) => p.en)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Đường dẫn quy ước. Tệp ngoài quy ước vẫn hợp lệ nếu tồn tại — đây chỉ là gợi ý cho người soạn. */
export const historyAssetPath = {
  image: (topicId: string, sceneId: string, ext = 'png') => `/history/${topicId}/images/${sceneId}.${ext}`,
  audio: (topicId: string, lang: NarrationLang, sceneId: string) => `/history/${topicId}/audio/${lang}/${sceneId}.mp3`,
};
