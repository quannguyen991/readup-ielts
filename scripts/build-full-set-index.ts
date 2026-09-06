import { writeFileSync } from 'node:fs';

import { ARTICLES, getArticleWithBody } from '@/data/articles';
import { QUESTIONS_PER_PASSAGE } from '@/services/questions/blueprint';
import { buildBestRuleQuestionSet } from '@/services/questions/build-set';

/**
 * Quét cả kho, ghi ra danh sách bài dựng ĐỦ 13 CÂU.
 *
 * VÌ SAO PHẢI QUÉT SẴN. Một đề thi thử phải đủ 40 câu; passage nào chỉ ra mười
 * một câu thì đề ấy không còn là đề IELTS. Nhưng biết một bài có đủ 13 câu hay
 * không thì phải dựng thử cả bộ, mà dựng thử vài trăm bài ngay lúc mở màn hình
 * Mock Tests là treo máy người dùng.
 *
 * Nên quét một lần ở đây, ghi kết quả thành dữ liệu, và màn Mock Tests chỉ việc
 * lọc theo danh sách. Chạy lại mỗi khi đổi bộ sinh hoặc thêm bài:
 *
 *     npx tsx scripts/build-full-set-index.ts
 */
const OUT = 'src/data/full-question-sets.ts';

function positionOf(tier: string | null | undefined): 1 | 2 | 3 {
  return tier === 'p3' ? 3 : tier === 'p2' ? 2 : 1;
}

const ielts = ARTICLES.filter((a) => a.exam === 'ielts' && a.licenseType !== 'headline_only');
const full: string[] = [];

for (const meta of ielts) {
  const article = getArticleWithBody(meta.id);
  if (!article) continue;
  const set = buildBestRuleQuestionSet(
    { id: article.id, title: article.title, paragraphs: article.paragraphs },
    positionOf(article.passageTier),
  );
  if (set.questions.length >= QUESTIONS_PER_PASSAGE) full.push(article.id);
}

const body = `/**
 * Bài đọc dựng được ĐỦ 13 CÂU bằng bộ sinh theo luật.
 *
 * SINH TỰ ĐỘNG — đừng sửa tay. Chạy \`npx tsx scripts/build-full-set-index.ts\`
 * sau mỗi lần đổi bộ sinh đề hoặc thêm bài vào kho.
 *
 * Màn Mock Tests chỉ được lấy bài trong danh sách này: một đề thi thử phải đủ 40
 * câu, mà passage ra mười một câu thì đề ấy không còn là đề IELTS. Bài không có
 * tên ở đây vẫn dùng bình thường ở nhánh luyện tập, chỉ là không vào đề thi thử.
 *
 * Quét ngày ${new Date().toISOString().slice(0, 10)}: ${full.length}/${ielts.length} bài đọc được.
 */
export const FULL_SET_ARTICLE_IDS: ReadonlySet<string> = new Set([
${full.map((id) => `  '${id}',`).join('\n')}
]);
`;

writeFileSync(OUT, body, 'utf8');
console.log(`${full.length}/${ielts.length} bài đủ 13 câu → ${OUT}`);
