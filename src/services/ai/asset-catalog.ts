import { iconPrompt, illustrationPrompt, thumbnailPrompt } from './prompts/image-style';

export type AssetKind = 'nav_icon' | 'question_icon' | 'topic_thumbnail' | 'illustration';

export type AssetSize = '1024x1024' | '1536x1024' | '1024x1536';

export type AssetSpec = {
  /** Khoá cache — định danh duy nhất, cũng là tên file trong Storage. */
  key: string;
  kind: AssetKind;
  prompt: string;
  size: AssetSize;
};

/** Icon cho 9 mục điều hướng. */
const NAV_ICONS: Array<{ key: string; subject: string }> = [
  { key: 'dashboard', subject: 'a simple house representing a home dashboard' },
  { key: 'practice', subject: 'a fountain pen writing on a sheet of paper' },
  { key: 'library', subject: 'an open book seen from the front' },
  { key: 'vocabulary', subject: 'a stack of vocabulary flashcards with a small letter card on top' },
  { key: 'progress', subject: 'an upward trending line chart with a small arrow' },
  { key: 'mock-tests', subject: 'a clipboard with a checklist and a small stopwatch' },
  { key: 'notes', subject: 'a notebook page with three ruled lines' },
  { key: 'bookmarks', subject: 'a ribbon bookmark' },
  { key: 'settings', subject: 'a gear with a small circle in the centre' },
];

/** Icon cho 8 dạng câu hỏi IELTS Reading. */
const QUESTION_ICONS: Array<{ key: string; subject: string }> = [
  { key: 'true_false_not_given', subject: 'a checkmark and a cross side by side inside a rounded square' },
  { key: 'yes_no_not_given', subject: 'a speech bubble containing a checkmark and a question mark' },
  { key: 'matching_headings', subject: 'two columns of items connected by curved matching lines' },
  { key: 'matching_information', subject: 'a magnifying glass over a paragraph of ruled lines' },
  { key: 'multiple_choice', subject: 'a list of four options with one radio button selected' },
  { key: 'sentence_completion', subject: 'a ruled sentence line with one blank gap and a pen tip' },
  { key: 'summary_completion', subject: 'a condensed document with an arrow pointing to a shorter document' },
  { key: 'short_answer', subject: 'a question mark next to a short ruled answer line' },
];

/** Thumbnail theo 10 chủ đề — dùng làm ảnh mặc định cho bài đọc cùng chủ đề. */
const TOPIC_THUMBNAILS: Array<{ key: string; subject: string }> = [
  { key: 'environment', subject: 'a vivid coral reef underwater with schools of small fish' },
  { key: 'technology', subject: 'a robotic hand reaching toward a soft glowing light' },
  { key: 'education', subject: 'a quiet university library reading room with tall shelves' },
  { key: 'health', subject: 'medical research glassware on a clean laboratory bench' },
  { key: 'science', subject: 'a glacier meeting dark water under an overcast sky' },
  { key: 'business', subject: 'a modern city financial district at blue hour' },
  { key: 'society', subject: 'a green sustainable city with plant-covered building facades' },
  { key: 'culture', subject: 'traditional handmade craft objects arranged on wood' },
  { key: 'history', subject: 'weathered stone columns of an ancient ruin at soft daylight' },
  { key: 'psychology', subject: 'an abstract close-up of interconnected neural-like filaments' },
];

/**
 * Illustration 3D cho banner từng trang.
 *
 * Mỗi trang một cảnh RIÊNG, không dùng lại một ảnh chung: banner là thứ đầu
 * tiên đập vào mắt khi mở trang, nên nó cũng là thứ nói cho người dùng biết họ
 * đang ở đâu. Bốn trang dùng chung một ảnh thì bốn trang trông như một.
 */
const ILLUSTRATIONS: Array<{ key: string; scene: string }> = [
  {
    key: 'dashboard-hero',
    scene:
      'an open book floating beside a small desk lamp, a coffee cup and a tiny potted plant',
  },
  {
    key: 'progress-hero',
    scene:
      'a rising bar chart beside a golden trophy on a stack of books, with a small line graph floating above',
  },
  {
    key: 'library-hero',
    scene:
      'a neat stack of colourful books with a reading lamp, a bookmark and a small potted plant',
  },
  {
    key: 'practice-hero',
    scene:
      'a floating notebook with a pencil, a stopwatch and a checkmark badge orbiting around it',
  },
  {
    key: 'writing-hero',
    scene:
      'a fountain pen beside a small folded note card, with a little line chart and a pie chart floating around them',
  },
  {
    key: 'mock-tests-hero',
    scene:
      'a clipboard holding a short answer sheet, a large stopwatch and two small stacked booklets, all floating apart',
  },
  {
    key: 'vocabulary-hero',
    scene:
      'a fan of flashcards floating above an open dictionary, with a small magnifying glass',
  },
  {
    key: 'math-hero',
    scene:
      'a calculator, a geometric cone and a ruler floating separately',
  },
  {
    key: 'notes-hero',
    scene: 'a stack of sticky notes with a pencil and a small paper clip',
  },
  {
    key: 'bookmarks-hero',
    scene: 'a closed book with several colourful ribbon bookmarks fanning out of it',
  },
  {
    key: 'upgrade-hero',
    scene: 'a glowing key unlocking a padlock above a small treasure chest of books',
  },
  {
    key: 'referral-hero',
    scene: 'two hands passing a glowing envelope, with small star badges floating around',
  },
];

/** Toàn bộ tài nguyên cần sinh ở bước 2. */
export const ASSET_CATALOG: AssetSpec[] = [
  ...NAV_ICONS.map<AssetSpec>((i) => ({
    key: `nav/${i.key}`,
    kind: 'nav_icon',
    prompt: iconPrompt(i.subject),
    size: '1024x1024',
  })),
  ...QUESTION_ICONS.map<AssetSpec>((i) => ({
    key: `question-type/${i.key}`,
    kind: 'question_icon',
    prompt: iconPrompt(i.subject),
    size: '1024x1024',
  })),
  ...TOPIC_THUMBNAILS.map<AssetSpec>((t) => ({
    key: `topic/${t.key}`,
    kind: 'topic_thumbnail',
    prompt: thumbnailPrompt(t.subject),
    size: '1536x1024',
  })),
  ...ILLUSTRATIONS.map<AssetSpec>((i) => ({
    key: `illustration/${i.key}`,
    kind: 'illustration',
    prompt: illustrationPrompt(i.scene),
    size: '1024x1024',
  })),
];

export function assetsOfKind(kind: AssetKind): AssetSpec[] {
  return ASSET_CATALOG.filter((a) => a.kind === kind);
}

/** Thumbnail riêng cho một bài đọc cụ thể (sinh theo yêu cầu ở bước 3). */
export function articleThumbnailSpec(articleId: string, subject: string): AssetSpec {
  return {
    key: `article/${articleId}`,
    kind: 'topic_thumbnail',
    prompt: thumbnailPrompt(subject),
    size: '1536x1024',
  };
}
