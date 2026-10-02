import { PUBLISHABLE_CLAIM } from './gating';
import { IMAGE_CREDIT, narrationText, type Scene, type TopicBundle } from './types';

/**
 * KIỂM TRA TOÀN VẸN một gói chủ đề. Hàm thuần: việc đụng đĩa / băm được tiêm qua `env` để chạy được
 * cả trong test (Node) lẫn script soạn nội dung.
 *
 * `error` chặn test; `warning` chỉ báo (ví dụ chủ đề `draft` chưa soạn đủ cảnh).
 */

export type Issue = { level: 'error' | 'warning'; where: string; message: string };

export type ValidateEnv = {
  /** `file` là đường dẫn gốc site (`/history/...`); trả `true` nếu `public/<file>` tồn tại. */
  fileExists: (file: string) => boolean;
  /** SHA-256 hex của chuỗi; bỏ trống thì bỏ qua phép so audio ↔ văn bản. */
  sha256?: (text: string) => string;
};

const STABLE = {
  topic: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  scene: /^s\d{2}$/,
  paragraph: /^s\d{2}-p\d+$/,
  claim: /^c\d{2}-\d+$/,
  source: /^src-[a-z0-9]+(-[a-z0-9]+)*$/,
  question: /^s\d{2}-q\d+$/,
};

const hasText = (s: unknown): boolean => typeof s === 'string' && s.trim().length > 0;
const isUrl = (s: string): boolean => /^https?:\/\/[^\s]+\.[^\s]+/i.test(s);

export function validateBundle(bundle: TopicBundle, env: ValidateEnv): Issue[] {
  const out: Issue[] = [];
  const err = (where: string, message: string) => out.push({ level: 'error', where, message });
  const warn = (where: string, message: string) => out.push({ level: 'warning', where, message });
  const { topic, scenes, sources, claims, images, audio } = bundle;

  /* ----------------------------------------------------------------- chủ đề */
  if (!STABLE.topic.test(topic.id)) err(`topic:${topic.id}`, 'mã chủ đề sai dạng');
  for (const [k, v] of Object.entries({ titleVi: topic.titleVi, titleEn: topic.titleEn, periodLabel: topic.periodLabel })) {
    if (!hasText(v)) err(`topic.${k}`, 'trống');
  }
  if (!hasText(topic.summary.vi) || !hasText(topic.summary.en)) err('topic.summary', 'thiếu vi hoặc en');
  if (topic.objectives.length === 0) warn('topic.objectives', 'chưa có mục tiêu học');
  topic.objectives.forEach((o, i) => {
    if (!hasText(o.vi) || !hasText(o.en)) err(`topic.objectives[${i}]`, 'thiếu vi hoặc en');
  });
  if (new Set(topic.sceneIds).size !== topic.sceneIds.length) err('topic.sceneIds', 'mã cảnh trùng');

  /* ------------------------------------------------------------------- nguồn */
  const sourceIds = new Set<string>();
  for (const s of sources) {
    if (sourceIds.has(s.id)) err(`source:${s.id}`, 'mã nguồn trùng');
    sourceIds.add(s.id);
    if (!STABLE.source.test(s.id)) err(`source:${s.id}`, 'mã nguồn phải dạng src-<slug>');
    if (!hasText(s.title) || !hasText(s.publisher)) err(`source:${s.id}`, 'thiếu title / publisher');
    if (!isUrl(s.url)) err(`source:${s.id}`, `url không hợp lệ: ${s.url}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.accessed)) err(`source:${s.id}`, 'accessed phải YYYY-MM-DD');
  }

  /* ------------------------------------------------------------------- cảnh */
  const sceneIds = new Set<string>();
  const paragraphIds = new Set<string>();
  const sceneOfParagraph = new Map<string, string>();
  for (const sc of scenes) {
    const at = `scene:${sc.id}`;
    if (sceneIds.has(sc.id)) err(at, 'mã cảnh trùng');
    sceneIds.add(sc.id);
    if (!STABLE.scene.test(sc.id)) err(at, 'mã cảnh phải dạng sNN');
    if (!topic.sceneIds.includes(sc.id)) err(at, 'cảnh không có trong topic.sceneIds');
    if (sc.id !== `s${String(sc.n).padStart(2, '0')}`) err(at, `n=${sc.n} không khớp mã`);
    if (!hasText(sc.titleVi) || !hasText(sc.titleEn)) err(at, 'thiếu tiêu đề vi/en');
    if (!hasText(sc.dateLabel.vi) || !hasText(sc.dateLabel.en)) err(at, 'thiếu dateLabel vi/en');
    if (!hasText(sc.place.vi) || !hasText(sc.place.en)) err(at, 'thiếu place vi/en');
    if (sc.paragraphs.length === 0) err(at, 'không có đoạn nào');
    for (const p of sc.paragraphs) {
      if (paragraphIds.has(p.id)) err(`paragraph:${p.id}`, 'mã đoạn trùng');
      paragraphIds.add(p.id);
      sceneOfParagraph.set(p.id, sc.id);
      if (!new RegExp(`^${sc.id}-p\\d+$`).test(p.id)) err(`paragraph:${p.id}`, `mã đoạn phải dạng ${sc.id}-pN`);
      if (!hasText(p.vi)) err(`paragraph:${p.id}`, 'thiếu bản tiếng Việt');
      if (!hasText(p.en)) err(`paragraph:${p.id}`, 'thiếu bản tiếng Anh');
    }
    checkAssets(sc, env, err);
    for (const sid of sc.sourceIds) if (!sourceIds.has(sid)) err(at, `sourceId không tồn tại: ${sid}`);
    sc.vocab.forEach((v, i) => {
      if (!hasText(v.word) || !hasText(v.meaningVi)) err(`${at}.vocab[${i}]`, 'thiếu word / meaningVi');
    });
    const qIds = new Set<string>();
    for (const q of sc.questions) {
      const qa = `question:${q.id}`;
      if (qIds.has(q.id)) err(qa, 'mã câu hỏi trùng');
      qIds.add(q.id);
      if (!STABLE.question.test(q.id)) err(qa, 'mã câu hỏi phải dạng sNN-qN');
      if (q.options.length < 2) err(qa, 'cần ≥ 2 lựa chọn');
      if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) err(qa, 'answerIndex ngoài khoảng');
      for (const o of q.options) if (!hasText(o.vi) || !hasText(o.en)) err(qa, 'lựa chọn thiếu vi/en');
      if (!hasText(q.promptVi) || !hasText(q.promptEn) || !hasText(q.explainVi) || !hasText(q.explainEn)) err(qa, 'thiếu prompt / explain vi hoặc en');
      if (!sc.paragraphs.some((p) => p.id === q.evidenceParagraphId)) err(qa, `evidenceParagraphId không thuộc cảnh: ${q.evidenceParagraphId}`);
    }
  }

  /* ----------------------------------------------------------- khẳng định */
  const claimIds = new Set<string>();
  for (const c of claims) {
    const at = `claim:${c.id}`;
    if (claimIds.has(c.id)) err(at, 'mã khẳng định trùng');
    claimIds.add(c.id);
    if (!STABLE.claim.test(c.id)) err(at, 'mã khẳng định phải dạng cNN-N');
    if (!sceneIds.has(c.sceneId)) err(at, `sceneId không tồn tại: ${c.sceneId}`);
    if (sceneOfParagraph.get(c.paragraphId) !== c.sceneId) err(at, `paragraphId ${c.paragraphId} không thuộc cảnh ${c.sceneId}`);
    if (!hasText(c.textEn) || !hasText(c.textVi)) err(at, 'thiếu textEn / textVi');
    if (c.sources.length === 0) err(at, 'khẳng định không có nguồn nào');
    for (const s of c.sources) {
      if (!sourceIds.has(s.sourceId)) err(at, `sourceId không tồn tại: ${s.sourceId}`);
      else if (!isUrl(sources.find((x) => x.id === s.sourceId)!.url)) err(at, `nguồn ${s.sourceId} không có URL`);
      if (!hasText(s.locator)) warn(at, `nguồn ${s.sourceId} chưa ghi vị trí đoạn / trang`);
    }
    if (c.independentSources > c.sources.length) err(at, 'independentSources lớn hơn số nguồn đã liệt kê');
    if (c.status === 'verified' && c.independentSources < 2) err(at, '`verified` cần ≥ 2 nguồn độc lập (nếu chỉ có một thì dùng `single-source`)');
    if (c.status === 'single-source' && c.independentSources !== 1) err(at, '`single-source` phải có đúng 1 nguồn độc lập');
    if ((c.status === 'disputed' || c.status === 'unverified') && !hasText(c.notes)) err(at, `${c.status} cần ghi chú lý do`);
  }
  for (const sc of scenes) {
    for (const id of sc.claimIds) {
      const c = claims.find((x) => x.id === id);
      if (!c) err(`scene:${sc.id}`, `claimId không tồn tại: ${id}`);
      else if (c.sceneId !== sc.id) err(`scene:${sc.id}`, `claim ${id} thuộc cảnh ${c.sceneId}`);
    }
    for (const c of claims.filter((x) => x.sceneId === sc.id)) {
      if (!sc.claimIds.includes(c.id)) warn(`scene:${sc.id}`, `claim ${c.id} chưa nằm trong claimIds`);
    }
    // Cổng xuất bản: cảnh `published` không được kèm khẳng định bị chặn.
    if (sc.status === 'published') {
      for (const id of sc.claimIds) {
        const c = claims.find((x) => x.id === id);
        if (c && !PUBLISHABLE_CLAIM.includes(c.status)) err(`scene:${sc.id}`, `published nhưng claim ${id} là ${c.status}`);
      }
      if (sc.claimIds.length === 0) err(`scene:${sc.id}`, 'published nhưng không có khẳng định nào');
    }
  }

  /* ---------------------------------------------- ảnh / audio: nguồn gốc */
  for (const im of images) {
    const at = `image:${im.sceneId}`;
    const sc = scenes.find((s) => s.id === im.sceneId);
    if (!sc) err(at, 'sceneId không tồn tại');
    else if (sc.image && sc.image.file !== im.file) err(at, `file lệch scene.image.file (${im.file} ≠ ${sc.image.file})`);
    if (!hasText(im.prompt) || !hasText(im.promptVersion)) err(at, 'thiếu prompt / promptVersion');
  }
  for (const a of audio) {
    const at = `audio:${a.sceneId}.${a.lang}`;
    const sc = scenes.find((s) => s.id === a.sceneId);
    if (!sc) {
      err(at, 'sceneId không tồn tại');
      continue;
    }
    const track = sc.audio?.[a.lang];
    if (track && track.file !== a.file) err(at, `file lệch scene.audio (${a.file} ≠ ${track.file})`);
    if (env.sha256 && a.textSha256 !== env.sha256(narrationText(sc, a.lang))) {
      err(at, 'audio được dựng từ văn bản KHÁC bản hiện tại — dựng lại audio hoặc cập nhật textSha256');
    }
  }
  for (const sc of scenes) {
    if (sc.status === 'published' && env.sha256 && sc.audio?.en && !audio.some((a) => a.sceneId === sc.id && a.lang === 'en')) {
      warn(`scene:${sc.id}`, 'chưa có bản ghi nguồn gốc audio (audio.json) nên không kiểm được audio khớp văn bản');
    }
  }

  /* ------------------------------------------------------- liên kết bản đồ */
  topic.mapLinks.forEach((m, i) => {
    for (const id of m.sceneIds) if (!topic.sceneIds.includes(id)) err(`topic.mapLinks[${i}]`, `sceneId không có trong chủ đề: ${id}`);
  });
  if (topic.status === 'published') {
    for (const id of topic.sceneIds) if (!sceneIds.has(id)) err('topic', `published nhưng thiếu cảnh ${id}`);
  } else {
    for (const id of topic.sceneIds) if (!sceneIds.has(id)) warn('topic', `cảnh ${id} chưa được soạn`);
  }
  return out;
}

function checkAssets(sc: Scene, env: ValidateEnv, err: (where: string, msg: string) => void): void {
  const at = `scene:${sc.id}`;
  const published = sc.status === 'published';
  if (published && (sc.imagePending || sc.audioPending)) err(at, 'published nhưng còn cờ imagePending / audioPending');

  if (sc.image) {
    const im = sc.image;
    if (im.credit !== IMAGE_CREDIT) err(at, `image.credit phải là "${IMAGE_CREDIT}"`);
    for (const k of ['altVi', 'altEn', 'captionVi', 'captionEn'] as const) if (!hasText(im[k])) err(at, `image.${k} trống`);
    if (!/^\/history\//.test(im.file)) err(at, 'image.file phải bắt đầu bằng /history/');
    else if (published && !env.fileExists(im.file)) err(at, `ảnh không tồn tại trong public/: ${im.file}`);
  } else if (published) err(at, 'published nhưng thiếu image');

  for (const lang of ['en', 'vi'] as const) {
    const t = sc.audio?.[lang];
    if (!t) continue;
    if (!/^\/history\//.test(t.file)) err(at, `audio.${lang}.file phải bắt đầu bằng /history/`);
    else if (published && lang === 'en' && !env.fileExists(t.file)) err(at, `audio không tồn tại trong public/: ${t.file}`);
    if (!(t.durationSec > 0)) err(at, `audio.${lang}.durationSec phải > 0`);
    let last = 0;
    for (const s of t.sentences ?? []) {
      if (!(s.start >= last - 0.001) || !(s.end > s.start)) err(at, `audio.${lang}.sentences không tăng dần ở "${s.text.slice(0, 24)}"`);
      if (s.end > t.durationSec + 0.5) err(at, `audio.${lang}.sentences vượt durationSec`);
      if (s.paragraphId && !sc.paragraphs.some((p) => p.id === s.paragraphId)) err(at, `sentences.paragraphId lạ: ${s.paragraphId}`);
      last = s.end;
    }
  }
  if (published && !sc.audio?.en) err(at, 'published nhưng thiếu audio.en');
}

export const errorsOf = (issues: readonly Issue[]): Issue[] => issues.filter((i) => i.level === 'error');
